import { z } from "zod";

export const AIModeSchema = z.enum(["disabled", "assist", "full"]);
export type AIMode = z.infer<typeof AIModeSchema>;

export const JiraAuthSchema = z.object({
  baseUrl: z.string().url(),
  type: z.enum(["cloud", "server"]).default("cloud"),
  email: z.string().email().optional(), // Cloud basic auth
  apiToken: z.string().optional(),       // Cloud basic auth
  username: z.string().optional(),       // Server basic auth
  password: z.string().optional(),       // Server basic auth
  accessToken: z.string().optional(),    // OAuth2 support
  strictGDPR: z.boolean().optional(),    // Privacy support
});
export type JiraAuth = z.infer<typeof JiraAuthSchema>;

export const DedupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  windowHours: z.number().int().positive().default(24),
  minSimilarity: z.number().min(0).max(1).default(0.85),
});
export type DedupConfig = z.infer<typeof DedupConfigSchema>;

export const AIConfigSchema = z.object({
  mode: AIModeSchema.default("disabled"),
  provider: z.enum(["openai", "anthropic", "azure-openai", "gemini"]).optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  minConfidence: z.number().min(0).max(1).default(0.6),
  maxLogTokens: z.number().int().positive().default(8000),
});
export type AIConfig = z.infer<typeof AIConfigSchema>;

export const PipelineIQConfigSchema = z.object({
  jira: JiraAuthSchema,
  jiraProject: z.string().min(1),
  issueType: z.string().default("Bug"),
  defaultAssignee: z.string().optional(),
  defaultLabels: z.array(z.string()).default(["pipelineiq", "ci-failure"]),
  ai: AIConfigSchema.default({ mode: "disabled" }),
  dedup: DedupConfigSchema.default({}),
  maskSecrets: z.boolean().default(true),
  logExcerptLines: z.number().int().positive().default(80),
  displayMetadata: z.array(z.string()).optional(),
});

export type PipelineIQConfig = z.infer<typeof PipelineIQConfigSchema>;
