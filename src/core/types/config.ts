import { z } from "zod";
import { SeveritySchema } from "./jira-ticket.js";

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
  onClosedHit: z.enum(["reopen", "create-new", "skip"]).default("create-new"),
  reopenTransition: z.string().default("Reopen Issue"),
  closedStatuses: z.array(z.string()).default(["Done", "Resolved", "Closed"]),
});
export type DedupConfig = z.infer<typeof DedupConfigSchema>;

export const AIConfigSchema = z.object({
  mode: AIModeSchema.default("disabled"),
  provider: z.enum(["openai", "anthropic", "azure-openai", "gemini", "local"]).optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  endpoint: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  minConfidence: z.number().min(0).max(1).default(0.6),
  maxLogTokens: z.number().int().positive().default(8000),
});
export type AIConfig = z.infer<typeof AIConfigSchema>;

export const SlackConfigSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string().optional(),
  notifyOn: z.array(SeveritySchema).optional(),
  includeMetrics: z.boolean().optional(),
  username: z.string().optional(),
});
export type SlackConfig = z.infer<typeof SlackConfigSchema>;

export const TeamsConfigSchema = z.object({
  webhookUrl: z.string().url(),
  notifyOn: z.array(SeveritySchema).optional(),
  includeMetrics: z.boolean().optional(),
});
export type TeamsConfig = z.infer<typeof TeamsConfigSchema>;

export const NotificationsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  slack: SlackConfigSchema.optional(),
  teams: TeamsConfigSchema.optional(),
});
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;

export const JiraCustomFieldMappingSchema = z.object({
  externalLinks: z.string().optional(), // Default: customfield_10010
  provenance: z.string().optional(),     // Default: customfield_10011
  dedupSignature: z.string().optional(), // Default: customfield_10012
  metrics: z.string().optional(),        // Default: customfield_10013
});
export type JiraCustomFieldMapping = z.infer<typeof JiraCustomFieldMappingSchema>;

export const PipelineIQConfigSchema = z.object({
  jira: JiraAuthSchema,
  jiraProject: z.string().min(1),
  issueType: z.string().default("Bug"),
  jiraCustomFields: JiraCustomFieldMappingSchema.optional(),
  defaultAssignee: z.string().optional(),
  defaultLabels: z.array(z.string()).default(["pipelineiq", "ci-failure"]),
  ai: AIConfigSchema.default({ mode: "disabled" }),
  dedup: DedupConfigSchema.default({}),
  maskSecrets: z.boolean().default(true),
  logExcerptLines: z.number().int().positive().default(150),
  displayMetadata: z.array(z.string()).optional(),
  autoWorklog: z.boolean().default(false),
  notifications: NotificationsConfigSchema.optional(),
});

export type PipelineIQConfig = z.infer<typeof PipelineIQConfigSchema>;
