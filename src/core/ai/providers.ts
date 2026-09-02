import type { AIRequest, AIResponse, AIEngineConfig } from "./types.js";
import { BaseAIProvider, stripThinkingTags } from "./base-provider.js";

export { BaseAIProvider, stripThinkingTags };

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseAIProvider {
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
    super();
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
    const openai = new OpenAI({ apiKey: this.apiKey });

    const fallbackModels = [
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5-mini",
      "gpt-5-nano",
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5",
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-oss-120b",
      "gpt-oss-20b",
    ];

    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) candidateModels.push(m);
    }

    const defaultSystem = this.getDefaultSystemPrompt();
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
          let usageTokens: { input?: number; output?: number } | undefined;

          const effectiveSystem = request.systemPrompt || (request.isRawPrompt ? undefined : defaultSystem);
          const messages = effectiveSystem
            ? [{ role: "system", content: effectiveSystem }, { role: "user", content: prompt }]
            : [{ role: "user", content: prompt }];

          if (isResponsesApi) {
            const responsesParams: Record<string, any> = {
              model: currentModelName,
              input: messages,
              max_output_tokens: this.maxTokens,
            };

            if (this.enableThinking) {
              const effort = this.responsesApiReasoningEffort();
              responsesParams["reasoning"] = { effort };
              console.log(`[PipelineIQ] OpenAI Responses API reasoning.effort: ${effort}`);
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

            if (response.usage) {
              usageTokens = {
                input: response.usage.input_tokens,
                output: response.usage.output_tokens,
              };
            }
          } else if (isReasoning) {
            const params: Record<string, any> = {
              model: currentModelName,
              messages,
              max_completion_tokens: this.maxTokens,
            };
            if (this.enableThinking) {
              params["reasoning_effort"] = this.reasoningEffort();
              console.log(`[PipelineIQ] OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
            }
            const completion = await openai.chat.completions.create(params as any);
            content = completion.choices[0]?.message?.content ?? null;
            if (completion.usage) {
              usageTokens = {
                input: completion.usage.prompt_tokens,
                output: completion.usage.completion_tokens,
              };
            }
          } else {
            const params: Record<string, any> = {
              model: currentModelName,
              messages,
              max_tokens: this.maxTokens,
              temperature: this.temperature,
            };
            const completion = await openai.chat.completions.create(params as any);
            content = completion.choices[0]?.message?.content ?? null;
            if (completion.usage) {
              usageTokens = {
                input: completion.usage.prompt_tokens,
                output: completion.usage.completion_tokens,
              };
            }
          }

          if (!content) throw new Error("No response from OpenAI");
          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content, { ...usageTokens, model: currentModelName });
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";

          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit");
          const isRetryable = this.isRetryableError(errorMessage);

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
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider extends BaseAIProvider {
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
    super();
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

    const defaultSystem = this.getDefaultSystemPrompt();
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError: any = null;

    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using Anthropic model: ${currentModelName}`);
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const effectiveSystem = request.systemPrompt || (request.isRawPrompt ? undefined : defaultSystem);

          const params: Record<string, any> = {
            model: currentModelName,
            max_tokens: this.enableThinking
              ? Math.max(this.maxTokens, this.thinkingBudget + 1000)
              : this.maxTokens,
            messages: [{ role: "user", content: prompt }],
          };

          if (effectiveSystem) {
            params["system"] = effectiveSystem;
          }

          if (this.enableThinking) {
            params["thinking"] = { type: "enabled", budget_tokens: this.thinkingBudget };
            params["temperature"] = 1;
            console.log(`[PipelineIQ] Anthropic extended thinking enabled (budget: ${this.thinkingBudget} tokens)`);
          } else {
            params["temperature"] = this.temperature;
          }

          const message = await anthropic.messages.create(params as any);

          const textBlock = message.content.find((b: any) => b.type === "text");
          const content = textBlock?.type === "text" ? (textBlock as any).text : "";
          if (!content) throw new Error("No response from Anthropic");

          const usage = message.usage
            ? { input: message.usage.input_tokens, output: message.usage.output_tokens }
            : undefined;

          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content, { ...usage, model: currentModelName });
        } catch (error: any) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";

          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("limit_exceeded");
          const isRetryable = this.isRetryableError(errorMessage);

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
}

/**
 * Azure OpenAI provider implementation
 */
export class AzureOpenAIProvider extends BaseAIProvider {
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
    super();
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

    const defaultSystem = this.getDefaultSystemPrompt();
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
        let usageTokens: { input?: number; output?: number } | undefined;

        const effectiveSystem = request.systemPrompt || (request.isRawPrompt ? undefined : defaultSystem);
        const messages = effectiveSystem
          ? [{ role: "system", content: effectiveSystem }, { role: "user", content: prompt }]
          : [{ role: "user", content: prompt }];

        if (isResponsesApi) {
          const responsesParams: Record<string, any> = {
            model: this.deployment,
            input: messages,
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

          if (response.usage) {
            usageTokens = {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
            };
          }
        } else if (isReasoning) {
          const params: Record<string, any> = {
            model: this.deployment,
            messages,
            max_completion_tokens: this.maxTokens,
          };
          if (this.enableThinking) {
            params["reasoning_effort"] = this.reasoningEffort();
            console.log(`[PipelineIQ] Azure OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
          }
          const completion = await openai.chat.completions.create(params as any);
          content = completion.choices[0]?.message?.content ?? null;
          if (completion.usage) {
            usageTokens = {
              input: completion.usage.prompt_tokens,
              output: completion.usage.completion_tokens,
            };
          }
        } else {
          const params: Record<string, any> = {
            model: this.deployment,
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
          };
          const completion = await openai.chat.completions.create(params as any);
          content = completion.choices[0]?.message?.content ?? null;
          if (completion.usage) {
            usageTokens = {
              input: completion.usage.prompt_tokens,
              output: completion.usage.completion_tokens,
            };
          }
        }

        if (!content) throw new Error("No response from Azure OpenAI");
        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content, { ...usageTokens, model: this.model });
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";

        const isRetryable = this.isRetryableError(errorMessage);

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
}

/**
 * Local AI provider implementation for OpenAI-compatible local endpoints
 * (e.g. Ollama, Llama.cpp, LM Studio, vLLM)
 */
export class LocalAIProvider extends BaseAIProvider {
  name = "local";
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private apiKey: string;
  private enableThinking: boolean;

  constructor(config: AIEngineConfig) {
    super();
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

    const defaultSystem = this.getDefaultSystemPrompt();
    const systemContent = this.enableThinking
      ? `You are a CI/CD failure analysis expert. Before answering, think through the problem step by step inside <think></think> tags, then provide your structured JSON response outside those tags.\n\n${defaultSystem}`
      : defaultSystem;

    const maxRetries = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const effectiveSystem = request.systemPrompt || (request.isRawPrompt ? undefined : systemContent);
        const messages = effectiveSystem
          ? [{ role: "system", content: effectiveSystem }, { role: "user", content: prompt }]
          : [{ role: "user", content: prompt }];

        const completion = await client.chat.completions.create({
          model: this.model,
          messages: messages as any,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        });

        let content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from local AI");

        content = stripThinkingTags(content);

        const usageTokens = completion.usage
          ? { input: completion.usage.prompt_tokens, output: completion.usage.completion_tokens }
          : undefined;

        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content, { ...usageTokens, model: this.model });
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";

        const isRetryable = this.isRetryableError(errorMessage) || errorMessage.includes("fetch failed");

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
}
