import type { AIProviderInterface, AIRequest, AIResponse, AIEngineConfig } from "./types.js";

/**
 * Google Gemini provider implementation
 */
export class GeminiProvider implements AIProviderInterface {
  name = "gemini";
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private endpoint: string;
  private enableThinking: boolean;
  private thinkingBudget: number;

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-2.5-flash";
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint || "https://generativelanguage.googleapis.com/v1beta";
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8000;
  }

  isAvailable(): boolean {
    return true; // We rely on dynamic import in generateInsights
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    // Import Google Generative AI library dynamically
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey);

    // List of models to try in sequence if rate-limited or quota-exceeded.
    // Ordered fastest → most capable.  All names are verified real Gemini models.
    // gemini-3.1-flash-lite is stable per https://ai.google.dev/gemini-api/docs/models
    // gemini-2.0-flash is deprecated but still available as last-resort fallback.
    const fallbackModels = [
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];

    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) {
        candidateModels.push(m);
      }
    }

    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError: any = null;

    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using Gemini model: ${currentModelName}`);
      try {
        const generationConfig: Record<string, any> = {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          responseMimeType: "application/json",
        };
        if (this.enableThinking) {
          // thinkingBudget: -1 = dynamic, 0 = disabled, >0 = fixed token budget
          generationConfig["thinkingConfig"] = { thinkingBudget: this.thinkingBudget };
        }
        const model = genAI.getGenerativeModel({
          model: currentModelName,
          generationConfig,
        });

        const maxRetries = 2;
        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (request.isRawPrompt) {
              return { rootCause: text };
            }

            return this.parseResponse(text);
          } catch (error: any) {
            attempt++;
            lastError = error;
            const errorMessage = error.message || "";
            
            const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota");
            const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("Service Unavailable");

            // If it is a quota/429 error, and we have another candidate model, fall back immediately
            if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
              console.warn(`[PipelineIQ] Gemini model ${currentModelName} hit quota/rate limit. Falling back to the next available model...`);
              break;
            }

            if (isRetryable && attempt <= maxRetries) {
              const delay = Math.pow(2, attempt) * 1000;
              console.warn(`[PipelineIQ] Gemini API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            break;
          }
        }
      } catch (err: any) {
        lastError = err;
      }

      // If we successfully got a response in the try-catch block, the function has already returned.
      // If we broke out or caught an error, the loop will progress to the next candidate model.
    }

    console.error("Gemini API error after trying all candidate models:", lastError);
    throw new Error(`Gemini API error: ${lastError?.message || "Unknown error"}`);
  }

  private buildPrompt(request: AIRequest): string {
    return `You are an expert DevOps and software engineering analyst. Analyze the following CI/CD failure and provide insights.

**Failure Context:**
- Pipeline: ${request.pipelineName}
- Repository: ${request.repositoryName}
- Branch: ${request.branch}
- Environment: ${request.environment || 'Unknown'}
- Error: ${request.errorMessage || 'No error message'}
- Exit Code: ${request.exitCode || 'Unknown'}
- Failed Command: ${request.failedCommand || 'Unknown'}

**Logs:**
\`\`\`
${request.logs}
\`\`\`

${request.stackTrace ? `\n**Stack Trace:**\n\`\`\`${request.stackTrace}\`\`\`` : ''}

${request.historicalContext ? `\n**Historical Context:**\n${request.historicalContext}` : ''}

Please provide a JSON response with the following structure:
{
  "summary": "Brief summary of what went wrong (max 255 characters)",
  "rootCause": "Detailed explanation of the root cause",
  "remediation": ["Step 1: Fix this", "Step 2: Do that", "Step 3: Verify"],
  "severity": "Critical|High|Medium|Low",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "classification": "Infrastructure|Build|Deployment|Test|Dependency|Security|Authentication|Timeout|Network|CloudProvider|Unknown",
  "riskAssessment": "Brief risk assessment",
  "timeline": "Estimated time to fix",
  "failingFiles": ["src/main.ts", "package.json"]
}

Focus on actionable insights and practical solutions. Be specific and helpful.`;
  }

  private parseResponse(text: string): AIResponse {
    // With responseMimeType:"application/json" set, text should be raw JSON.
    // Fall back to regex extraction in case an older SDK version ignores the mime type.
    const jsonStr = text.trim().startsWith("{") ? text : (() => {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? m[0] : null;
    })();

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          summary: parsed.summary || "Analysis completed",
          rootCause: parsed.rootCause || "Unable to determine root cause",
          remediation: parsed.remediation || ["Review logs for more details"],
          severity: parsed.severity || "Medium",
          assignee: null,
          tags: parsed.tags || [],
          confidence: parsed.confidence ?? 0.8,
          classification: parsed.classification || "Unknown",
          riskAssessment: parsed.riskAssessment,
          timeline: parsed.timeline,
          failingFiles: Array.isArray(parsed.failingFiles) ? parsed.failingFiles : undefined,
        };
      } catch (error) {
        console.error("Failed to parse Gemini response JSON:", error);
      }
    }

    throw new Error(`Gemini returned unparseable response: ${text.slice(0, 200)}`);
  }
}
