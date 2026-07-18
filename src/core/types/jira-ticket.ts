import { z } from "zod";
import { type ComputedMetrics } from "./operational-metrics.js";

export const SeveritySchema = z.enum(["Critical", "High", "Medium", "Low"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const PrioritySchema = z.enum(["Highest", "High", "Medium", "Low", "Lowest"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const FailureCategorySchema = z.enum([
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
  "Unknown",
]);
export type FailureCategory = z.infer<typeof FailureCategorySchema>;

export const ExternalLinkSchema = z.object({
  url: z.string().url(),
  title: z.string(),
});
export type ExternalLink = z.infer<typeof ExternalLinkSchema>;

export const FieldProvenanceSchema = z.enum(["deterministic", "computed", "ai", "fallback", "history"]);
export type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;

export const JiraTicketSpecSchema = z.object({
  projectKey: z.string(),
  issueType: z.string().default("Bug"),
  summary: z.string(),
  description: z.string(),
  priority: PrioritySchema.optional(),
  severity: SeveritySchema.optional(),
  category: FailureCategorySchema.default("Unknown"),
  labels: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  environment: z.string().optional(),
  assignee: z.string().nullable().optional(),
  rca: z.string().optional(),
  remediationSteps: z.array(z.string()).optional(),
  failingFiles: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
  dedupSignature: z.string(),
  externalLinks: z.array(ExternalLinkSchema).default([]),
  provenance: z.record(z.string(), FieldProvenanceSchema).default({}),
  metrics: z.custom<ComputedMetrics>().optional(),
});

export type JiraTicketSpec = z.infer<typeof JiraTicketSpecSchema>;
