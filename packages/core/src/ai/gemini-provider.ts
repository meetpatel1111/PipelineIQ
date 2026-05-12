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
    this.model = config.model || "gemini-1.5-pro";
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
        }
      });

      const prompt = this.buildPrompt(request);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
  "summary": "Brief summary of what went wrong",
  "rootCause": "Detailed explanation of the root cause",
  "remediation": ["Step 1: Fix this", "Step 2: Do that", "Step 3: Verify"],
  "severity": "Critical|High|Medium|Low",
  "assignee": "Suggested assignee (if applicable)",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "classification": "Infrastructure|Build|Deployment|Test|Dependency|Security|Authentication|Timeout|Network|CloudProvider|Unknown",
  "riskAssessment": "Brief risk assessment",
  "timeline": "Estimated time to fix"
}

Focus on actionable insights and practical solutions. Be specific and helpful.`;
  }

  private parseResponse(text: string): AIResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || "Analysis completed",
          rootCause: parsed.rootCause || "Unable to determine root cause",
          remediation: parsed.remediation || ["Review logs for more details"],
          severity: parsed.severity || "Medium",
          assignee: parsed.assignee,
          tags: parsed.tags || [],
          confidence: parsed.confidence || 0.5,
          classification: parsed.classification || "Unknown",
          riskAssessment: parsed.riskAssessment,
          timeline: parsed.timeline
        };
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
    }

    // Fallback response if JSON parsing fails
    return {
      summary: "CI/CD failure detected",
      rootCause: "Unable to determine specific root cause from available information",
      remediation: ["Review error logs", "Check recent changes", "Verify configuration"],
      severity: "Medium",
      tags: ["ci-cd", "failure"],
      confidence: 0.3,
      classification: "Unknown"
    };
  }
}
