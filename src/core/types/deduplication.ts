import { z } from "zod";

export const DeduplicationResultSchema = z.object({
  isDuplicate: z.boolean(),
  existingIssueId: z.string().optional(),
  existingIssueKey: z.string().optional(),
  similarity: z.number().min(0).max(1).optional(),
  signature: z.string(),
  clusterId: z.string().optional(),
  relatedIncidents: z.array(z.string()).optional(),
});

export type DeduplicationResult = z.infer<typeof DeduplicationResultSchema>;

export const FailureSignatureSchema = z.object({
  repo: z.string(),
  workflow: z.string(),
  step: z.string(),
  errorPattern: z.string(),
  category: z.string(),
  environment: z.string().optional(),
});

export type FailureSignature = z.infer<typeof FailureSignatureSchema>;

export const IncidentClusterSchema = z.object({
  clusterId: z.string(),
  signature: FailureSignatureSchema,
  count: z.number().int().positive(),
  firstSeen: z.string().datetime(),
  lastSeen: z.string().datetime(),
  issueIds: z.array(z.string()),
  isActive: z.boolean().default(true),
});

export type IncidentCluster = z.infer<typeof IncidentClusterSchema>;
