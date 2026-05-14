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

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-2.5-flash";
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint || "https://generativelanguage.googleapis.com/v1beta";
  }

  isAvailable(): boolean {
    return true; // We rely on dynamic import in generateInsights
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    try {
      // Import Google Generative AI library dynamically
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          responseMimeType: "application/json",
        },
      });

      const prompt = this.buildPrompt(request);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return this.parseResponse(text);
    } catch (error: any) {
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
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
  "timeline": "Estimated time to fix"
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
        };
      } catch (error) {
        console.error("Failed to parse Gemini response JSON:", error);
      }
    }

    throw new Error(`Gemini returned unparseable response: ${text.slice(0, 200)}`);
  }
}
