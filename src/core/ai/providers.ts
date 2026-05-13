import type { AIProviderInterface, AIRequest, AIResponse, AIEngineConfig } from "./types.js";

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

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
  }

  isAvailable(): boolean {
    return true; // We rely on dynamic import in generateInsights
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI package is not available");
    }

    // Dynamic import to make OpenAI optional
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: this.apiKey });

    const prompt = this.buildPrompt(request);

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.
            
            Return a JSON object with the following fields:
            - summary: Brief human-readable failure description (max 255 characters)
            - rootCause: Most likely cause of the failure
            - remediation: Array of specific remediation steps
            - severity: Critical/High/Medium/Low based on impact
            - classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
            - confidence: 0-1 confidence score in your analysis
            - riskAssessment: Brief risk assessment for the deployment
            
            Be concise but thorough. Focus on actionable insights.`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return this.parseResponse(content);
    } catch (error) {
      throw new Error(`OpenAI API error: ${error}`);
    }
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
      // Try to parse as JSON first
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
      // Fallback parsing if JSON fails
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity") as any,
        classification: this.extractField(content, "classification") as any,
        confidence: 0.5, // Low confidence for fallback parsing
        riskAssessment: this.extractField(content, "riskAssessment"),
      };
    }
  }

  private extractField(content: string, fieldName: string): string | undefined {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    return match?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    if (!match) return [];
    
    const value = match[1]?.trim() ?? "";
    // Try to parse as array or split by common delimiters
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map(item => item.trim()).filter(Boolean);
    }
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

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-3-sonnet-20240229";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
  }

  isAvailable(): boolean {
    return true; // We rely on dynamic import in generateInsights
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error("Anthropic SDK is not available");
    }

    const { Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: this.apiKey });

    const prompt = this.buildPrompt(request);

    try {
      const message = await anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: "user",
            content: `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

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
      });

      const content = message.content[0]?.type === "text" ? message.content[0].text : "";
      if (!content) {
        throw new Error("No response from Anthropic");
      }

      return this.parseResponse(content);
    } catch (error) {
      throw new Error(`Anthropic API error: ${error}`);
    }
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
      // Try to extract JSON from response
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
    } catch {
      // Fallback parsing
    }

    // Fallback parsing if JSON extraction fails
    return {
      summary: this.extractField(content, "summary"),
      rootCause: this.extractField(content, "rootCause"),
      remediation: this.extractArrayField(content, "remediation"),
      severity: this.extractField(content, "severity") as any,
      classification: this.extractField(content, "classification") as any,
      confidence: 0.5, // Low confidence for fallback parsing
      riskAssessment: this.extractField(content, "riskAssessment"),
    };
  }

  private extractField(content: string, fieldName: string): string | undefined {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    return match?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    if (!match) return [];
    
    const value = match[1]?.trim() ?? "";
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map(item => item.trim()).filter(Boolean);
    }
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

  constructor(config: AIEngineConfig) {
    if (!config.apiKey) {
      throw new Error("Azure OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://your-resource.openai.azure.com";
    this.deployment = config.deployment || "gpt-4";
    this.model = config.model || "gpt-4";
    this.apiVersion = config.apiVersion || "2024-02-15-preview";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.1;
  }

  isAvailable(): boolean {
    return true; // We rely on dynamic import in generateInsights
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error("OpenAI package is not available");
    }

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: `${this.endpoint}/openai/deployments/${this.deployment}`,
      defaultQuery: { "api-version": this.apiVersion },
      defaultHeaders: { "api-key": this.apiKey },
    });

    const prompt = this.buildPrompt(request);

    try {
      const completion = await openai.chat.completions.create({
        model: this.deployment,
        messages: [
          {
            role: "system",
            content: `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.
            
            Return a JSON object with the following fields:
            - summary: Brief human-readable failure description (max 255 characters)
            - rootCause: Most likely cause of the failure
            - remediation: Array of specific remediation steps
            - severity: Critical/High/Medium/Low based on impact
            - classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
            - confidence: 0-1 confidence score in your analysis
            - riskAssessment: Brief risk assessment for the deployment
            
            Be concise but thorough. Focus on actionable insights.`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Azure OpenAI");
      }

      return this.parseResponse(content);
    } catch (error) {
      throw new Error(`Azure OpenAI API error: ${error}`);
    }
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
      // Fallback parsing if JSON fails
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity") as any,
        classification: this.extractField(content, "classification") as any,
        confidence: 0.5, // Low confidence for fallback parsing
        riskAssessment: this.extractField(content, "riskAssessment"),
      };
    }
  }

  private extractField(content: string, fieldName: string): string | undefined {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    return match?.[1]?.trim();
  }

  private extractArrayField(content: string, fieldName: string): string[] {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    const match = content.match(regex);
    if (!match) return [];
    
    const value = match[1]?.trim() ?? "";
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map(item => item.trim()).filter(Boolean);
    }
  }
}

/**
 * Local AI provider implementation (placeholder for local models)
 */
export class LocalAIProvider implements AIProviderInterface {
  name = "local";
  private modelPath: string;
  private endpoint: string | undefined;
  private deployment: string | undefined;
  private apiVersion: string | undefined;

  constructor(config: AIEngineConfig) {
    this.modelPath = config.modelPath || "./model";
    this.endpoint = config.endpoint;
    this.deployment = config.deployment;
    this.apiVersion = config.apiVersion;
  }

  isAvailable(): boolean {
    return true; 
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    // Placeholder implementation for local AI models
    // This would integrate with local LLM runners like Ollama, Llama.cpp, etc.
    throw new Error("Local AI provider not yet implemented");
  }
}
