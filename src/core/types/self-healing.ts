import { z } from "zod";

// ─── Fix Representation ────────────────────────────────────────────────────────

export const FileChangeSchema = z.object({
  /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
  filePath: z.string(),
  /** The action to take on this file */
  action: z.enum(["modify", "create", "delete"]),
  /** Original file content (for modify/delete — used for PR diff context) */
  originalContent: z.string().optional(),
  /** New file content after the fix */
  newContent: z.string().optional(),
  /** Human-readable explanation of what this specific change does */
  changeDescription: z.string(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

export const CodeFixSchema = z.object({
  /** Unique identifier for traceability */
  id: z.string(),
  /** Human-readable title for the fix (used as PR title) */
  title: z.string(),
  /** Detailed explanation of what the fix does and why */
  description: z.string(),
  /** List of file-level changes */
  changes: z.array(FileChangeSchema).min(1),
  /** AI confidence in this fix (0–1) */
  confidence: z.number().min(0).max(1),
  /** Failure category this fix addresses */
  category: z.string(),
  /** Risk assessment of applying this fix */
  riskLevel: z.enum(["low", "medium", "high"]),
  /** Estimated time saved by this fix (in minutes) */
  estimatedTimeSavedMinutes: z.number().optional(),
  /** Optional shell command recommended by the AI to verify this specific fix */
  verificationCommand: z.string().optional(),
  /** Optional shell command recommended by the AI to sync/regenerate lockfiles or dependencies (e.g. 'npm install', 'uv sync', 'forge build', 'bundle install') */
  packageSyncCommand: z.string().optional(),
});
export type CodeFix = z.infer<typeof CodeFixSchema>;

// ─── Self-Healing Configuration ─────────────────────────────────────────────

export const SelfHealingConfigSchema = z.object({
  /** Master switch for self-healing */
  enabled: z.boolean().default(false),
  /** Master switch for safety guardrails. Defaults to ON — enforces the confidence
   *  gate, file/line scope limits, category allow-list, and blocked-path protection.
   *  Set to false to let the AI attempt fixes on a wider range of failures. */
  enableGuardrails: z.boolean().default(true),
  /** Generate the fix but don't push/create PR */
  dryRun: z.boolean().default(false),
  /** Minimum AI confidence required to attempt a fix (0–1) */
  minConfidence: z.number().min(0).max(1).default(0.8),
  /** Maximum number of files a single fix can touch */
  maxFilesChanged: z.number().int().positive().default(10),
  /** Maximum total lines changed across all files */
  maxLinesChanged: z.number().int().positive().default(200),
  /** Failure categories eligible for self-healing (use ["*"] to allow all categories) */
  allowedCategories: z.array(z.string()).default([
    "*",
  ]),
  /** Glob patterns for files that must never be auto-fixed */
  blockedPaths: z.array(z.string()).default([
    "*.env",
    "*.env.*",
    "*secret*",
    "*credential*",
    "*password*",
    "*.pem",
    "*.key",
    "*.cert",
    ".github/workflows/*",
    ".gitlab-ci.yml",
    "azure-pipelines*.yml",
    ".npmrc",
    ".pypirc",
    "id_rsa*",
    "docker-compose*.yml",
  ]),
  /** Branch name prefix for fix branches */
  branchPrefix: z.string().default("pipelineiq/fix"),
  /** Git provider platform ("github" | "azure-devops") — auto-detected from event.source */
  platform: z.enum(["github", "azure-devops"]).optional(),
  /** GitHub token for PR creation (falls back to GITHUB_TOKEN env) */
  githubToken: z.string().optional(),
  /** Azure DevOps PAT for PR creation (falls back to SYSTEM_ACCESSTOKEN env) */
  azureToken: z.string().optional(),
  /** Add draft PR instead of ready-for-review */
  draftPr: z.boolean().default(true),
  /** Auto-assign PR reviewers (GitHub usernames or ADO identities) */
  reviewers: z.array(z.string()).default([]),
  /** PR labels to apply */
  prLabels: z.array(z.string()).default(["pipelineiq", "self-healing", "auto-fix"]),
  /** Enable local verification commands (compilation/testing/regeneration) */
  enableVerification: z.boolean().default(true),
  /** Commands to run in sequence to verify the code fix.
   *  Empty array (default) = auto-detected from package.json scripts + failure category. */
  verificationCommands: z.array(z.string()).default([]),
  /** Automatically regenerate auto-generated lockfiles (package-lock.json, yarn.lock, etc.) when desynchronization is detected */
  autoRegenerateLockfile: z.boolean().default(true),
  /** Maximum number of verification feedback retry cycles for agent self-correction (default: 3) */
  maxVerificationRetries: z.number().default(3).optional(),
});
export type SelfHealingConfig = z.infer<typeof SelfHealingConfigSchema>;

// ─── Self-Healing Result ────────────────────────────────────────────────────

export const SelfHealingResultSchema = z.object({
  /** Whether a fix was attempted */
  attempted: z.boolean(),
  /** Whether the fix was successfully applied */
  success: z.boolean(),
  /** The generated code fix (present even in dry-run) */
  fix: CodeFixSchema.optional(),
  /** URL of the created Pull Request */
  prUrl: z.string().optional(),
  /** PR number */
  prNumber: z.number().optional(),
  /** Branch name used for the fix */
  branchName: z.string().optional(),
  /** Reason if self-healing was skipped or failed */
  reason: z.string().optional(),
  /** Whether this was a dry run */
  dryRun: z.boolean().default(false),
});
export type SelfHealingResult = z.infer<typeof SelfHealingResultSchema>;
