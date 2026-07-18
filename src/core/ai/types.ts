import { z } from "zod";
import type {
  FailureEvent,
  FailureCategory,
  Severity,
  Priority,
  AIEnrichment,
  DeterministicFallback,
  EnrichmentResult,
} from "../types/index.js";

export const AIProviderSchema = z.enum(["openai", "anthropic", "azure-openai", "local", "gemini"]);
export type AIProvider = z.infer<typeof AIProviderSchema>;

export const AIRequestSchema = z.object({
  logs: z.string(),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  failedCommand: z.string().optional(),
  exitCode: z.number().int().optional(),
  pipelineName: z.string(),
  repositoryName: z.string(),
  branch: z.string(),
  environment: z.string().optional(),
  category: z.string().optional(),
  historicalContext: z.string().optional(),
  isRawPrompt: z.boolean().optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

export const AIResponseSchema = z.object({
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  remediation: z.array(z.string()).optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  postmortem: z.string().optional(),
  timeline: z.string().optional(),
  riskAssessment: z.string().optional(),
  failingFiles: z.array(z.string()).optional(),
  classification: z.enum([
    "Infrastructure",
    "Build", 
    "Deployment",
    "Test",
    "Dependency",
    "Security",
    "Authentication",
    "Timeout",
    "Network",
    "CloudProvider",
    "Unknown"
  ]).optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

export const AIEngineConfigSchema = z.object({
  provider: AIProviderSchema.optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  endpoint: z.string().optional(),
  deployment: z.string().optional(),
  apiVersion: z.string().optional(),
  modelPath: z.string().optional(),
  maxTokens: z.number().int().positive().default(1000),
  temperature: z.number().min(0).max(2).default(0.1),
  timeout: z.number().int().positive().default(30000),
  retryAttempts: z.number().int().positive().default(3),
  minConfidence: z.number().min(0).max(1).default(0.6),
  /** Enable extended thinking / reasoning for models that support it.
   *  Gemini 2.5+: uses thinkingConfig with thinkingBudget tokens.
   *  Anthropic: uses extended_thinking with budget_tokens. */
  enableThinking: z.boolean().default(false),
  /** Token budget for thinking (Gemini: thinkingBudget, Anthropic: budget_tokens).
   *  -1 = dynamic (model decides). Only used when enableThinking is true. */
  thinkingBudget: z.number().int().default(8000),
});

export type AIEngineConfig = z.infer<typeof AIEngineConfigSchema>;

export interface AIProviderInterface {
  name: string;
  isAvailable(): boolean;
  generateInsights(request: AIRequest): Promise<AIResponse>;
}

export interface IAIEngine {
  enrich(event: FailureEvent, config: AIEngineConfig): Promise<EnrichmentResult[]>;
  isAvailable(): boolean;
  getProvider(): string;
}
