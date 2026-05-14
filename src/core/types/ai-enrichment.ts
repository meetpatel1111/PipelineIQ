import { z } from "zod";

export const AIEnrichmentSchema = z.object({
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  remediation: z.string().optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  postmortem: z.string().optional(),
  timeline: z.string().optional(),
  riskAssessment: z.string().optional(),
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

export type AIEnrichment = z.infer<typeof AIEnrichmentSchema>;

export const DeterministicFallbackSchema = z.object({
  summary: z.string().optional(),
  rootCause: z.string().optional(),
  remediation: z.string().optional(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
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

export type DeterministicFallback = z.infer<typeof DeterministicFallbackSchema>;

export const EnrichmentResultSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  provenance: z.enum(["deterministic", "computed", "ai", "fallback"]),
  aiUsed: z.boolean().default(false),
  confidence: z.number().min(0).max(1).optional(),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;
