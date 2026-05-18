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

    const fallbackModels = [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
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
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const completion = await openai.chat.completions.create({
            model: currentModelName,
            messages: request.isRawPrompt ? [
              { role: "user", content: prompt }
            ] : [
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

          if (request.isRawPrompt) {
            return { rootCause: content };
          }

          return this.parseResponse(content);
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";
          
          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota") || errorMessage.includes("rate_limit");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("Service Unavailable") || errorMessage.includes("500") || errorMessage.includes("Internal Server Error");

          // Fall back to next model on quota/rate limit error
          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] OpenAI model ${currentModelName} hit quota/rate limit. Falling back to the next available model...`);
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

    const fallbackModels = [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
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
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const message = await anthropic.messages.create({
            model: currentModelName,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
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
          });

          const content = message.content[0]?.type === "text" ? message.content[0].text : "";
          if (!content) {
            throw new Error("No response from Anthropic");
          }

          if (request.isRawPrompt) {
            return { rootCause: content };
          }

          return this.parseResponse(content);
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";

          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota") || errorMessage.includes("rate_limit") || errorMessage.includes("limit_exceeded");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("Service Unavailable") || errorMessage.includes("500") || errorMessage.includes("Internal Server Error");

          // Fall back to next model on quota/rate limit error
          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] Anthropic model ${currentModelName} hit quota/rate limit. Falling back to the next available model...`);
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

    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const completion = await openai.chat.completions.create({
          model: this.deployment,
          messages: request.isRawPrompt ? [
            { role: "user", content: prompt }
          ] : [
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

        if (request.isRawPrompt) {
          return { rootCause: content };
        }

        return this.parseResponse(content);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";
        
        const isRetryable = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("Service Unavailable") || errorMessage.includes("500") || errorMessage.includes("Internal Server Error");

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
 * Local AI provider implementation for OpenAI-compatible local endpoints
 * (e.g. Ollama, Llama.cpp, LM Studio)
 */
export class LocalAIProvider implements AIProviderInterface {
  name = "local";
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private apiKey: string;

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
  }

  isAvailable(): boolean {
    return true;
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: this.baseURL, apiKey: this.apiKey });
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    
    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const completion = await client.chat.completions.create({
          model: this.model,
          messages: request.isRawPrompt ? [
            { role: "user", content: prompt }
          ] : [
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

Be concise but thorough. Focus on actionable insights.`,
            },
            { role: "user", content: prompt },
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from local AI");
        
        if (request.isRawPrompt) {
          return { rootCause: content };
        }
        
        return this.parseResponse(content);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";
        
        const isRetryable = errorMessage.includes("429") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("Service Unavailable") || errorMessage.includes("500") || errorMessage.includes("Internal Server Error") || errorMessage.includes("fetch failed");

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
          remediation: Array.isArray(parsed.remediation)
            ? parsed.remediation
            : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment,
        };
      }
    } catch {
      // fall through to low-confidence default
    }
    return { confidence: 0.5 };
  }
}
