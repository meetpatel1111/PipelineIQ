import { z } from "zod";

export const FailureSourceSchema = z.enum(["github", "azure-devops"]);
export type FailureSource = z.infer<typeof FailureSourceSchema>;

export const RepositorySchema = z.object({
  owner: z.string(),
  name: z.string(),
  url: z.string().url(),
  defaultBranch: z.string().optional(),
});
export type Repository = z.infer<typeof RepositorySchema>;

export const CommitSchema = z.object({
  sha: z.string(),
  url: z.string().url(),
  message: z.string().optional(),
  author: z.string().optional(),
  authorEmail: z.string().optional(),
});
export type Commit = z.infer<typeof CommitSchema>;

export const PullRequestSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  title: z.string(),
  author: z.string(),
});
export type PullRequest = z.infer<typeof PullRequestSchema>;

export const PipelineSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  runId: z.string(),
  runNumber: z.number().int().nonnegative().optional(),
  stage: z.string().optional(),
  job: z.string().optional(),
  step: z.string().optional(),
  task: z.string().optional(),
  runnerType: z.string().optional(),
  agentPool: z.string().optional(),
  retryCount: z.number().int().nonnegative().optional(),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

export const FailureDetailsSchema = z.object({
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
  failedStep: z.string().optional(),
  failedCommand: z.string().optional(),
  stackTrace: z.string().optional(),
  logs: z.string().default(""),
  logsTruncated: z.boolean().default(false),
});
export type FailureDetails = z.infer<typeof FailureDetailsSchema>;

export const FailureEventSchema = z.object({
  source: FailureSourceSchema,
  startedAt: z.string().datetime(),
  failedAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative().optional(),
  queueTimeMs: z.number().int().nonnegative().optional(),
  pipeline: PipelineSchema,
  repository: RepositorySchema,
  commit: CommitSchema,
  branch: z.string(),
  pullRequest: PullRequestSchema.optional(),
  environment: z.string().optional(),
  triggeredBy: z.string().optional(),
  failure: FailureDetailsSchema,
});

export type FailureEvent = z.infer<typeof FailureEventSchema>;
