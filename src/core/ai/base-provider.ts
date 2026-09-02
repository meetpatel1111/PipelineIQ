import type { AIProviderInterface, AIRequest, AIResponse } from "./types.js";

/** Strip <think>…</think> blocks emitted by local reasoning models (DeepSeek-R1, QwQ, etc.) */
export function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Pricing rates per 1M tokens (USD) for cost tracking (estimated 2026 rates).
 */
const PRICING_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-5.4-nano": { input: 0.05, output: 0.20 },
  "gpt-5.4-mini": { input: 0.15, output: 0.60 },
  "gpt-5-mini": { input: 0.15, output: 0.60 },
  "gpt-5.4": { input: 2.50, output: 10.00 },
  "gpt-5.5": { input: 3.00, output: 12.00 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "o3-mini": { input: 1.10, output: 4.40 },
  "o4-mini": { input: 1.10, output: 4.40 },
  // Anthropic
  "claude-3-5-sonnet": { input: 3.00, output: 15.00 },
  "claude-3-5-haiku": { input: 0.80, output: 4.00 },
  "claude-3-7-sonnet": { input: 3.00, output: 15.00 },
  // Google Gemini
  "gemini-2.5-flash": { input: 0.075, output: 0.30 },
  "gemini-2.5-pro": { input: 1.25, output: 5.00 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
};

/**
 * Base class for all AI Providers in PipelineIQ.
 * Eliminates boilerplate across OpenAI, Anthropic, Azure, Gemini, and Local providers.
 */
export abstract class BaseAIProvider implements AIProviderInterface {
  abstract name: string;

  abstract isAvailable(): boolean;
  abstract generateInsights(request: AIRequest): Promise<AIResponse>;

  /**
   * Standard system prompt for CI/CD failure root-cause analysis.
   */
  protected getDefaultSystemPrompt(): string {
    return `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment
- failingFiles: Array of file paths (e.g. src/main.ts) that caused the failure, based on the stack trace or logs

Be concise but thorough. Focus on actionable insights.`;
  }

  /**
   * Construct standard user diagnostic prompt from FailureEvent context.
   */
  protected buildPrompt(request: AIRequest): string {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment ?? "Not specified"}
Exit Code: ${request.exitCode ?? "Not specified"}
Failed Command: ${request.failedCommand ?? "Not specified"}

Error Message:
${request.errorMessage ?? "No error message provided"}

Stack Trace:
${request.stackTrace ?? "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext ?? "No historical context available"}

Current Category: ${request.category ?? "Not classified yet"}`;
  }

  /**
   * Parse structured JSON from model output with graceful fallback.
   */
  protected parseResponse(content: string, usage?: { input?: number; output?: number; model?: string }): AIResponse {
    const cleaned = stripThinkingTags(content);
    let result: AIResponse = { confidence: 0.5 };
    let jsonParsed = false;
    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation) ? parsed.remediation : parsed.remediation ? [parsed.remediation] : undefined,
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
          riskAssessment: parsed.riskAssessment,
          failingFiles: Array.isArray(parsed.failingFiles) ? parsed.failingFiles : undefined,
        };
        jsonParsed = true;
      }
    } catch {
      // Fall through to regex extraction
    }

    if (!jsonParsed) {
      // Fallback regex parsing for non-JSON or partial responses
      result = {
        summary: this.extractField(cleaned, "summary") || "Pipeline failure analysis completed",
        rootCause: this.extractField(cleaned, "rootCause") || cleaned.slice(0, 500),
        remediation: this.extractArrayField(cleaned, "remediation") || ["Review failed pipeline step and error diagnostics"],
        severity: (this.extractField(cleaned, "severity") as any) || "Medium",
        classification: (this.extractField(cleaned, "classification") as any) || "Build",
        confidence: 0.5,
      };
    }

    // Attach token usage and cost metrics if available (F-6)
    if (usage && (usage.input !== undefined || usage.output !== undefined)) {
      const inTokens = usage.input ?? 0;
      const outTokens = usage.output ?? 0;
      result.tokensUsed = {
        input: inTokens,
        output: outTokens,
        total: inTokens + outTokens,
      };

      if (usage.model) {
        result.estimatedCostUsd = this.calculateCost(usage.model, inTokens, outTokens);
      }
    }

    return result;
  }

  /**
   * Helper to extract key-value fields from freeform LLM output.
   */
  protected extractField(text: string, field: string): string | undefined {
    const regex = new RegExp(`"?${field}"?\\s*[:=]\\s*(?:"([^"\\r\\n]+)"|'([^'\\r\\n]+)'|([^\\r\\n,{}]+))`, "i");
    const match = text.match(regex);
    if (!match) return undefined;
    return (match[1] || match[2] || match[3])?.trim();
  }

  /**
   * Helper to extract array fields from freeform LLM output.
   */
  protected extractArrayField(text: string, field: string): string[] | undefined {
    const regex = new RegExp(`"?${field}"?\\s*[:=]\\s*\\[([^\\]]+)\\]`, "i");
    const match = text.match(regex);
    if (!match || !match[1]) return undefined;
    return match[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  /**
   * Determine if an error is transient / retryable (e.g. rate limit, timeout, server overload).
   */
  protected isRetryableError(errorMessage: string): boolean {
    const lower = errorMessage.toLowerCase();
    return (
      lower.includes("rate limit") ||
      lower.includes("429") ||
      lower.includes("503") ||
      lower.includes("502") ||
      lower.includes("500") ||
      lower.includes("timeout") ||
      lower.includes("overloaded") ||
      lower.includes("temporarily unavailable") ||
      lower.includes("econnreset")
    );
  }

  /**
   * Calculate approximate cost in USD for model invocation.
   */
  protected calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const cleanModel = model.toLowerCase();
    const rateKey = Object.keys(PRICING_PER_1M_TOKENS).find(k => cleanModel.includes(k));
    const rate = rateKey ? PRICING_PER_1M_TOKENS[rateKey] : { input: 1.0, output: 3.0 };

    if (!rate) return 0;
    const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
    return Math.round(cost * 1_000_000) / 1_000_000; // Round to 6 decimal places
  }
}
