import type { AIProviderInterface, AIRequest, AIResponse, AIEngineConfig } from "./types.js";

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Strip <think>…</think> blocks emitted by local reasoning models (DeepSeek-R1, QwQ, etc.) */
function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements AIProviderInterface {
  name = "openai";
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private endpoint: string | undefined;
  private apiVersion: string | undefined;
  private enableThinking: boolean;
  private thinkingBudget: number;

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4o";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8000;
  }

  isAvailable(): boolean {
    return true;
  }

  /** o1 / o3 / o4 series use Chat Completions with reasoning_effort */
  private isReasoningModel(model: string): boolean {
    return /^o[134][-\s]|^o[134]$/.test(model.toLowerCase());
  }

  /** gpt-5.x models use the new Responses API */
  private isResponsesApiModel(model: string): boolean {
    return /^gpt-5/.test(model.toLowerCase());
  }

  /**
   * Map thinkingBudget → reasoning effort for o-series Chat Completions.
   * Accepts "low" | "medium" | "high".
   */
  private reasoningEffort(): "low" | "medium" | "high" {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 16000) return "high";
    if (this.thinkingBudget >= 8000) return "medium";
    return "low";
  }

  /**
   * Map thinkingBudget → reasoning effort for gpt-5.x Responses API.
   * Accepts "none" | "minimal" | "low" | "medium" | "high" | "xhigh".
   */
  private responsesApiReasoningEffort(): "none" | "minimal" | "low" | "medium" | "high" | "xhigh" {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 32000) return "xhigh";
    if (this.thinkingBudget >= 16000) return "high";
    if (this.thinkingBudget >= 8000) return "medium";
    if (this.thinkingBudget >= 4000) return "low";
    if (this.thinkingBudget >= 2000) return "minimal";
    return "none";
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: this.apiKey });

    const fallbackModels = [
      // Mini / Nano first (cost-efficient)
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5-mini",
      "gpt-5-nano",
      // Frontier (no Pro)
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5",
      // Legacy stable
      "gpt-4o",
      "gpt-4o-mini",
      // Open-weight (last resort)
      "gpt-oss-120b",
      "gpt-oss-20b",
    ];

    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) candidateModels.push(m);
    }

    const systemPrompt = `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment

Be concise but thorough. Focus on actionable insights.`;

    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError: any = null;

    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using OpenAI model: ${currentModelName}`);
      const isReasoning = this.isReasoningModel(currentModelName);
      const isResponsesApi = this.isResponsesApiModel(currentModelName);
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          let content: string | null = null;

          if (isResponsesApi) {
            // ── gpt-5.x: Responses API ──────────────────────────────────────
            const inputItems: any[] = request.isRawPrompt
              ? [{ role: "user", content: prompt }]
              : [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: prompt },
                ];

            const responsesParams: Record<string, any> = {
              model: currentModelName,
              input: inputItems,
              max_output_tokens: this.maxTokens,
            };

            if (this.enableThinking) {
              const effort = this.responsesApiReasoningEffort();
              responsesParams["reasoning"] = { effort };
              console.log(`[PipelineIQ] OpenAI Responses API reasoning.effort: ${effort}`);
            }

            const response = await (openai as any).responses.create(responsesParams);

            // Extract text from output array
            const textItem = (response.output as any[]).find(
              (item: any) => item.type === "message" || item.type === "output_text"
            );
            if (textItem?.type === "message") {
              const textContent = textItem.content?.find((c: any) => c.type === "output_text");
              content = textContent?.text ?? null;
            } else if (textItem?.type === "output_text") {
              content = textItem.text ?? null;
            }
          } else if (isReasoning) {
            // ── o-series: Chat Completions with reasoning_effort ────────────
            const params: Record<string, any> = {
              model: currentModelName,
              messages: request.isRawPrompt
                ? [{ role: "user", content: prompt }]
                : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
              max_completion_tokens: this.maxTokens,
            };
            if (this.enableThinking) {
              params["reasoning_effort"] = this.reasoningEffort();
              console.log(`[PipelineIQ] OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
            }
            const completion = await openai.chat.completions.create(params as any);
            content = completion.choices[0]?.message?.content ?? null;
          } else {
            // ── Standard Chat Completions ───────────────────────────────────
            const params: Record<string, any> = {
              model: currentModelName,
              messages: request.isRawPrompt
                ? [{ role: "user", content: prompt }]
                : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
              max_tokens: this.maxTokens,
              temperature: this.temperature,
            };
            const completion = await openai.chat.completions.create(params as any);
            content = completion.choices[0]?.message?.content ?? null;
          }

          if (!content) throw new Error("No response from OpenAI");
          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content);
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";

          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("500");

          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] OpenAI model ${currentModelName} hit quota/rate limit. Falling back...`);
            break;
          }

          if (isRetryable && attempt <= maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`[PipelineIQ] OpenAI API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          break;
        }
      }
    }

    throw new Error(`OpenAI API error: ${lastError?.message || "Unknown error"}`);
  }

  private buildPrompt(request: AIRequest): string {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }

  private parseResponse(content: string): AIResponse {
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary,
        rootCause: parsed.rootCause,
        remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
        severity: parsed.severity,
        classification: parsed.classification,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment,
      };
    } catch {
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity") as any,
        classification: this.extractField(content, "classification") as any,
        confidence: 0.5,
        riskAssessment: this.extractField(content, "riskAssessment"),
      };
    }
  }

  private extractField(content: string, fieldName: string): string | undefined {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    return content.match(regex)?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try { return JSON.parse(value); } catch { return value.split(/[,;]/).map(s => s.trim()).filter(Boolean); }
  }
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements AIProviderInterface {
  name = "anthropic";
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private endpoint: string | undefined;
  private apiVersion: string | undefined;
  private enableThinking: boolean;
  private thinkingBudget: number;

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-sonnet-4-5";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8000;
  }

  isAvailable(): boolean {
    return true;
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: this.apiKey });

    // Models that support extended thinking (Claude 3.7+ and Claude 4+)
    const fallbackModels = [
      "claude-sonnet-4-5",
      "claude-opus-4-5",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
      "claude-3-haiku-20240307",
    ];

    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) candidateModels.push(m);
    }

    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError: any = null;

    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using Anthropic model: ${currentModelName}`);
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const params: Record<string, any> = {
            model: currentModelName,
            // When thinking is enabled, max_tokens must exceed budget_tokens
            max_tokens: this.enableThinking
              ? Math.max(this.maxTokens, this.thinkingBudget + 1000)
              : this.maxTokens,
            messages: [
              {
                role: "user",
                content: request.isRawPrompt ? prompt : `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment

Be concise but thorough. Focus on actionable insights.

${prompt}`,
              },
            ],
          };

          if (this.enableThinking) {
            // Extended thinking: temperature must be 1 (Anthropic requirement)
            params["thinking"] = { type: "enabled", budget_tokens: this.thinkingBudget };
            params["temperature"] = 1;
            console.log(`[PipelineIQ] Anthropic extended thinking enabled (budget: ${this.thinkingBudget} tokens)`);
          } else {
            params["temperature"] = this.temperature;
          }

          const message = await anthropic.messages.create(params as any);

          // Response may contain thinking blocks followed by text blocks — extract text
          const textBlock = message.content.find((b: any) => b.type === "text");
          const content = textBlock?.type === "text" ? (textBlock as any).text : "";
          if (!content) throw new Error("No response from Anthropic");

          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content);
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";

          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("limit_exceeded");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("500");

          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] Anthropic model ${currentModelName} hit quota/rate limit. Falling back...`);
            break;
          }

          if (isRetryable && attempt <= maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`[PipelineIQ] Anthropic API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          break;
        }
      }
    }

    throw new Error(`Anthropic API error: ${lastError?.message || "Unknown error"}`);
  }

  private buildPrompt(request: AIRequest): string {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }

  private parseResponse(content: string): AIResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment,
        };
      }
    } catch { /* fall through */ }

    return {
      summary: this.extractField(content, "summary"),
      rootCause: this.extractField(content, "rootCause"),
      remediation: this.extractArrayField(content, "remediation"),
      severity: this.extractField(content, "severity") as any,
      classification: this.extractField(content, "classification") as any,
      confidence: 0.5,
      riskAssessment: this.extractField(content, "riskAssessment"),
    };
  }

  private extractField(content: string, fieldName: string): string | undefined {
    return content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"))?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try { return JSON.parse(value); } catch { return value.split(/[,;]/).map(s => s.trim()).filter(Boolean); }
  }
}

/**
 * Azure OpenAI provider implementation
 */
export class AzureOpenAIProvider implements AIProviderInterface {
  name = "azure-openai";
  private apiKey: string;
  private endpoint: string;
  private deployment: string;
  private apiVersion: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private enableThinking: boolean;
  private thinkingBudget: number;

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Azure OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://your-resource.openai.azure.com";
    this.deployment = config.deployment || "gpt-4o";
    this.model = config.model || "gpt-4o";
    this.apiVersion = config.apiVersion || "2025-01-01-preview";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8000;
  }

  isAvailable(): boolean {
    return true;
  }

  private isReasoningModel(deployment: string): boolean {
    return /^o[134][-\s]|^o[134]$/i.test(deployment);
  }

  private isResponsesApiModel(deployment: string): boolean {
    return /^gpt-5/i.test(deployment);
  }

  private reasoningEffort(): "low" | "medium" | "high" {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 16000) return "high";
    if (this.thinkingBudget >= 8000) return "medium";
    return "low";
  }

  private responsesApiReasoningEffort(): "none" | "minimal" | "low" | "medium" | "high" | "xhigh" {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 32000) return "xhigh";
    if (this.thinkingBudget >= 16000) return "high";
    if (this.thinkingBudget >= 8000) return "medium";
    if (this.thinkingBudget >= 4000) return "low";
    if (this.thinkingBudget >= 2000) return "minimal";
    return "none";
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: `${this.endpoint}/openai/deployments/${this.deployment}`,
      defaultQuery: { "api-version": this.apiVersion },
      defaultHeaders: { "api-key": this.apiKey },
    });

    const systemPrompt = `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.`;

    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    console.log(`[PipelineIQ] Using Azure OpenAI deployment: ${this.deployment}`);
    const isReasoning = this.isReasoningModel(this.deployment);
    const isResponsesApi = this.isResponsesApiModel(this.deployment);
    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        let content: string | null = null;

        if (isResponsesApi) {
          // ── gpt-5.x: Responses API ────────────────────────────────────────
          const inputItems: any[] = request.isRawPrompt
            ? [{ role: "user", content: prompt }]
            : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];

          const responsesParams: Record<string, any> = {
            model: this.deployment,
            input: inputItems,
            max_output_tokens: this.maxTokens,
          };

          if (this.enableThinking) {
            const effort = this.responsesApiReasoningEffort();
            responsesParams["reasoning"] = { effort };
            console.log(`[PipelineIQ] Azure OpenAI Responses API reasoning.effort: ${effort}`);
          }

          const response = await (openai as any).responses.create(responsesParams);
          const textItem = (response.output as any[]).find(
            (item: any) => item.type === "message" || item.type === "output_text"
          );
          if (textItem?.type === "message") {
            const textContent = textItem.content?.find((c: any) => c.type === "output_text");
            content = textContent?.text ?? null;
          } else if (textItem?.type === "output_text") {
            content = textItem.text ?? null;
          }
        } else if (isReasoning) {
          // ── o-series: Chat Completions with reasoning_effort ──────────────
          const params: Record<string, any> = {
            model: this.deployment,
            messages: request.isRawPrompt
              ? [{ role: "user", content: prompt }]
              : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            max_completion_tokens: this.maxTokens,
          };
          if (this.enableThinking) {
            params["reasoning_effort"] = this.reasoningEffort();
            console.log(`[PipelineIQ] Azure OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
          }
          const completion = await openai.chat.completions.create(params as any);
          content = completion.choices[0]?.message?.content ?? null;
        } else {
          // ── Standard Chat Completions ─────────────────────────────────────
          const params: Record<string, any> = {
            model: this.deployment,
            messages: request.isRawPrompt
              ? [{ role: "user", content: prompt }]
              : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
          };
          const completion = await openai.chat.completions.create(params as any);
          content = completion.choices[0]?.message?.content ?? null;
        }

        if (!content) throw new Error("No response from Azure OpenAI");
        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";

        const isRetryable = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("500");

        if (isRetryable && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[PipelineIQ] Azure OpenAI API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    throw new Error(`Azure OpenAI API error: ${lastError?.message || "Unknown error"}`);
  }

  private buildPrompt(request: AIRequest): string {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }

  private parseResponse(content: string): AIResponse {
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary,
        rootCause: parsed.rootCause,
        remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
        severity: parsed.severity,
        classification: parsed.classification,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment,
      };
    } catch {
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity") as any,
        classification: this.extractField(content, "classification") as any,
        confidence: 0.5,
        riskAssessment: this.extractField(content, "riskAssessment"),
      };
    }
  }

  private extractField(content: string, fieldName: string): string | undefined {
    return content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"))?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try { return JSON.parse(value); } catch { return value.split(/[,;]/).map(s => s.trim()).filter(Boolean); }
  }
}

/**
 * Local AI provider implementation for OpenAI-compatible local endpoints
 * (e.g. Ollama, Llama.cpp, LM Studio)
 *
 * Supports reasoning models that emit <think>…</think> blocks
 * (DeepSeek-R1, QwQ, Phi-4-reasoning, etc.).  When enableThinking is true
 * a chain-of-thought instruction is prepended so non-native reasoning models
 * also reason step-by-step.
 */
export class LocalAIProvider implements AIProviderInterface {
  name = "local";
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private apiKey: string;
  private enableThinking: boolean;

  constructor(config: AIEngineConfig) {
    if (!config.endpoint) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.endpoint (e.g. 'http://localhost:11434/v1')",
      );
    }
    if (!config.model) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.model (e.g. 'llama3.2')",
      );
    }
    this.baseURL = config.endpoint;
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? 1000;
    this.temperature = config.temperature ?? 0.1;
    this.apiKey = config.apiKey ?? "local";
    this.enableThinking = config.enableThinking ?? false;
  }

  isAvailable(): boolean {
    return true;
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: this.baseURL, apiKey: this.apiKey });
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    console.log(`[PipelineIQ] Using Local AI model: ${this.model}`);

    const systemContent = this.enableThinking
      ? `You are a CI/CD failure analysis expert. Before answering, think through the problem step by step inside <think></think> tags, then provide your structured JSON response outside those tags.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.`
      : `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.`;

    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const completion = await client.chat.completions.create({
          model: this.model,
          messages: request.isRawPrompt ? [
            { role: "user", content: prompt },
          ] : [
            { role: "system", content: systemContent },
            { role: "user", content: prompt },
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        });

        let content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from local AI");

        // Strip <think>…</think> blocks emitted by DeepSeek-R1, QwQ, etc.
        content = stripThinkingTags(content);

        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";

        const isRetryable = errorMessage.includes("429") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("500") || errorMessage.includes("fetch failed");

        if (isRetryable && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[PipelineIQ] Local AI error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    throw new Error(`Local AI error: ${lastError?.message || "Unknown error"}`);
  }

  private buildPrompt(request: AIRequest): string {
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

  private parseResponse(content: string): AIResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment,
        };
      }
    } catch { /* fall through */ }
    return { confidence: 0.5 };
  }
}
