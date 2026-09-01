import { z } from "zod";

export const LogEntrySchema = z.object({
  timestamp: z.string().datetime().optional(),
  level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
  message: z.string(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

export const ParsedLogSchema = z.object({
  entries: z.array(LogEntrySchema),
  errorMessages: z.array(z.string()),
  stackTraces: z.array(z.string()),
  exitCodes: z.array(z.number().int()),
  failedCommands: z.array(z.string()),
  relevantEntries: z.array(LogEntrySchema),
  summary: z.string().optional(),
  truncated: z.boolean().default(false),
});

export type ParsedLog = z.infer<typeof ParsedLogSchema>;

export const LogFormatSchema = z.enum([
  "github-actions",
  "azure-devops",
  "terraform",
  "kubernetes",
  "docker",
  "junit",
  "generic",
]);

export type LogFormat = z.infer<typeof LogFormatSchema>;

export const ParseOptionsSchema = z.object({
  format: LogFormatSchema.default("generic"),
  maxEntries: z.number().int().positive().default(1000),
  extractStackTraces: z.boolean().default(true),
  extractErrorMessages: z.boolean().default(true),
  extractExitCodes: z.boolean().default(true),
  extractCommands: z.boolean().default(true),
  relevantKeywords: z.array(z.string()).default([
    "error",
    "failed",
    "exception",
    "timeout",
    "denied",
    "refused",
    "unauthorized",
    "forbidden",
    "not found",
    "cannot",
    "unable",
    "invalid",
  ]),
});

export type ParseOptions = z.infer<typeof ParseOptionsSchema>;
