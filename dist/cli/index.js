#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs3 from "fs-extra";
import path3 from "path";

// src/core/pipeline.ts
import { pino } from "pino";

// src/core/types/failure-event.ts
import { z } from "zod";
var FailureSourceSchema = z.enum(["github", "azure-devops"]);
var RepositorySchema = z.object({
  owner: z.string(),
  name: z.string(),
  url: z.string().url(),
  defaultBranch: z.string().optional(),
  id: z.string().optional(),
  ownerId: z.string().optional(),
  provider: z.string().optional(),
  visibility: z.string().optional(),
  clean: z.string().optional(),
  tfvcWorkspace: z.string().optional(),
  gitSubmoduleCheckout: z.string().optional()
});
var CommitSchema = z.object({
  sha: z.string(),
  url: z.string().url(),
  message: z.string().optional(),
  author: z.string().optional(),
  authorEmail: z.string().optional(),
  requestedForId: z.string().optional(),
  queuedById: z.string().optional()
});
var PullRequestSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  title: z.string(),
  author: z.string()
});
var PipelineSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  runUrl: z.string().url().optional(),
  runId: z.string(),
  runNumber: z.number().int().nonnegative().optional(),
  stage: z.string().optional(),
  job: z.string().optional(),
  step: z.string().optional(),
  task: z.string().optional(),
  runnerType: z.string().optional(),
  runnerOs: z.string().optional(),
  runnerArch: z.string().optional(),
  agentPool: z.string().optional(),
  runnerName: z.string().optional(),
  agentMachineName: z.string().optional(),
  retryCount: z.number().int().nonnegative().optional(),
  runAttempt: z.number().int().nonnegative().optional(),
  jobName: z.string().optional(),
  definitionVersion: z.string().optional(),
  definitionId: z.string().optional(),
  reason: z.string().optional(),
  sourcesDirectory: z.string().optional(),
  binariesDirectory: z.string().optional(),
  artifactStagingDirectory: z.string().optional(),
  containerId: z.string().optional(),
  repositoryLocalPath: z.string().optional(),
  workflowRef: z.string().optional(),
  workflowSha: z.string().optional(),
  runnerEnvironment: z.string().optional(),
  runnerDebug: z.boolean().optional(),
  retentionDays: z.number().int().optional(),
  actorId: z.string().optional(),
  triggeringActor: z.string().optional(),
  triggeringActorId: z.string().optional(),
  refType: z.string().optional(),
  refProtected: z.boolean().optional(),
  agentId: z.string().optional(),
  agentJobStatus: z.string().optional(),
  agentBuildDirectory: z.string().optional(),
  agentHomeDirectory: z.string().optional(),
  agentTempDirectory: z.string().optional(),
  agentToolsDirectory: z.string().optional(),
  agentWorkFolder: z.string().optional(),
  agentContainerMapping: z.string().optional(),
  agentReleaseDirectory: z.string().optional(),
  agentRootDirectory: z.string().optional(),
  stagingDirectory: z.string().optional(),
  testResultsDirectory: z.string().optional(),
  cronScheduleDisplayName: z.string().optional(),
  pipelineWorkspace: z.string().optional(),
  stageRequestedBy: z.string().optional(),
  stageRequestedForId: z.string().optional(),
  sourceTfvcShelveset: z.string().optional(),
  triggeredByBuildId: z.string().optional(),
  triggeredByDefinitionId: z.string().optional(),
  triggeredByDefinitionName: z.string().optional(),
  triggeredByBuildNumber: z.string().optional(),
  triggeredByProjectId: z.string().optional(),
  teamProjectId: z.string().optional(),
  teamProject: z.string().optional(),
  buildUri: z.string().optional(),
  buildNumber: z.string().optional(),
  environmentId: z.string().optional(),
  environmentResourceName: z.string().optional(),
  environmentResourceId: z.string().optional(),
  strategyName: z.string().optional(),
  strategyCycleName: z.string().optional(),
  checksStageAttempt: z.string().optional(),
  systemWorkFolder: z.string().optional(),
  systemCollectionId: z.string().optional(),
  systemCollectionUri: z.string().optional(),
  systemTeamFoundationCollectionUri: z.string().optional(),
  systemDebug: z.string().optional(),
  systemDefaultWorkingDirectory: z.string().optional(),
  systemHostType: z.string().optional(),
  systemJobDisplayName: z.string().optional(),
  systemJobId: z.string().optional(),
  systemJobName: z.string().optional(),
  systemPhaseAttempt: z.string().optional(),
  systemPhaseDisplayName: z.string().optional(),
  systemPhaseName: z.string().optional(),
  systemPlanId: z.string().optional(),
  systemStageAttempt: z.string().optional(),
  systemStageDisplayName: z.string().optional(),
  systemStageName: z.string().optional(),
  systemTimelineId: z.string().optional(),
  tfBuild: z.string().optional(),
  prIsFork: z.string().optional(),
  prId: z.string().optional(),
  prNumber: z.string().optional(),
  prTargetBranchName: z.string().optional(),
  prSourceBranch: z.string().optional(),
  prSourceCommitId: z.string().optional(),
  prSourceRepoUri: z.string().optional(),
  prTargetBranch: z.string().optional(),
  releaseDeploymentRequestedFor: z.string().optional(),
  releaseDeploymentRequestedForEmail: z.string().optional(),
  releaseDeploymentId: z.string().optional(),
  releaseDefinitionEnvironmentId: z.string().optional(),
  releaseDefinitionId: z.string().optional(),
  releaseDefinitionName: z.string().optional(),
  releaseEnvironmentId: z.string().optional(),
  releaseEnvironmentName: z.string().optional(),
  releasePrimaryArtifactSourceAlias: z.string().optional(),
  releaseDescription: z.string().optional(),
  releaseId: z.string().optional(),
  requestedFor: z.string().optional(),
  requestedForEmail: z.string().optional(),
  requestedForId: z.string().optional(),
  queuedBy: z.string().optional(),
  queuedById: z.string().optional(),
  sourceBranchName: z.string().optional(),
  fullSourceBranch: z.string().optional(),
  sourceVersionMessage: z.string().optional(),
  repositoryId: z.string().optional(),
  repositoryProvider: z.string().optional(),
  repositoryUri: z.string().optional(),
  releaseName: z.string().optional(),
  releaseUri: z.string().optional(),
  releaseArtifacts: z.record(z.string(), z.any()).optional(),
  triggerId: z.string().optional(),
  triggerName: z.string().optional(),
  action: z.string().optional(),
  actionPath: z.string().optional(),
  actionRepository: z.string().optional(),
  baseRef: z.string().optional(),
  headRef: z.string().optional(),
  runnerTemp: z.string().optional(),
  runnerToolCache: z.string().optional(),
  runnerWorkspace: z.string().optional(),
  workspace: z.string().optional(),
  jobStatus: z.string().optional(),
  jobContainer: z.string().optional(),
  jobServices: z.string().optional(),
  strategyJobIndex: z.number().int().optional(),
  strategyJobTotal: z.number().int().optional(),
  actionRef: z.string().optional(),
  actionStatus: z.string().optional(),
  repositoryGitUrl: z.string().optional(),
  repositoryClean: z.string().optional(),
  repositoryGitSubmoduleCheckout: z.string().optional(),
  secretSource: z.string().optional()
});
var FailureDetailsSchema = z.object({
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
  failedStep: z.string().optional(),
  failedCommand: z.string().optional(),
  stackTrace: z.string().optional(),
  logs: z.string().default(""),
  logsTruncated: z.boolean().default(false)
});
var FailureEventSchema = z.object({
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
  eventName: z.string().optional(),
  apiUrl: z.string().optional(),
  graphqlUrl: z.string().optional(),
  metadata: z.record(z.string(), z.string()).default({}),
  explicitFields: z.array(z.string()).default([]),
  failure: FailureDetailsSchema,
  eventPayload: z.any().optional()
});

// src/core/types/jira-ticket.ts
import { z as z2 } from "zod";
var SeveritySchema = z2.enum(["Critical", "High", "Medium", "Low"]);
var PrioritySchema = z2.enum(["Highest", "High", "Medium", "Low", "Lowest"]);
var FailureCategorySchema = z2.enum([
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
]);
var ExternalLinkSchema = z2.object({
  url: z2.string().url(),
  title: z2.string()
});
var FieldProvenanceSchema = z2.enum(["deterministic", "computed", "ai", "fallback", "history"]);
var JiraTicketSpecSchema = z2.object({
  projectKey: z2.string(),
  issueType: z2.string().default("Bug"),
  summary: z2.string(),
  description: z2.string(),
  priority: PrioritySchema.optional(),
  severity: SeveritySchema.optional(),
  category: FailureCategorySchema.default("Unknown"),
  labels: z2.array(z2.string()).default([]),
  components: z2.array(z2.string()).default([]),
  environment: z2.string().optional(),
  assignee: z2.string().nullable().optional(),
  rca: z2.string().optional(),
  remediationSteps: z2.array(z2.string()).optional(),
  customFields: z2.record(z2.string(), z2.unknown()).default({}),
  dedupSignature: z2.string(),
  externalLinks: z2.array(ExternalLinkSchema).default([]),
  provenance: z2.record(z2.string(), FieldProvenanceSchema).default({}),
  metrics: z2.custom().optional()
});

// src/core/types/config.ts
import { z as z4 } from "zod";

// src/core/types/self-healing.ts
import { z as z3 } from "zod";
var FileChangeSchema = z3.object({
  /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
  filePath: z3.string(),
  /** The action to take on this file */
  action: z3.enum(["modify", "create", "delete"]),
  /** Original file content (for modify/delete — used for PR diff context) */
  originalContent: z3.string().optional(),
  /** New file content after the fix */
  newContent: z3.string().optional(),
  /** Human-readable explanation of what this specific change does */
  changeDescription: z3.string()
});
var CodeFixSchema = z3.object({
  /** Unique identifier for traceability */
  id: z3.string(),
  /** Human-readable title for the fix (used as PR title) */
  title: z3.string(),
  /** Detailed explanation of what the fix does and why */
  description: z3.string(),
  /** List of file-level changes */
  changes: z3.array(FileChangeSchema).min(1),
  /** AI confidence in this fix (0–1) */
  confidence: z3.number().min(0).max(1),
  /** Failure category this fix addresses */
  category: z3.string(),
  /** Risk assessment of applying this fix */
  riskLevel: z3.enum(["low", "medium", "high"]),
  /** Estimated time saved by this fix (in minutes) */
  estimatedTimeSavedMinutes: z3.number().optional()
});
var SelfHealingConfigSchema = z3.object({
  /** Master switch for self-healing */
  enabled: z3.boolean().default(false),
  /** Master switch for safety guardrails. Defaults to ON — enforces the confidence
   *  gate, file/line scope limits, category allow-list, and blocked-path protection.
   *  Set to false to let the AI attempt fixes on a wider range of failures. */
  enableGuardrails: z3.boolean().default(true),
  /** Generate the fix but don't push/create PR */
  dryRun: z3.boolean().default(false),
  /** Minimum AI confidence required to attempt a fix (0–1) */
  minConfidence: z3.number().min(0).max(1).default(0.8),
  /** Maximum number of files a single fix can touch */
  maxFilesChanged: z3.number().int().positive().default(10),
  /** Maximum total lines changed across all files */
  maxLinesChanged: z3.number().int().positive().default(200),
  /** Failure categories eligible for self-healing */
  allowedCategories: z3.array(z3.string()).default([
    "Dependency",
    "Build",
    "Test",
    "Configuration"
  ]),
  /** Glob patterns for files that must never be auto-fixed */
  blockedPaths: z3.array(z3.string()).default([
    "*.env",
    "*.env.*",
    "*secret*",
    "*credential*",
    "*password*",
    "*.pem",
    "*.key",
    "*.cert",
    ".github/workflows/*"
  ]),
  /** Branch name prefix for fix branches */
  branchPrefix: z3.string().default("pipelineiq/fix"),
  /** Git provider platform ("github" | "azure-devops") — auto-detected from event.source */
  platform: z3.enum(["github", "azure-devops"]).optional(),
  /** GitHub token for PR creation (falls back to GITHUB_TOKEN env) */
  githubToken: z3.string().optional(),
  /** Azure DevOps PAT for PR creation (falls back to SYSTEM_ACCESSTOKEN env) */
  azureToken: z3.string().optional(),
  /** Add draft PR instead of ready-for-review */
  draftPr: z3.boolean().default(true),
  /** Auto-assign PR reviewers (GitHub usernames or ADO identities) */
  reviewers: z3.array(z3.string()).default([]),
  /** PR labels to apply */
  prLabels: z3.array(z3.string()).default(["pipelineiq", "self-healing", "auto-fix"]),
  /** Enable local verification commands (compilation/testing/regeneration) */
  enableVerification: z3.boolean().default(true),
  /** Commands to run in sequence to verify the code fix.
   *  Empty array (default) = auto-detected from package.json scripts + failure category. */
  verificationCommands: z3.array(z3.string()).default([]),
  /** Automatically regenerate auto-generated lockfiles (package-lock.json, yarn.lock, etc.) when desynchronization is detected */
  autoRegenerateLockfile: z3.boolean().default(true)
});
var SelfHealingResultSchema = z3.object({
  /** Whether a fix was attempted */
  attempted: z3.boolean(),
  /** Whether the fix was successfully applied */
  success: z3.boolean(),
  /** The generated code fix (present even in dry-run) */
  fix: CodeFixSchema.optional(),
  /** URL of the created Pull Request */
  prUrl: z3.string().optional(),
  /** PR number */
  prNumber: z3.number().optional(),
  /** Branch name used for the fix */
  branchName: z3.string().optional(),
  /** Reason if self-healing was skipped or failed */
  reason: z3.string().optional(),
  /** Whether this was a dry run */
  dryRun: z3.boolean().default(false)
});

// src/core/types/config.ts
var AIModeSchema = z4.enum(["disabled", "assist", "full"]);
var JiraAuthSchema = z4.object({
  baseUrl: z4.string().url(),
  type: z4.enum(["cloud", "server"]).default("cloud"),
  email: z4.string().email().optional(),
  // Cloud basic auth
  apiToken: z4.string().optional(),
  // Cloud basic auth
  username: z4.string().optional(),
  // Server basic auth
  password: z4.string().optional(),
  // Server basic auth
  accessToken: z4.string().optional(),
  // OAuth2 support
  strictGDPR: z4.boolean().optional()
  // Privacy support
});
var DedupConfigSchema = z4.object({
  enabled: z4.boolean().default(true),
  windowHours: z4.number().int().positive().default(24),
  minSimilarity: z4.number().min(0).max(1).default(0.85),
  onClosedHit: z4.enum(["reopen", "create-new", "skip"]).default("create-new"),
  reopenTransition: z4.string().default("Reopen Issue"),
  closedStatuses: z4.array(z4.string()).default(["Done", "Resolved", "Closed"])
});
var AIConfigSchema = z4.object({
  mode: AIModeSchema.default("disabled"),
  provider: z4.enum(["openai", "anthropic", "azure-openai", "gemini", "local"]).optional(),
  apiKey: z4.string().optional(),
  model: z4.string().optional(),
  endpoint: z4.string().optional(),
  temperature: z4.number().min(0).max(2).optional(),
  minConfidence: z4.number().min(0).max(1).default(0.6),
  maxLogTokens: z4.number().int().positive().default(8e3),
  enableThinking: z4.boolean().default(false),
  thinkingBudget: z4.number().int().default(8e3)
});
var SlackConfigSchema = z4.object({
  webhookUrl: z4.string().url(),
  channel: z4.string().optional(),
  notifyOn: z4.array(SeveritySchema).optional(),
  includeMetrics: z4.boolean().optional(),
  username: z4.string().optional()
});
var TeamsConfigSchema = z4.object({
  webhookUrl: z4.string().url(),
  notifyOn: z4.array(SeveritySchema).optional(),
  includeMetrics: z4.boolean().optional()
});
var NotificationsConfigSchema = z4.object({
  enabled: z4.boolean().optional(),
  slack: SlackConfigSchema.optional(),
  teams: TeamsConfigSchema.optional()
});
var JiraCustomFieldMappingSchema = z4.object({
  externalLinks: z4.string().optional(),
  // Default: customfield_10010
  provenance: z4.string().optional(),
  // Default: customfield_10011
  dedupSignature: z4.string().optional(),
  // Default: customfield_10012
  metrics: z4.string().optional()
  // Default: customfield_10013
});
var PipelineIQConfigSchema = z4.object({
  jira: JiraAuthSchema,
  jiraProject: z4.string().min(1),
  issueType: z4.string().default("Bug"),
  jiraCustomFields: JiraCustomFieldMappingSchema.optional(),
  defaultAssignee: z4.string().optional(),
  defaultLabels: z4.array(z4.string()).default(["pipelineiq", "ci-failure"]),
  ai: AIConfigSchema.default({ mode: "disabled" }),
  dedup: DedupConfigSchema.default({}),
  maskSecrets: z4.boolean().default(true),
  logExcerptLines: z4.number().int().positive().default(150),
  displayMetadata: z4.array(z4.string()).optional(),
  autoWorklog: z4.boolean().default(false),
  notifications: NotificationsConfigSchema.optional(),
  selfHealing: SelfHealingConfigSchema.optional()
});

// src/core/types/ai-enrichment.ts
import { z as z5 } from "zod";
var AIEnrichmentSchema = z5.object({
  summary: z5.string().optional(),
  rootCause: z5.string().optional(),
  remediation: z5.string().optional(),
  severity: z5.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z5.string().nullable().optional(),
  tags: z5.array(z5.string()).optional(),
  confidence: z5.number().min(0).max(1).optional(),
  postmortem: z5.string().optional(),
  timeline: z5.string().optional(),
  riskAssessment: z5.string().optional(),
  classification: z5.enum([
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
  ]).optional()
});
var DeterministicFallbackSchema = z5.object({
  summary: z5.string().optional(),
  rootCause: z5.string().optional(),
  remediation: z5.string().optional(),
  severity: z5.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z5.string().nullable().optional(),
  tags: z5.array(z5.string()).optional(),
  classification: z5.enum([
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
  ]).optional()
});
var EnrichmentResultSchema = z5.object({
  field: z5.string(),
  value: z5.unknown(),
  provenance: z5.enum(["deterministic", "computed", "ai", "fallback"]),
  aiUsed: z5.boolean().default(false),
  confidence: z5.number().min(0).max(1).optional()
});

// src/core/types/deduplication.ts
import { z as z6 } from "zod";
var DeduplicationResultSchema = z6.object({
  isDuplicate: z6.boolean(),
  existingIssueId: z6.string().optional(),
  existingIssueKey: z6.string().optional(),
  similarity: z6.number().min(0).max(1).optional(),
  signature: z6.string(),
  clusterId: z6.string().optional(),
  relatedIncidents: z6.array(z6.string()).optional()
});
var FailureSignatureSchema = z6.object({
  repo: z6.string(),
  workflow: z6.string(),
  step: z6.string(),
  errorPattern: z6.string(),
  category: z6.string(),
  environment: z6.string().optional()
});
var IncidentClusterSchema = z6.object({
  clusterId: z6.string(),
  signature: FailureSignatureSchema,
  count: z6.number().int().positive(),
  firstSeen: z6.string().datetime(),
  lastSeen: z6.string().datetime(),
  issueIds: z6.array(z6.string()),
  isActive: z6.boolean().default(true)
});

// src/core/types/operational-metrics.ts
import { z as z7 } from "zod";
var OperationalMetricsSchema = z7.object({
  mttrEstimate: z7.number().int().positive().optional(),
  incidentFrequency: z7.number().int().nonnegative().optional(),
  failureTrend: z7.enum(["increasing", "decreasing", "stable"]).optional(),
  teamReliabilityScore: z7.number().min(0).max(100).optional(),
  pipelineReliabilityScore: z7.number().min(0).max(100).optional(),
  failureDuration: z7.number().int().nonnegative().optional(),
  slaImpact: z7.boolean().optional(),
  sloImpact: z7.boolean().optional(),
  downtimeEstimate: z7.number().int().nonnegative().optional(),
  deploymentRiskScore: z7.number().min(0).max(10).optional(),
  blastRadius: z7.array(z7.string()).optional(),
  flakyDetection: z7.boolean().optional(),
  similarFailuresCount: z7.number().int().nonnegative().optional(),
  previousIncidentLinks: z7.array(z7.string()).optional()
});
var OwnershipRoutingSchema = z7.object({
  suggestedTeam: z7.string().optional(),
  suggestedAssignee: z7.string().optional(),
  escalationPolicy: z7.string().optional(),
  onCallEngineer: z7.string().optional(),
  serviceOwner: z7.string().optional(),
  teamSlackChannel: z7.string().optional(),
  teamsChannel: z7.string().optional()
});
var NotificationFieldsSchema = z7.object({
  slackNotificationUrl: z7.string().url().optional(),
  teamsNotificationUrl: z7.string().url().optional(),
  incidentChannel: z7.string().optional(),
  stakeholders: z7.array(z7.string()).optional(),
  notificationStatus: z7.enum(["pending", "sent", "delivered", "failed"]).optional(),
  pagerReference: z7.string().optional()
});

// src/core/jira/client.ts
import {
  createClient,
  ClientType
} from "jira.js";
import JiraApi from "jira-client";

// src/core/jira/adf.ts
function markdownToAdf(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++;
      blocks.push({
        type: "codeBlock",
        attrs: lang ? { language: lang } : {},
        content: [{ type: "text", text: codeLines.join("\n") }]
      });
      continue;
    }
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: [{ type: "text", text: headingMatch[2] }]
      });
      i++;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("|") && (lines[i + 1] ?? "").includes("---")) {
      const tableRows = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("|")) {
        const cells = (lines[i] ?? "").split("|").slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) tableRows.push(cells);
        i++;
      }
      blocks.push(buildAdfTable(tableRows));
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        const text = (lines[i] ?? "").replace(/^[-*]\s+/, "");
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: inlineMd(text) }]
        });
        i++;
      }
      blocks.push({ type: "bulletList", content: items });
      continue;
    }
    blocks.push({ type: "paragraph", content: inlineMd(line) });
    i++;
  }
  return { version: 1, type: "doc", content: blocks };
}
function inlineMd(text) {
  const nodes = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    nodes.push({
      type: "text",
      text: match[1],
      marks: [{ type: "link", attrs: { href: match[2] } }]
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }
  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}
function buildAdfTable(rows) {
  const [header, ...body] = rows;
  const content = [];
  if (header) {
    content.push({
      type: "tableRow",
      content: header.map((cell) => ({
        type: "tableHeader",
        content: [{ type: "paragraph", content: [{ type: "text", text: cell }] }]
      }))
    });
  }
  for (const row of body) {
    content.push({
      type: "tableRow",
      content: row.map((cell) => ({
        type: "tableCell",
        content: [{ type: "paragraph", content: inlineMd(cell) }]
      }))
    });
  }
  return { type: "table", content };
}

// src/core/jira/errors.ts
var JiraApiError = class _JiraApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, _JiraApiError.prototype);
  }
  status;
  body;
  name = "JiraApiError";
  toString() {
    return `${this.name}: ${this.message} (Status: ${this.status})`;
  }
  static from(error) {
    if (error instanceof _JiraApiError) {
      return error;
    }
    let parsedBody = null;
    if (typeof error.message === "string" && error.message.trim().startsWith("{")) {
      try {
        parsedBody = JSON.parse(error.message);
      } catch (e) {
      }
    }
    const status = error.status || error.statusCode || error.response?.status || parsedBody?.status || 500;
    const body = error.response?.data || error.response || error.body || parsedBody;
    let message = "";
    if (body && typeof body === "object") {
      if (Array.isArray(body.errorMessages) && body.errorMessages.length > 0) {
        message = body.errorMessages.join(", ");
      } else if (body.errors && typeof body.errors === "object") {
        const specificErrors = Object.entries(body.errors).map(([field, msg]) => `${field}: ${msg}`).join(", ");
        if (specificErrors) {
          message = specificErrors;
        }
      } else if (typeof body.message === "string" && body.message) {
        message = body.message;
      }
    }
    if (!message) {
      if (typeof error.description === "string" && error.description) {
        message = error.description;
      } else if (typeof error.message === "string" && error.message) {
        message = error.message;
      } else {
        message = "Something went wrong";
      }
    }
    return new _JiraApiError(message, status, body);
  }
};

// src/core/jira/client.ts
var JiraCloudClient = class {
  client;
  constructor(auth) {
    const authentication = {};
    if (auth.accessToken) {
      authentication.oauth2 = {
        accessToken: auth.accessToken
      };
    } else if (auth.email && auth.apiToken) {
      authentication.basic = {
        email: auth.email,
        apiToken: auth.apiToken
      };
    }
    this.client = createClient(ClientType.Version3, {
      host: auth.baseUrl.replace(/\/+$/, ""),
      authentication,
      noCheckAtlassianToken: true,
      ...auth.strictGDPR !== void 0 ? { strictGDPR: auth.strictGDPR } : {},
      middlewares: {
        onError: (error) => {
          const msg = error.message || (error.response ? `${error.response.status} ${error.response.statusText}` : JSON.stringify(error));
          console.error(`[PipelineIQ Jira Cloud Error] ${msg}`);
        }
      }
    });
  }
  async request(method, url, data, params) {
    try {
      return await this.client.sendRequest({
        method,
        url,
        data,
        params
      }, void 0);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async createIssue(spec) {
    try {
      const res = await this.client.issues.createIssue({
        fields: {
          project: { key: spec.projectKey },
          summary: spec.summary.length > 255 ? spec.summary.substring(0, 252) + "..." : spec.summary,
          description: markdownToAdf(spec.description),
          issuetype: { name: spec.issueType },
          labels: spec.labels,
          ...spec.priority ? { priority: { name: spec.priority } } : {},
          ...spec.environment ? { environment: markdownToAdf(spec.environment) } : {},
          ...spec.components.length > 0 ? { components: spec.components.map((name) => ({ name })) } : {},
          ...spec.customFields
        }
      });
      if (spec.assignee !== void 0) {
        try {
          await this.assignIssue(res.key, spec.assignee);
        } catch (assignError) {
          console.warn(`[PipelineIQ] Failed to assign issue ${res.key} to "${spec.assignee}": ${assignError}`);
        }
      }
      return res;
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async updateIssue(issueKey, spec) {
    try {
      await this.client.issues.editIssue({
        issueIdOrKey: issueKey,
        fields: {
          summary: spec.summary,
          description: markdownToAdf(spec.description),
          labels: spec.labels,
          ...spec.priority ? { priority: { name: spec.priority } } : {}
        }
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async addComment(issueKey, body) {
    try {
      await this.client.issueComments.addComment({
        issueIdOrKey: issueKey,
        comment: markdownToAdf(body)
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async findBySignature(projectKey, signature, windowHours) {
    const label = `piq-sig:${signature}`;
    const jql = `project = "${projectKey}" AND labels = "${label}" AND created >= -${windowHours}h ORDER BY created DESC`;
    try {
      const result = await this.client.sendRequest(
        {
          method: "GET",
          url: "/rest/api/3/search/jql",
          params: {
            jql,
            maxResults: 1,
            fields: "summary,status"
          }
        },
        void 0
      );
      const issue = result.issues?.[0];
      if (!issue) return null;
      return {
        id: issue.id,
        key: issue.key,
        self: issue.self,
        summary: issue.fields.summary,
        status: issue.fields.status.name
      };
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async attachFile(issueKey, filename, content) {
    try {
      await this.client.issueAttachments.addAttachment({
        issueIdOrKey: issueKey,
        attachment: {
          file: content,
          filename
        }
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async createRemoteLink(issueKey, title, url, globalId) {
    try {
      await this.client.issueRemoteLinks.createOrUpdateRemoteIssueLink({
        issueIdOrKey: issueKey,
        object: {
          title,
          url
        },
        ...globalId !== void 0 ? { globalId } : {}
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async requestFull(method, url, data, params) {
    try {
      return await this.client.sendRequestFullResponse({
        method,
        url,
        data,
        params
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async fetchAll(fetcher) {
    const allItems = [];
    let startAt = 0;
    let isLast = false;
    while (!isLast) {
      const page = await fetcher(startAt);
      allItems.push(...page.values);
      isLast = page.isLast;
      startAt += page.values.length;
    }
    return allItems;
  }
  async checkConnection() {
    try {
      await this.client.myself.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
  async getServerInfo() {
    try {
      return await this.client.serverInfo.getServerInfo();
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async doTransition(issueKey, transitionId) {
    try {
      await this.client.issues.doTransition({
        issueIdOrKey: issueKey,
        transition: { id: transitionId }
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getTransitions(issueKey) {
    try {
      const res = await this.client.issues.getTransitions({ issueIdOrKey: issueKey });
      return res.transitions || [];
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async assignIssue(issueKey, assigneeId) {
    try {
      await this.client.issues.assignIssue({
        issueIdOrKey: issueKey,
        accountId: assigneeId
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getIssue(issueKey) {
    try {
      return await this.client.issues.getIssue({
        issueIdOrKey: issueKey
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async deleteIssue(issueKey) {
    try {
      await this.client.issues.deleteIssue({
        issueIdOrKey: issueKey
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async bulkFetchIssues(issueKeys) {
    if (issueKeys.length === 0) return [];
    try {
      const jql = `key in (${issueKeys.map((k) => `"${k}"`).join(",")})`;
      const res = await this.client.issueSearch.searchForIssuesUsingJql({
        jql,
        maxResults: issueKeys.length
      });
      return res.issues || [];
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async bulkCreateIssues(specs) {
    if (specs.length === 0) return [];
    try {
      const res = await this.client.issues.createIssues({
        issueUpdates: specs.map((spec) => ({
          fields: {
            project: { key: spec.projectKey },
            summary: spec.summary.length > 255 ? spec.summary.substring(0, 252) + "..." : spec.summary,
            description: markdownToAdf(spec.description),
            issuetype: { name: spec.issueType },
            labels: spec.labels,
            ...spec.priority ? { priority: { name: spec.priority } } : {},
            ...spec.environment ? { environment: markdownToAdf(spec.environment) } : {},
            ...spec.components.length > 0 ? { components: spec.components.map((name) => ({ name })) } : {},
            ...spec.customFields
          }
        }))
      });
      const results = res.issues || [];
      for (let i = 0; i < results.length; i++) {
        const spec = specs[i];
        const result = results[i];
        if (spec && result && spec.assignee !== void 0 && result.key) {
          try {
            await this.assignIssue(result.key, spec.assignee);
          } catch (assignError) {
            console.warn(`[PipelineIQ] Failed to bulk-assign issue ${result.key} to "${spec.assignee}": ${assignError}`);
          }
        }
      }
      return results;
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getCreateIssueMeta(projectKeys, issueTypeNames) {
    try {
      return await this.client.issues.getCreateIssueMeta({
        projectKeys: projectKeys || [],
        issuetypeNames: issueTypeNames || [],
        expand: "projects.issuetypes.fields"
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getEditIssueMeta(issueKey) {
    try {
      return await this.client.issues.getEditIssueMeta({
        issueIdOrKey: issueKey
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  getApiPath(path4) {
    return `/rest/api/3${path4}`;
  }
  formatDescription(text) {
    return markdownToAdf(text);
  }
  formatAssignee(assigneeId) {
    return { accountId: assigneeId };
  }
};
var JiraServerClient = class {
  client;
  constructor(auth) {
    const url = new URL(auth.baseUrl);
    this.client = new JiraApi({
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port || (url.protocol === "https:" ? "443" : "80"),
      username: auth.username || auth.email?.split("@")[0] || "admin",
      password: auth.apiToken,
      apiVersion: "2",
      strictSSL: true
    });
  }
  async request(method, url, data, params) {
    try {
      const options = {
        method,
        uri: this.client.makeUri({ pathname: url, query: params }),
        body: data,
        json: true
      };
      return await this.client.doRequest(options);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async createIssue(spec) {
    try {
      const res = await this.client.addNewIssue({
        fields: {
          project: { key: spec.projectKey },
          summary: spec.summary,
          // Jira Server uses Wiki Markup, not ADF
          description: spec.description,
          issuetype: { name: spec.issueType },
          labels: spec.labels,
          ...spec.priority ? { priority: { name: spec.priority } } : {},
          ...spec.environment ? { environment: spec.environment } : {},
          ...spec.components.length > 0 ? { components: spec.components.map((name) => ({ name })) } : {},
          ...spec.customFields
        }
      });
      if (spec.assignee !== void 0) {
        try {
          await this.assignIssue(res.key, spec.assignee);
        } catch (assignError) {
          console.warn(`[PipelineIQ] Failed to assign issue ${res.key} to "${spec.assignee}": ${assignError}`);
        }
      }
      return {
        id: res.id,
        key: res.key,
        self: res.self
      };
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async updateIssue(issueKey, spec) {
    try {
      await this.client.updateIssue(issueKey, {
        fields: {
          summary: spec.summary,
          description: spec.description,
          labels: spec.labels,
          ...spec.priority ? { priority: { name: spec.priority } } : {}
        }
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async addComment(issueKey, body) {
    try {
      await this.client.addComment(issueKey, body);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async findBySignature(projectKey, signature, windowHours) {
    const label = `piq-sig:${signature}`;
    const jql = `project = "${projectKey}" AND labels = "${label}" AND created >= -${windowHours}h ORDER BY created DESC`;
    try {
      const result = await this.client.searchJira(jql, {
        maxResults: 1,
        fields: ["summary", "status"]
      });
      const issue = result.issues?.[0];
      if (!issue) return null;
      return {
        id: issue.id,
        key: issue.key,
        self: issue.self,
        summary: issue.fields.summary,
        status: issue.fields.status.name
      };
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async attachFile(issueKey, filename, content) {
    try {
      await this.client.addAttachmentOnIssue(issueKey, content);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async createRemoteLink(issueKey, title, url, globalId) {
    try {
      await this.client.createRemoteLink(issueKey, {
        object: {
          url,
          title
        },
        globalId
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async requestFull(method, url, data, params) {
    const data_res = await this.request(method, url, data, params);
    return { data: data_res };
  }
  async fetchAll(fetcher) {
    const allItems = [];
    let startAt = 0;
    let isLast = false;
    while (!isLast) {
      const page = await fetcher(startAt);
      allItems.push(...page.values);
      isLast = page.isLast;
      startAt += page.values.length;
    }
    return allItems;
  }
  async checkConnection() {
    try {
      await this.client.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
  async getServerInfo() {
    try {
      return await this.client.getServerInfo();
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async doTransition(issueKey, transitionId) {
    try {
      await this.client.transitionIssue(issueKey, {
        transition: { id: transitionId }
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getTransitions(issueKey) {
    try {
      const res = await this.client.listTransitions(issueKey);
      return res.transitions || [];
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async assignIssue(issueKey, assigneeId) {
    try {
      await this.client.updateAssignee(issueKey, assigneeId);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getIssue(issueKey) {
    try {
      return await this.client.findIssue(issueKey);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async deleteIssue(issueKey) {
    try {
      await this.client.deleteIssue(issueKey);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async bulkFetchIssues(issueKeys) {
    if (issueKeys.length === 0) return [];
    try {
      const jql = `key in (${issueKeys.map((k) => `"${k}"`).join(",")})`;
      const res = await this.client.searchJira(jql);
      return res.issues || [];
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async bulkCreateIssues(specs) {
    const results = [];
    for (const spec of specs) {
      results.push(await this.createIssue(spec));
    }
    return results;
  }
  async getCreateIssueMeta(projectKeys, issueTypeNames) {
    try {
      return await this.client.getIssueCreateMetadata({
        projectKeys,
        issuetypeNames: issueTypeNames,
        expand: "projects.issuetypes.fields"
      });
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  async getEditIssueMeta(issueKey) {
    try {
      return await this.request("GET", `/issue/${issueKey}/editmeta`);
    } catch (error) {
      throw JiraApiError.from(error);
    }
  }
  getApiPath(path4) {
    return `/rest/api/2${path4}`;
  }
  formatDescription(text) {
    return text;
  }
  formatAssignee(assigneeId) {
    return { name: assigneeId };
  }
};
function createJiraClient(auth) {
  if (auth.type === "server") {
    return new JiraServerClient(auth);
  } else {
    return new JiraCloudClient(auth);
  }
}

// src/core/jira/enhanced-client.ts
var EnhancedJiraClient = class {
  client;
  customFieldMapping;
  isCloud;
  constructor(auth, customFieldMapping = {}) {
    this.client = createJiraClient(auth);
    this.customFieldMapping = customFieldMapping;
    this.isCloud = auth.type !== "server";
  }
  // Required JiraClient interface methods - delegate to wrapped client
  async createIssue(spec) {
    return await this.client.createIssue(spec);
  }
  async updateIssue(issueKey, spec) {
    return await this.client.updateIssue(issueKey, spec);
  }
  async addComment(issueKey, body) {
    return await this.client.addComment(issueKey, body);
  }
  async findBySignature(projectKey, signature, windowHours) {
    return await this.client.findBySignature(projectKey, signature, windowHours);
  }
  async attachFile(issueKey, filename, content) {
    return await this.client.attachFile(issueKey, filename, content);
  }
  async createRemoteLink(issueKey, title, url, globalId) {
    return await this.client.createRemoteLink(issueKey, title, url, globalId);
  }
  async fetchAll(fetcher) {
    return await this.client.fetchAll(fetcher);
  }
  async request(method, url, data, params) {
    return await this.client.request(method, url, data, params);
  }
  async requestFull(method, url, data, params) {
    return await this.client.requestFull(method, url, data, params);
  }
  async checkConnection() {
    return await this.client.checkConnection();
  }
  async getServerInfo() {
    return await this.client.getServerInfo();
  }
  async doTransition(issueKey, transitionId) {
    return await this.client.doTransition(issueKey, transitionId);
  }
  async getTransitions(issueKey) {
    return await this.client.getTransitions(issueKey);
  }
  async assignIssue(issueKey, assigneeId) {
    return await this.client.assignIssue(issueKey, assigneeId);
  }
  async getIssue(issueKey) {
    return await this.client.getIssue(issueKey);
  }
  async deleteIssue(issueKey) {
    return await this.client.deleteIssue(issueKey);
  }
  async bulkFetchIssues(issueKeys) {
    return await this.client.bulkFetchIssues(issueKeys);
  }
  async bulkCreateIssues(specs) {
    return await this.client.bulkCreateIssues(specs);
  }
  async getCreateIssueMeta(projectKeys, issueTypeNames) {
    return await this.client.getCreateIssueMeta(projectKeys, issueTypeNames);
  }
  async getEditIssueMeta(issueKey) {
    return await this.client.getEditIssueMeta(issueKey);
  }
  getApiPath(path4) {
    return this.client.getApiPath(path4);
  }
  formatDescription(text) {
    return this.client.formatDescription(text);
  }
  formatAssignee(assigneeId) {
    return this.client.formatAssignee(assigneeId);
  }
  /**
   * Create issue with enhanced metadata from PRD
   * Supports all 80-120 operational fields
   */
  async createEnhancedIssue(spec) {
    const payload = this.buildEnhancedPayload(spec);
    const res = await this.request("POST", this.getApiPath("/issue"), payload);
    if (spec.assignee !== void 0) {
      try {
        await this.assignIssue(res.key || res.id, spec.assignee);
      } catch (assignError) {
        console.warn(`[PipelineIQ] Failed to assign enhanced issue to "${spec.assignee}": ${assignError}`);
      }
    }
    return res;
  }
  /**
   * Update issue with enhanced metadata
   */
  async updateEnhancedIssue(issueKey, spec) {
    const payload = {
      fields: this.buildEnhancedFields(spec)
    };
    await this.request("PUT", this.getApiPath(`/issue/${issueKey}`), payload);
    if (spec.assignee !== void 0) {
      try {
        await this.assignIssue(issueKey, spec.assignee);
      } catch (assignError) {
        console.warn(`[PipelineIQ] Failed to update assignee for enhanced issue ${issueKey} to "${spec.assignee}": ${assignError}`);
      }
    }
  }
  /**
   * Add multiple comments in bulk
   */
  async addBulkComments(issueKey, comments) {
    for (const comment of comments) {
      await this.addComment(issueKey, comment);
    }
  }
  /**
   * Add external links to issue
   */
  async addExternalLinks(issueKey, links) {
    for (const link of links) {
      const payload = {
        object: {
          url: link.url,
          title: link.title,
          globalId: link.url
        }
      };
      await this.request("POST", this.getApiPath(`/issue/${issueKey}/remotelink`), payload);
    }
  }
  /**
   * Search issues with advanced JQL
   */
  async advancedSearch(jql, options = {}) {
    if (this.isCloud) {
      const payload = {
        jql,
        maxResults: options.maxResults || 50,
        fields: options.fields || ["summary", "status", "created", "updated", "priority", "labels"]
      };
      if (options.expand && options.expand.length > 0) {
        payload.expand = options.expand.join(",");
      }
      const result = await this.request("POST", this.getApiPath("/search/jql"), payload);
      return {
        issues: result.issues || [],
        total: result.total ?? 0,
        startAt: result.startAt ?? 0,
        maxResults: result.maxResults ?? payload.maxResults
      };
    } else {
      const payload = {
        jql,
        maxResults: options.maxResults || 50,
        startAt: options.startAt || 0,
        fields: options.fields || ["summary", "status", "created", "updated", "priority", "labels"],
        expand: options.expand || []
      };
      return await this.request("POST", this.getApiPath("/search"), payload);
    }
  }
  /**
   * Find issues by multiple criteria
   */
  async findSimilarIssues(projectKey, criteria) {
    const jqlParts = [`project = "${projectKey}"`, "resolution = Unresolved"];
    if (criteria.signature) {
      jqlParts.push(`labels = "piq-sig:${criteria.signature}"`);
    }
    if (criteria.category) {
      jqlParts.push(`labels = "piq-cat:${criteria.category.toLowerCase()}"`);
    }
    if (criteria.repository) {
      jqlParts.push(`labels = "repo:${criteria.repository}"`);
    }
    if (criteria.branch) {
      jqlParts.push(`labels = "branch:${criteria.branch}"`);
    }
    if (criteria.timeWindow) {
      jqlParts.push(`created >= -${criteria.timeWindow}h`);
    }
    const jql = jqlParts.join(" AND ");
    const result = await this.advancedSearch(jql, { maxResults: 10 });
    return result.issues;
  }
  /**
   * Get issue with all fields including custom fields
   */
  async getFullIssue(issueKey) {
    const expand = [
      "renderedFields",
      "names",
      "schema",
      "transitions",
      "operations",
      "editmeta",
      "changelog",
      "versionedRepresentations"
    ].join(",");
    return await this.request("GET", this.getApiPath(`/issue/${issueKey}?expand=${expand}`));
  }
  /**
   * Add worklog entry
   */
  async addWorklog(issueKey, timeSpentSeconds, comment) {
    const payload = {
      timeSpentSeconds,
      comment: comment ? markdownToAdf(comment) : void 0
    };
    await this.request("POST", this.getApiPath(`/issue/${issueKey}/worklog`), payload);
  }
  /**
   * Transition issue to new status
   */
  async transitionIssue(issueKey, transitionName, comment) {
    const transitions = await this.request("GET", this.getApiPath(`/issue/${issueKey}/transitions`));
    const transition = transitions.transitions.find(
      (t) => t.name.toLowerCase() === transitionName.toLowerCase()
    );
    if (!transition) {
      throw new JiraApiError(`Transition "${transitionName}" not available`, 400);
    }
    const payload = {
      transition: { id: transition.id }
    };
    if (comment) {
      payload.update = {
        comment: [{ add: { body: markdownToAdf(comment) } }]
      };
    }
    await this.request("POST", this.getApiPath(`/issue/${issueKey}/transitions`), payload);
  }
  /**
   * Add watchers to issue
   */
  async addWatchers(issueKey, watchers) {
    for (const watcher of watchers) {
      await this.request("POST", this.getApiPath(`/issue/${issueKey}/watchers`), watcher);
    }
  }
  /**
   * Link issues together
   */
  async linkIssues(fromIssueKey, toIssueKey, linkType = "Relates") {
    const payload = {
      outwardIssue: { key: fromIssueKey },
      inwardIssue: { key: toIssueKey },
      type: { name: linkType }
    };
    await this.request("POST", this.getApiPath("/issueLink"), payload);
  }
  /**
   * Get project metadata
   */
  async getProject(projectKey) {
    return await this.request("GET", this.getApiPath(`/project/${projectKey}`));
  }
  /**
   * Get issue types for project
   */
  async getIssueTypes(projectKey) {
    return await this.request("GET", this.getApiPath(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`));
  }
  /**
   * Build enhanced payload with all PRD fields
   */
  buildEnhancedPayload(spec) {
    return {
      fields: this.buildEnhancedFields(spec)
    };
  }
  /**
   * Build enhanced fields object with all operational metadata
   */
  buildEnhancedFields(spec) {
    const baseFields = {
      project: { key: spec.projectKey },
      summary: spec.summary.length > 255 ? spec.summary.substring(0, 252) + "..." : spec.summary,
      description: this.formatDescription(spec.description),
      issuetype: { name: spec.issueType },
      labels: spec.labels,
      ...spec.priority ? { priority: { name: spec.priority } } : {},
      ...spec.environment ? { environment: this.formatDescription(spec.environment) } : {},
      ...spec.components.length > 0 ? { components: spec.components.map((name) => ({ name })) } : {},
      ...spec.customFields
    };
    const mapping = {
      externalLinks: this.customFieldMapping.externalLinks || "customfield_10010",
      provenance: this.customFieldMapping.provenance || "customfield_10011",
      dedupSignature: this.customFieldMapping.dedupSignature || "customfield_10012",
      metrics: this.customFieldMapping.metrics || "customfield_10013"
    };
    const enhancedFields = {
      ...baseFields,
      // External links
      ...spec.externalLinks && Array.isArray(spec.externalLinks) && spec.externalLinks.length > 0 ? {
        [mapping.externalLinks]: {
          type: "com.atlassian.jira.plugin.system.external-links:external-links",
          value: spec.externalLinks
        }
      } : {},
      // Provenance tracking
      ...spec.provenance && Object.keys(spec.provenance).length > 0 ? {
        [mapping.provenance]: {
          type: "json",
          value: JSON.stringify(spec.provenance)
        }
      } : {},
      // Dedup signature
      ...spec.dedupSignature ? {
        [mapping.dedupSignature]: spec.dedupSignature
      } : {},
      // Operational Metrics
      ...spec.metrics ? {
        [mapping.metrics]: {
          type: "json",
          value: JSON.stringify(spec.metrics)
        }
      } : {}
    };
    return enhancedFields;
  }
};

// src/core/jira/index.ts
function createEnhancedJiraClient(auth, customFields) {
  return new EnhancedJiraClient(auth, customFields);
}

// src/core/jira/history.ts
var HistoryService = class {
  constructor(jira, projectKey) {
    this.jira = jira;
    this.projectKey = projectKey;
  }
  jira;
  projectKey;
  /**
   * Get failure history for a specific signature
   */
  async getHistory(signature, windowDays = 30) {
    const jql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND created >= -${windowDays}d ORDER BY created DESC`;
    const result = await this.jira.advancedSearch(jql, {
      maxResults: 50,
      fields: ["created", "status", "resolution"]
    });
    const issues = result.issues;
    const keys = issues.map((i) => i.key);
    const resolvedCount = issues.filter((i) => i.fields.resolution !== null).length;
    return {
      similarCount: result.total,
      isFlaky: result.total > 2 && resolvedCount > 0,
      previousIncidentKeys: keys,
      lastOccurred: issues.length > 0 ? new Date(issues[0].fields.created) : void 0,
      trend: this.calculateTrend(issues),
      relatedKeys: []
    };
  }
  /**
   * Search for related incidents using fuzzy keyword matching (JQL ~ operator)
   */
  async searchRelatedByKeywords(keywords, windowDays = 30) {
    if (keywords.length === 0) return [];
    const cleanKeywords = keywords.map((k) => k.trim()).filter((k) => k.length > 5 && !k.includes(" ")).slice(0, 3);
    if (cleanKeywords.length === 0) return [];
    const keywordQuery = cleanKeywords.map((k) => `text ~ "${k}"`).join(" OR ");
    const jql = `project = "${this.projectKey}" AND (${keywordQuery}) AND created >= -${windowDays}d ORDER BY created DESC`;
    try {
      const result = await this.jira.advancedSearch(jql, { maxResults: 5 });
      return result.issues.map((i) => i.key);
    } catch (error) {
      console.warn(`[PipelineIQ] Keyword search failed: ${error}`);
      return [];
    }
  }
  /**
   * Compute MTTR and blast radius from Jira history.
   *
   * These use different keys on purpose:
   *   - MTTR      → the per-repo dedup `signature` (how long THIS exact failure takes
   *                 to resolve in THIS repo). Resolved tickets only.
   *   - Blast radius → the repo-independent `fingerprint` (how many DISTINCT repos this
   *                 class of failure touches). All tickets in the window, plus the current
   *                 repo, since its ticket does not exist in Jira yet at enrichment time.
   */
  async getMetrics(signature, fingerprint2, currentRepo, windowDays = 30) {
    const mttrJql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND resolution != Unresolved AND created >= -${windowDays}d ORDER BY created DESC`;
    const blastJql = `project = "${this.projectKey}" AND labels = "piq-fp:${fingerprint2}" AND created >= -${windowDays}d`;
    try {
      const [mttrResult, blastResult] = await Promise.all([
        this.jira.advancedSearch(mttrJql, {
          maxResults: 50,
          // Increase sample for better metrics
          fields: ["created", "resolutiondate"]
        }),
        this.jira.advancedSearch(blastJql, {
          maxResults: 100,
          fields: ["labels"]
        })
      ]);
      const durations = [];
      for (const issue of mttrResult.issues) {
        const created = new Date(issue.fields.created).getTime();
        const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : null;
        if (resolved !== null) {
          durations.push((resolved - created) / (1e3 * 60 * 60));
        }
      }
      const repoSet = /* @__PURE__ */ new Set([currentRepo]);
      for (const issue of blastResult.issues) {
        const labels = issue.fields.labels ?? [];
        for (const label of labels) {
          if (label.startsWith("piq-repo:")) {
            repoSet.add(label.slice("piq-repo:".length));
          }
        }
      }
      const avg = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : void 0;
      const mttrHours = avg !== void 0 ? parseFloat(avg.toFixed(1)) : void 0;
      return {
        ...mttrHours !== void 0 && { mttrHours },
        ...repoSet.size > 1 && { blastRadius: repoSet.size },
        sampleSize: mttrResult.total
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Metrics computation failed: ${error}`);
      return { sampleSize: 0 };
    }
  }
  calculateTrend(issues) {
    if (issues.length < 5) return "stable";
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1e3;
    const recentWeek = issues.filter((i) => {
      const created = new Date(i.fields.created).getTime();
      return created > now - weekMs;
    }).length;
    const priorWeek = issues.filter((i) => {
      const created = new Date(i.fields.created).getTime();
      return created <= now - weekMs && created > now - 2 * weekMs;
    }).length;
    if (recentWeek > priorWeek + 1) return "worsening";
    if (recentWeek < priorWeek - 1 && priorWeek > 0) return "improving";
    return "stable";
  }
};

// src/core/dedup.ts
import { createHash } from "crypto";
function computeDedupSignature(event, category) {
  const parts = [
    event.repository.owner,
    event.repository.name,
    event.pipeline.name,
    event.pipeline.step ?? event.failure.failedStep ?? "",
    category,
    fingerprint(event.failure.errorMessage ?? event.failure.logs.slice(0, 2e3))
  ].join("|");
  return createHash("sha1").update(parts).digest("hex").slice(0, 16);
}
function computeFailureFingerprint(event, category) {
  const parts = [
    category,
    fingerprint(event.failure.errorMessage ?? event.failure.logs.slice(0, 2e3))
  ].join("|");
  return createHash("sha1").update(parts).digest("hex").slice(0, 16);
}
function fingerprint(text) {
  return text.replace(/\b[0-9a-f]{8,}\b/gi, "X").replace(/\b\d+\b/g, "N").replace(/(\/[\w.\-]+)+/g, "/PATH").replace(/\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+/g, "TIMESTAMP").replace(/\s+/g, " ").trim().slice(0, 500);
}

// src/core/enrichers/history.ts
function createHistoryEnricher(jira) {
  return {
    name: "history",
    source: "history",
    async enrich(ctx) {
      const signature = ctx.fields.dedupSignature;
      const historyService = new HistoryService(jira, ctx.config.jiraProject);
      const errorMessage = ctx.event.failure.errorMessage ?? "";
      const keywords = [
        ...ctx.event.failure.failedCommand ? [ctx.event.failure.failedCommand] : [],
        ...errorMessage ? [errorMessage.split(":")[0]] : []
      ];
      try {
        let history;
        if (signature) {
          const category = ctx.fields.category ?? "Unknown";
          const fingerprint2 = computeFailureFingerprint(ctx.event, category);
          const currentRepo = `${ctx.event.repository.owner}/${ctx.event.repository.name}`;
          const [fetchedHistory, metrics] = await Promise.all([
            historyService.getHistory(signature),
            historyService.getMetrics(signature, fingerprint2, currentRepo)
          ]);
          history = fetchedHistory;
          ctx.metrics = metrics;
        }
        const relatedKeys = await historyService.searchRelatedByKeywords(keywords);
        ctx.history = {
          similarCount: history?.similarCount ?? 0,
          isFlaky: history?.isFlaky ?? false,
          previousIncidentKeys: history?.previousIncidentKeys ?? [],
          trend: history?.trend,
          relatedKeys: relatedKeys.filter((k) => !history?.previousIncidentKeys.includes(k))
        };
      } catch (error) {
        console.warn(`[PipelineIQ] History enrichment failed: ${error}`);
      }
    }
  };
}

// src/core/signatures.ts
var SIGNATURES = [
  {
    id: "terraform-state-lock",
    category: "Infrastructure",
    pattern: /Error acquiring (the )?state lock/i,
    cause: "Terraform backend state lock could not be acquired.",
    remediation: [
      "Check for concurrent `terraform apply` runs.",
      "If stale, run `terraform force-unlock <LOCK_ID>`.",
      "Retry the deployment."
    ]
  },
  {
    id: "aws-throttling",
    category: "CloudProvider",
    pattern: /Rate exceeded|ThrottlingException|RequestLimitExceeded/i,
    cause: "AWS API request was throttled due to rate limiting.",
    remediation: [
      "Implement or increase exponential backoff in the client.",
      "Check if multiple jobs are making simultaneous API calls.",
      "Request a quota increase for the affected service."
    ]
  },
  {
    id: "azure-resource-not-found",
    category: "Infrastructure",
    pattern: /ResourceGroupNotFound|ResourceNotFound|ParentResourceNotFound/i,
    cause: "Azure resource or resource group could not be found.",
    remediation: [
      "Verify the resource name and resource group are correct.",
      "Check if the resource was deleted or moved.",
      "Ensure the deployment target region is correct."
    ]
  },
  {
    id: "k8s-image-pull",
    category: "Deployment",
    pattern: /(ImagePullBackOff|ErrImagePull|manifest unknown)/,
    cause: "Kubernetes could not pull the container image.",
    remediation: [
      "Verify the image tag exists in the registry.",
      "Check imagePullSecrets are present and valid.",
      "Confirm the registry is reachable from the cluster."
    ]
  },
  {
    id: "helm-release-failed",
    category: "Deployment",
    pattern: /(UPGRADE FAILED|release: not found|cannot re-use a name)/,
    cause: "Helm release upgrade or install failed.",
    remediation: [
      "Inspect `helm history` for the release.",
      "Rollback with `helm rollback <release> <revision>` if needed.",
      "Verify chart values against the cluster state."
    ]
  },
  {
    id: "npm-eresolve",
    category: "Dependency",
    pattern: /(ERESOLVE|peer dep missing|Could not resolve dependency)/i,
    cause: "npm could not resolve the dependency tree.",
    remediation: [
      "Run `npm install --legacy-peer-deps` to inspect the conflict.",
      "Update the offending package or pin a compatible version.",
      "Regenerate the lockfile."
    ]
  },
  {
    id: "pip-resolution",
    category: "Dependency",
    pattern: /ResolutionImpossible|No matching distribution found/,
    cause: "pip dependency resolution failed.",
    remediation: [
      "Pin conflicting transitive dependencies.",
      "Verify Python version compatibility for each package."
    ]
  },
  {
    id: "junit-test-failures",
    category: "Test",
    pattern: /(Tests run:.*Failures: [1-9]|FAILED.*test|AssertionError)/,
    cause: "One or more unit tests failed.",
    remediation: [
      "Open the test report attached to this issue.",
      "Reproduce locally with the same seed/env.",
      "Fix or quarantine the failing test."
    ]
  },
  {
    id: "timeout",
    category: "Timeout",
    pattern: /(timed out|deadline exceeded|operation was cancelled.*timeout)/i,
    cause: "Job exceeded its configured timeout.",
    remediation: [
      "Raise the job/step timeout if work is legitimate.",
      "Profile the slow step.",
      "Split into smaller stages."
    ]
  },
  {
    id: "auth-401",
    category: "Authentication",
    pattern: /(401 Unauthorized|invalid_token|authentication failed)/i,
    cause: "Authentication failed against an external system.",
    remediation: [
      "Verify the secret/token has not expired.",
      "Confirm the secret is wired into the pipeline correctly."
    ]
  },
  {
    id: "network-dns",
    category: "Network",
    pattern: /(getaddrinfo (ENOTFOUND|EAI_AGAIN)|temporary failure in name resolution)/i,
    cause: "DNS resolution failed.",
    remediation: [
      "Check the hostname spelling.",
      "Verify VPC/firewall egress rules.",
      "Retry \u2014 may be transient infrastructure flap."
    ]
  },
  {
    id: "docker-build",
    category: "Build",
    pattern: /(executor failed running|returned a non-zero code|Dockerfile.*not found)/,
    cause: "Docker build step failed.",
    remediation: [
      "Inspect the failing RUN instruction.",
      "Verify the build context contains all expected files."
    ]
  },
  {
    id: "compile-error",
    category: "Build",
    pattern: /(error TS\d+|error: cannot find|compilation failed|SyntaxError)/,
    cause: "Source compilation failed.",
    remediation: [
      "Read the first error in the log \u2014 fix imports/syntax.",
      "Re-run locally before pushing."
    ]
  },
  {
    id: "security-scan-vulnerability",
    category: "Security",
    pattern: /(Vulnerability found|CVE-\d+|Critical vulnerability|High severity issue)/i,
    cause: "Security scan detected vulnerabilities in the codebase or dependencies.",
    remediation: [
      "Review the security scan report.",
      "Update vulnerable dependencies to a patched version.",
      "If the vulnerability is a false positive, document and whitelist it."
    ]
  },
  {
    id: "memory-limit-exceeded",
    category: "Infrastructure",
    pattern: /(OOMKill|out of memory|process killed with signal 9|java.lang.OutOfMemoryError)/i,
    cause: "Process exceeded the allocated memory limit.",
    remediation: [
      "Increase the memory limit for the job/container.",
      "Optimize the application to reduce memory usage.",
      "Check for memory leaks in the application logic."
    ]
  },
  {
    id: "disk-full",
    category: "Infrastructure",
    pattern: /(No space left on device|Disk full|ENOSPC)/i,
    cause: "Runner or target system ran out of disk space.",
    remediation: [
      "Clean up temporary files or logs.",
      "Increase the disk size of the runner/environment.",
      "Check for large build artifacts that are not being cleaned up."
    ]
  },
  {
    id: "git-conflict",
    category: "Build",
    pattern: /(CONFLICT \(content\): Merge conflict|Automatic merge failed|fix conflicts and then commit)/i,
    cause: "Merge conflicts detected during git operations.",
    remediation: [
      "Resolve the merge conflicts manually in the codebase.",
      "Ensure you are working on the latest version of the target branch.",
      "Rebase your feature branch on top of the main branch."
    ]
  },
  {
    id: "api-connection-refused",
    category: "Network",
    pattern: /(ECONNREFUSED|connect ECONNREFUSED|Connection refused)/i,
    cause: "Target service is not reachable or the connection was refused.",
    remediation: [
      "Verify the target service is running.",
      "Check the target host and port are correct.",
      "Review firewall and security group rules between source and target."
    ]
  },
  {
    id: "db-connection-failed",
    category: "Infrastructure",
    pattern: /(Connection to the database failed|failed to connect to server|Database is starting up)/i,
    cause: "Failed to establish a connection to the database.",
    remediation: [
      "Check database availability and status.",
      "Verify database credentials and connection string.",
      "Ensure the database host is reachable from the runner."
    ]
  }
];
var GROUPED_SIGNATURES = SIGNATURES.reduce((acc, sig) => {
  const cat = sig.category;
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(sig);
  return acc;
}, {});
function matchSignature(input, options = {}) {
  if (options.categoryHint && GROUPED_SIGNATURES[options.categoryHint]) {
    for (const sig of GROUPED_SIGNATURES[options.categoryHint]) {
      const m = sig.pattern.exec(input);
      if (m) return { ...sig, matchedText: m[0], confidence: 1 };
    }
  }
  for (const sig of SIGNATURES) {
    if (options.categoryHint && sig.category === options.categoryHint) continue;
    const m = sig.pattern.exec(input);
    if (m) return { ...sig, matchedText: m[0], confidence: 0.9 };
  }
  return null;
}

// src/core/ai/fallbacks.ts
var DeterministicFallbackEngine = class {
  /**
   * Generate deterministic summary using template
   * Template: "{workflow} failed at {step} on {branch} (exit {code})"
   */
  static generateSummary(event) {
    const step = event.pipeline.step ?? event.failure.failedStep ?? "step";
    const exitInfo = event.failure.exitCode !== void 0 ? ` (exit ${event.failure.exitCode})` : "";
    return `${event.pipeline.name} failed at ${step} on ${event.branch}${exitInfo}`;
  }
  /**
   * Generate RCA using signature library lookup
   */
  static generateRootCause(event, category) {
    const searchSpace = `${event.failure.errorMessage || ""}
${event.failure.logs}`;
    const match = matchSignature(searchSpace);
    if (match) {
      return match.cause;
    }
    switch (category) {
      case "Infrastructure":
        return "Infrastructure resource failure or configuration issue";
      case "Deployment":
        return "Deployment process failed to complete";
      case "Build":
        return "Build process encountered errors";
      case "Test":
        return "Test suite failed to pass";
      case "Dependency":
        return "Dependency management or resolution issue";
      case "Security":
        return "Security validation or authentication issue";
      case "Authentication":
        return "Authentication or authorization failure";
      case "Timeout":
        return "Operation exceeded time limits";
      case "Network":
        return "Network connectivity or communication issue";
      case "CloudProvider":
        return "Cloud provider service or API issue";
      default:
        return "Unknown failure occurred";
    }
  }
  /**
   * Generate remediation using signature library or category-based default
   */
  static generateRemediation(category, event) {
    const searchSpace = `${event.failure.errorMessage || ""}
${event.failure.logs}`;
    const match = matchSignature(searchSpace);
    if (match) {
      return match.remediation;
    }
    const remediationMap = {
      Infrastructure: [
        "Check infrastructure resource availability",
        "Verify configuration files and settings",
        "Review infrastructure logs for details",
        "Contact infrastructure team if issue persists"
      ],
      Deployment: [
        "Verify deployment configuration",
        "Check target environment status",
        "Review deployment logs for specific errors",
        "Consider rolling back to previous stable version"
      ],
      Build: [
        "Review build logs for specific errors",
        "Check for syntax or compilation errors",
        "Verify dependencies and versions",
        "Run build locally to reproduce issue"
      ],
      Test: [
        "Review failing test cases",
        "Check test environment setup",
        "Verify test data and mocks",
        "Run tests locally to debug failures"
      ],
      Dependency: [
        "Update package manager",
        "Clear package cache and reinstall",
        "Check for version conflicts",
        "Review dependency tree for issues"
      ],
      Security: [
        "Review security credentials and tokens",
        "Check authentication configuration",
        "Verify access permissions",
        "Review security scan results"
      ],
      Authentication: [
        "Verify credentials are valid and not expired",
        "Check authentication configuration",
        "Review token generation process",
        "Confirm service account permissions"
      ],
      Timeout: [
        "Increase timeout limits if appropriate",
        "Optimize slow operations",
        "Break down long-running tasks",
        "Check for resource constraints"
      ],
      Network: [
        "Check network connectivity",
        "Verify DNS configuration",
        "Review firewall and security rules",
        "Test network endpoints manually"
      ],
      CloudProvider: [
        "Check cloud service status",
        "Review API quotas and limits",
        "Verify cloud credentials and permissions",
        "Check region-specific issues"
      ],
      Unknown: [
        "Review complete log output",
        "Gather additional context about the failure",
        "Check recent changes in the codebase",
        "Contact relevant team for assistance"
      ]
    };
    return remediationMap[category] || remediationMap.Unknown;
  }
  /**
   * Generate classification using core signature library
   */
  static generateClassification(event) {
    const searchSpace = `${event.failure.errorMessage || ""}
${event.failure.logs}`;
    const match = matchSignature(searchSpace);
    return match?.category ?? "Unknown";
  }
  /**
   * Generate severity using rule-based approach
   */
  static generateSeverity(event, category) {
    const env = (event.environment || "").toLowerCase();
    const isProd = env === "production" || env === "prod";
    const isMain = event.branch === "main" || event.branch === "master";
    const isPR = !!event.pullRequest;
    if (isProd && (category === "Infrastructure" || category === "Deployment" || category === "Network")) {
      return "Critical";
    }
    if (category === "Security") return "High";
    if (isProd) return "High";
    if (isMain) return "High";
    if (category === "Infrastructure" && !isPR) return "High";
    if (isPR) return "Medium";
    if (category === "Test" && isPR) return "Medium";
    if (category === "Build" && !isMain) return "Medium";
    return "Low";
  }
  /**
   * Generate tags using {category, branch, repo, env} auto-labels
   */
  static generateTags(event, category) {
    const tags = [
      `category:${category.toLowerCase()}`,
      `repo:${event.repository.name}`,
      `branch:${event.branch}`,
      `source:${event.source}`
    ];
    if (event.environment) {
      tags.push(`env:${event.environment.toLowerCase()}`);
    }
    if (event.pipeline.step) {
      tags.push(`step:${event.pipeline.step.toLowerCase()}`);
    }
    return tags;
  }
  /**
   * Generate risk assessment using heuristic: branch + env + recent failure rate
   */
  static generateRiskAssessment(event, failureRate) {
    const env = (event.environment || "").toLowerCase();
    const isProd = env === "production" || env === "prod";
    const isMain = event.branch === "main" || event.branch === "master";
    const isPR = !!event.pullRequest;
    let riskScore = 0;
    let riskFactors = [];
    if (isProd) {
      riskScore += 3;
      riskFactors.push("Production environment");
    }
    if (isMain) {
      riskScore += 2;
      riskFactors.push("Main branch deployment");
    }
    if (!isPR) {
      riskScore += 1;
      riskFactors.push("Direct push to branch");
    }
    if (failureRate && failureRate > 0.1) {
      riskScore += 2;
      riskFactors.push("High recent failure rate");
    }
    if (event.pipeline.retryCount && event.pipeline.retryCount > 0) {
      riskScore += 1;
      riskFactors.push("Previous retries");
    }
    if (riskScore >= 5) {
      return `High risk: ${riskFactors.join(", ")}`;
    } else if (riskScore >= 3) {
      return `Medium risk: ${riskFactors.join(", ")}`;
    } else {
      return `Low risk: ${riskFactors.join(", ")}`;
    }
  }
  /**
   * Generate complete deterministic fallback response
   */
  static generateFallback(event) {
    const category = this.generateClassification(event);
    const severity = this.generateSeverity(event, category);
    return {
      summary: this.generateSummary(event),
      rootCause: this.generateRootCause(event, category),
      remediation: this.generateRemediation(category, event).join("\n"),
      severity,
      assignee: null,
      tags: this.generateTags(event, category),
      classification: category
    };
  }
  static severityToPriority(severity) {
    switch (severity) {
      case "Critical":
        return "Highest";
      case "High":
        return "High";
      case "Medium":
        return "Medium";
      case "Low":
        return "Low";
    }
  }
};

// src/core/enrichers/types.ts
function setField(ctx, key, value, source, override = false) {
  if (!override && ctx.fields[key] !== void 0) return;
  ctx.fields[key] = value;
  ctx.provenance[String(key)] = source;
}

// src/core/log-parser/extractors.ts
function extractErrorMessages(logs) {
  const errorMessages = [];
  const errorPatterns = [
    /error[:\s]+(.+?)(?=\n|$)/gi,
    /Error[:\s]+(.+?)(?=\n|$)/gi,
    /exception[:\s]+(.+?)(?=\n|$)/gi,
    /Exception[:\s]+(.+?)(?=\n|$)/gi,
    /failed[:\s]+(.+?)(?=\n|$)/gi,
    /Failed[:\s]+(.+?)(?=\n|$)/gi,
    /cannot[:\s]+(.+?)(?=\n|$)/gi,
    /Cannot[:\s]+(.+?)(?=\n|$)/gi,
    /unable to[:\s]+(.+?)(?=\n|$)/gi,
    /Unable to[:\s]+(.+?)(?=\n|$)/gi,
    // Specific error formats
    /E[0-9]{3}:?\s*(.+?)(?=\n|$)/gi,
    /fatal[:\s]+(.+?)(?=\n|$)/gi,
    /Fatal[:\s]+(.+?)(?=\n|$)/gi
  ];
  for (const pattern of errorPatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      errorMessages.push(...matches.map((match) => match.trim()));
    }
  }
  const lines = logs.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("failed") || line.toLowerCase().includes("exception") || line.toLowerCase().includes("fatal")) {
      if (!errorMessages.some((existing) => existing.includes(line.trim()))) {
        errorMessages.push(line.trim());
      }
    }
  }
  return [...new Set(errorMessages)];
}
function extractStackTraces(logs) {
  const stackTraces = [];
  const stackPatterns = [
    // JavaScript/Node.js
    {
      start: /at\s+[\w\.$]+\s*\(/g,
      end: "\n\n",
      multiline: true
    },
    // Java
    {
      start: /Exception in thread|Caused by:/g,
      end: "\n\n",
      multiline: true
    },
    // Python
    {
      start: /Traceback \(most recent call last\):/g,
      end: "\n\n",
      multiline: true
    },
    // .NET
    {
      start: /at\s+[A-Za-z_][\w.<>]*\(/g,
      end: "\n\n",
      multiline: true
    },
    // Go
    {
      start: /goroutine \d+|created by/g,
      end: "\n\n",
      multiline: true
    },
    // Rust
    {
      start: /thread '.*' panicked at/g,
      end: "\n\n",
      multiline: true
    }
  ];
  for (const pattern of stackPatterns) {
    const matches = Array.from(logs.matchAll(pattern.start));
    for (const match of matches) {
      const startIndex = match.index || 0;
      const endIndex = logs.indexOf(pattern.end, startIndex);
      if (endIndex > startIndex) {
        const stackTrace = logs.substring(startIndex, endIndex).trim();
        if (stackTrace.length > 50) {
          stackTraces.push(stackTrace);
        }
      }
    }
  }
  const multiLinePatterns = [
    /(\s+at\s+[\w\.$]+\s*\(.*\)\s*\n\s+at\s+[\w\.$]+\s*\(.*\)\s*\n)/g,
    /(\s+at\s+[A-Za-z_][\w.<>]*\(.*\)\s*\n\s+at\s+[A-Za-z_][\w.<>]*\(.*\)\s*\n)/g
  ];
  for (const pattern of multiLinePatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      stackTraces.push(...matches.map((match) => match.trim()));
    }
  }
  return [...new Set(stackTraces)];
}
function extractExitCodes(logs) {
  const exitCodes = [];
  const exitCodePatterns = [
    /exit code[:\s]*(\d+)/gi,
    /exit status[:\s]*(\d+)/gi,
    /returned[:\s]*(\d+)/gi,
    /process exited with code[:\s]*(\d+)/gi,
    /command exited with[:\s]*(\d+)/gi,
    /non-zero exit code[:\s]*(\d+)/gi,
    // Shell exit codes
    /\$\?\s*=\s*(\d+)/g,
    // Docker exit codes
    /container exited with status[:\s]*(\d+)/gi,
    // CI/CD specific
    /failed with exit code[:\s]*(\d+)/gi,
    /build failed with exit code[:\s]*(\d+)/gi,
    /test failed with exit code[:\s]*(\d+)/gi
  ];
  for (const pattern of exitCodePatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const exitCode = parseInt(match[1], 10);
      if (!isNaN(exitCode) && exitCode >= 0 && exitCode <= 255) {
        exitCodes.push(exitCode);
      }
    }
  }
  return [...new Set(exitCodes)];
}
function extractFailedCommands(logs) {
  const failedCommands = [];
  const commandPatterns = [
    // Shell commands
    /\$?\s*([a-zA-Z0-9_\-\/\.]+\s+.*?)(?=\s*failed|\s*error|\s*exit)/gi,
    // npm/yarn commands
    /(npm|yarn|pnpm)\s+(run|install|test|build)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Docker commands
    /docker\s+(run|build|push|pull)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // kubectl commands
    /kubectl\s+(apply|create|delete|get)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Terraform commands
    /terraform\s+(apply|plan|destroy|init)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Git commands
    /git\s+(clone|checkout|pull|push)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Make commands
    /make\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Generic command patterns
    /command\s+["']?([a-zA-Z0-9_\-\/\.\s]+)["']?\s+failed/gi,
    /failed to execute[:\s]*["']?([a-zA-Z0-9_\-\/\.\s]+)["']?/gi,
    // Test runners
    /(jest|mocha|vitest|pytest|go test)\s+.*?(?=\s+failed|\s+error)/gi,
    // Build tools
    /(webpack|vite|rollup|parcel|esbuild)\s+.*?(?=\s+failed|\s+error)/gi
  ];
  for (const pattern of commandPatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const command = match[1] || match[0];
      if (command && command.trim().length > 0) {
        failedCommands.push(command.trim());
      }
    }
  }
  return [...new Set(failedCommands)];
}

// src/core/enrichers/computed.ts
var computedEnricher = {
  name: "computed",
  source: "computed",
  enrich(ctx) {
    const { event } = ctx;
    const logs = event.failure.logs || "";
    const errorMessage = event.failure.errorMessage || "";
    const searchSpace = `${errorMessage}
${logs}`;
    const failedCommands = extractFailedCommands(logs);
    const exitCodes = extractExitCodes(logs);
    const errorMessages = extractErrorMessages(searchSpace);
    let categoryHint;
    if (failedCommands.some((c) => c.includes("terraform"))) categoryHint = "Infrastructure";
    else if (failedCommands.some((c) => c.includes("npm") || c.includes("yarn") || c.includes("pip"))) categoryHint = "Dependency";
    else if (failedCommands.some((c) => c.includes("docker") || c.includes("helm") || c.includes("kubectl"))) categoryHint = "Deployment";
    else if (errorMessages.some((m) => m.toLowerCase().includes("test") || m.toLowerCase().includes("assert"))) categoryHint = "Test";
    const aiEnabled = ctx.config.ai.mode !== "disabled";
    let category = "Unknown";
    let match = null;
    if (aiEnabled) {
      category = DeterministicFallbackEngine.generateClassification(event);
      setField(ctx, "category", category, "computed");
    } else {
      match = matchSignature(searchSpace, { categoryHint });
      category = match?.category ?? categoryHint ?? "Unknown";
      setField(ctx, "category", category, match ? "computed" : "fallback");
      if (match) {
        ctx.fields.customFields = {
          ...ctx.fields.customFields ?? {},
          _rca: match.cause,
          _remediation: match.remediation,
          _signatureId: match.id,
          _matchConfidence: match.confidence
        };
      } else if (failedCommands.length > 0) {
        const cmd = failedCommands[0];
        const code = exitCodes.length > 0 ? ` (exit ${exitCodes[0]})` : "";
        ctx.fields.customFields = {
          ...ctx.fields.customFields ?? {},
          _rca: `Command '${cmd}' failed${code}.`,
          _remediation: [
            "Verify command syntax.",
            "Check tool installation in runner."
          ]
        };
      }
    }
    const severity = computeSeverity(ctx);
    setField(ctx, "severity", severity, "computed");
    setField(ctx, "priority", severityToPriority(severity), "computed");
    const signature = computeDedupSignature(event, category);
    setField(ctx, "dedupSignature", signature, "computed");
    const failureFingerprint = computeFailureFingerprint(event, category);
    const labels = new Set(ctx.fields.labels ?? []);
    labels.add(`piq-sig:${signature}`);
    labels.add(`piq-fp:${failureFingerprint}`);
    if (category !== "Unknown") labels.add(`piq-cat:${category.toLowerCase()}`);
    setField(ctx, "labels", Array.from(labels), "computed", true);
  }
};
function computeSeverity(ctx) {
  const { event } = ctx;
  const env = (event.environment ?? "").toLowerCase();
  const cat = ctx.fields.category ?? "Unknown";
  const isProd = env === "production" || env === "prod";
  const isMain = event.branch === "main" || event.branch === "master";
  if (isProd && (cat === "Infrastructure" || cat === "Deployment" || cat === "Network")) {
    return "Critical";
  }
  if (cat === "Security") return "High";
  if (isProd) return "High";
  if (isMain) return "High";
  if (event.pullRequest) return "Medium";
  return "Low";
}
function severityToPriority(severity) {
  switch (severity) {
    case "Critical":
      return "Highest";
    case "High":
      return "High";
    case "Medium":
      return "Medium";
    case "Low":
      return "Low";
  }
}

// src/core/enrichers/deterministic.ts
var deterministicEnricher = {
  name: "deterministic",
  source: "deterministic",
  enrich(ctx) {
    const { event, config } = ctx;
    setField(ctx, "projectKey", config.jiraProject, "deterministic");
    setField(ctx, "issueType", config.issueType, "deterministic");
    const step = event.pipeline.step ?? event.failure.failedStep ?? "step";
    const exitInfo = event.failure.exitCode !== void 0 ? ` (exit ${event.failure.exitCode})` : "";
    setField(
      ctx,
      "summary",
      `${event.pipeline.name} failed at ${step} on ${event.branch}${exitInfo}`,
      "deterministic"
    );
    const labels = new Set(config.defaultLabels);
    labels.add(`repo:${event.repository.name}`);
    labels.add(`piq-repo:${event.repository.owner}/${event.repository.name}`);
    labels.add(`branch:${event.branch}`);
    labels.add(`source:${event.source}`);
    if (event.environment) labels.add(`env:${event.environment}`);
    setField(ctx, "labels", Array.from(labels), "deterministic");
    if (event.environment) {
      setField(ctx, "environment", event.environment, "deterministic");
    }
    if (config.defaultAssignee) {
      setField(ctx, "assignee", config.defaultAssignee, "deterministic");
    } else {
      setField(ctx, "assignee", null, "deterministic");
    }
    const links = [
      { url: event.pipeline.url, title: "Pipeline" }
    ];
    if (event.pipeline.runUrl) {
      links.push({ url: event.pipeline.runUrl, title: "Pipeline Run" });
    }
    links.push({ url: event.commit.url, title: `Commit ${event.commit.sha.slice(0, 7)}` });
    links.push({ url: event.repository.url, title: "Repository" });
    if (event.pullRequest) {
      links.push({ url: event.pullRequest.url, title: `PR #${event.pullRequest.number}` });
    }
    setField(ctx, "externalLinks", links, "deterministic");
    if (event.metadata && Object.keys(event.metadata).length > 0) {
      const existingFields = ctx.fields.customFields || {};
      setField(
        ctx,
        "customFields",
        { ...existingFields, ...event.metadata },
        "deterministic"
      );
    }
  }
};

// src/core/secret-mask.ts
var PATTERNS = [
  // Generic tokens / API keys (AKIA…, ghp_…, sk-…, glpat-…)
  [/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bgho_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_OAUTH]"],
  [/\bglpat-[A-Za-z0-9_\-]{20}\b/g, "[REDACTED_GITLAB_PAT]"],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, "[REDACTED_OPENAI_KEY]"],
  // Azure
  [/\b[a-z0-9]{8}-(?:[a-z0-9]{4}-){3}[a-z0-9]{12}\b/gi, "[REDACTED_UUID]"],
  // UUIDs/GUIDs often sensitive
  [/SharedAccessKey=[A-Za-z0-9+/=]{30,}/g, "SharedAccessKey=[REDACTED]"],
  // GCP
  [/\bAIza[0-9A-Za-z\\-_]{35}\b/g, "[REDACTED_GCP_API_KEY]"],
  // Slack
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_SLACK_TOKEN]"],
  // Stripe
  [/\b(sk|pk)_(test|live)_[0-9a-zA-Z]{24}\b/g, "[REDACTED_STRIPE_KEY]"],
  // Database connection strings
  [/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(mysql:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  // Bearer tokens
  [/Bearer\s+[A-Za-z0-9._\-]{20,}/g, "Bearer [REDACTED]"],
  // Basic auth header
  [/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, "Authorization: Basic [REDACTED]"],
  // Generic password=... patterns
  [/(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[^\s"']{6,}/gi, "$1=[REDACTED]"],
  // JWT-ish (three dot-separated base64 segments)
  [/\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g, "[REDACTED_JWT]"],
  // Private keys
  [/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"]
];
function maskSecrets(input) {
  let out = input;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// src/core/log-parser/smart-excerpt.ts
var ERROR_ANCHOR_PATTERNS = [
  /^\s*##\[error\]/i,
  /exit\s+code\s+[1-9]\d*/i,
  /process\s+exited\s+with\s+code\s+[1-9]\d*/i,
  /\b(FAIL|FAILED|ERROR)\b/,
  /exception\s+in\s+thread/i,
  /traceback\s+\(most\s+recent\s+call\s+last\)/i,
  /thread\s+'.*'\s+panicked/i,
  /goroutine\s+\d+\s+\[running\]/i
];
function parseSteps(lines, source) {
  if (source === "github") return parseGitHubSteps(lines);
  if (source === "azure-devops") return parseAzureSteps(lines);
  return [];
}
function parseGitHubSteps(lines) {
  const steps = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const groupMatch = line.match(/^##\[group\](.+)/);
    const endGroup = line.startsWith("##[endgroup]");
    if (groupMatch) {
      current = { name: groupMatch[1].trim(), startLine: i + 1 };
    } else if (endGroup && current) {
      const contentLines = lines.slice(current.startLine, i);
      steps.push({
        name: current.name,
        status: hasError(contentLines) ? "failed" : "passed",
        startLine: current.startLine,
        endLine: i - 1
      });
      current = null;
    }
  }
  if (current) {
    steps.push({
      name: current.name,
      status: "failed",
      startLine: current.startLine,
      endLine: lines.length - 1
    });
  }
  return markSkippedSteps(steps);
}
function parseAzureSteps(lines) {
  const steps = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clean = line.replace(/^\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+\s+/, "");
    const startMatch = clean.match(/^##\[section\]Starting:\s*(.+)/);
    const endMatch = clean.match(/^##\[section\]Finishing:\s*(.+)/);
    if (startMatch) {
      current = { name: startMatch[1].trim(), startLine: i + 1 };
    } else if (endMatch && current) {
      const contentLines = lines.slice(current.startLine, i);
      steps.push({
        name: current.name,
        status: hasError(contentLines) ? "failed" : "passed",
        startLine: current.startLine,
        endLine: i - 1
      });
      current = null;
    }
  }
  if (current) {
    steps.push({
      name: current.name,
      status: "failed",
      startLine: current.startLine,
      endLine: lines.length - 1
    });
  }
  return markSkippedSteps(steps);
}
function hasError(lines) {
  return lines.some((line) => ERROR_ANCHOR_PATTERNS.some((p) => p.test(line)));
}
function markSkippedSteps(steps) {
  const failIdx = steps.findIndex((s) => s.status === "failed");
  if (failIdx === -1) return steps;
  return steps.map(
    (s, i) => i > failIdx ? { ...s, status: "skipped" } : s
  );
}
function findErrorAnchors(lines) {
  return lines.reduce((acc, line, i) => {
    if (ERROR_ANCHOR_PATTERNS.some((p) => p.test(line))) acc.push(i);
    return acc;
  }, []);
}
function renderBreadcrumb(steps) {
  const icon = (s) => s === "passed" ? "\u2713" : s === "failed" ? "\u2717" : "\u25CB";
  const parts = steps.map((s) => `${icon(s.status)} ${s.name}`);
  const joined = parts.join(" \u2192 ");
  const full = "Steps: " + joined;
  if (full.length <= 120) return full;
  return full.slice(0, 120) + "\u2026";
}
function renderStepOutput(allLines, step, budget) {
  const endLine = step.endLine === -1 ? allLines.length - 1 : step.endLine;
  if (step.startLine > endLine) {
    return "[Step produced no output]";
  }
  let stepLines = allLines.slice(step.startLine, endLine + 1);
  let trimNotice = "";
  if (stepLines.length > budget) {
    const trimmed = stepLines.length - budget;
    stepLines = stepLines.slice(-budget);
    trimNotice = `[... ${trimmed} lines trimmed from top of step output ...]
`;
  }
  const highlighted = stepLines.map(
    (line) => ERROR_ANCHOR_PATTERNS.some((p) => p.test(line)) ? `\u25B6 ${line}` : line
  );
  return trimNotice + highlighted.join("\n");
}
function buildSmartExcerpt(log, source, maxLines) {
  if (!log) return { text: "", strategy: "tail-fallback" };
  const clampedMax = Math.max(maxLines, 20);
  const lines = log.split("\n");
  const steps = parseSteps(lines, source);
  if (steps.length > 0) {
    const failingStep = steps.find((s) => s.status === "failed");
    const breadcrumb = renderBreadcrumb(steps);
    if (failingStep) {
      const stepBudget = Math.max(Math.floor(clampedMax * 0.75), 20);
      const stepOutput = renderStepOutput(lines, failingStep, stepBudget);
      const text = `${breadcrumb}

${stepOutput}`;
      return { text, strategy: "step-aware", failingStep: failingStep.name };
    }
  }
  const anchors = findErrorAnchors(lines);
  if (anchors.length > 0) {
    const BEFORE = 40;
    const AFTER = 20;
    const first = anchors[0];
    const start = Math.max(0, first - BEFORE);
    const end = Math.min(lines.length - 1, first + AFTER);
    const contextLines = lines.slice(start, end + 1);
    const highlighted = contextLines.map(
      (line) => ERROR_ANCHOR_PATTERNS.some((p) => p.test(line)) ? `\u25B6 ${line}` : line
    );
    const prefix = start > 0 ? `[... ${start} lines above omitted ...]
` : "";
    return {
      text: prefix + highlighted.join("\n"),
      strategy: "error-anchored"
    };
  }
  const tail = lines.length <= clampedMax ? log : lines.slice(-clampedMax).join("\n");
  return { text: tail, strategy: "tail-fallback" };
}

// src/core/renderer.ts
function renderDescription(event, fields, logExcerptLines, maskLogs, displayMetadata, history, metrics) {
  const out = [];
  out.push("## PipelineIQ Failure Report");
  out.push("");
  const rca = fields.rca;
  const remediation = fields.remediationSteps;
  out.push("### Failure Summary");
  let summary = fields.summary ?? "Pipeline failure detected.";
  if (fields.customFields?.["_matchConfidence"] !== void 0) {
    const conf = Math.round(Number(fields.customFields["_matchConfidence"]) * 100);
    summary += ` (Match Confidence: ${conf}%)`;
  }
  out.push(summary);
  out.push("");
  if (rca) {
    out.push("### Root Cause");
    out.push(rca);
    out.push("");
  }
  if (remediation && Array.isArray(remediation) && remediation.length > 0) {
    out.push("### Suggested Remediation");
    remediation.forEach((step, i) => out.push(`${i + 1}. ${step}`));
    out.push("");
  }
  out.push("---");
  out.push("");
  if (history) {
    out.push("### Reliability Context");
    let trendIcon = "\u27A1\uFE0F";
    if (history.trend === "worsening") trendIcon = "\u{1F4C8}";
    if (history.trend === "improving") trendIcon = "\u{1F4C9}";
    const flakyMsg = history.isFlaky ? " \u26A0\uFE0F **Detected as Flaky**" : "";
    out.push(`- **Frequency:** ${history.similarCount} occurrences in last 30 days${flakyMsg}`);
    if (history.trend) {
      out.push(`- **Trend:** ${trendIcon} ${history.trend.charAt(0).toUpperCase() + history.trend.slice(1)}`);
    }
    if (history.previousIncidentKeys.length > 0) {
      const keys = history.previousIncidentKeys.slice(0, 5).join(", ");
      const more = history.previousIncidentKeys.length > 5 ? "..." : "";
      out.push(`- **Previous Incidents:** ${keys}${more}`);
    }
    if (history.relatedKeys.length > 0) {
      out.push(`- **Related by Symptom:** ${history.relatedKeys.join(", ")}`);
    }
    if (metrics) {
      if (metrics.mttrHours !== void 0 && metrics.sampleSize > 0) {
        out.push(`- **MTTR:** ${metrics.mttrHours}h avg (${metrics.sampleSize} incidents)`);
      }
      if (metrics.blastRadius !== void 0) {
        out.push(`- **Blast radius:** ${metrics.blastRadius} repos affected`);
      }
    }
    out.push("");
    out.push("---");
    out.push("");
  }
  const commitMsg = event.commit.message ?? "";
  const firstLine = commitMsg.split("\n")[0] || "";
  const truncatedMsg = firstLine.substring(0, 80) + (commitMsg.length > 80 ? "..." : "");
  const allFields = [
    { key: "source", label: "Source", value: event.source },
    {
      key: "pipeline",
      label: "Pipeline",
      value: `[${event.pipeline.name}](${event.pipeline.url})`
    },
    {
      key: "runUrl",
      label: "Pipeline Run",
      value: event.pipeline.runUrl ? `[View Execution](${event.pipeline.runUrl})` : ""
    },
    {
      key: "repository",
      label: "Repository",
      value: `[${event.repository.owner}/${event.repository.name}](${event.repository.url})`
    },
    {
      key: "pullRequest",
      label: "Pull Request",
      value: event.pullRequest ? `[#${event.pullRequest.number} ${event.pullRequest.title}](${event.pullRequest.url})` : ""
    },
    { key: "branch", label: "Branch", value: event.branch },
    {
      key: "commit",
      label: "Commit",
      value: `[\`${event.commit.sha.slice(0, 7)}\`](${event.commit.url})`
    },
    {
      key: "commitMessage",
      label: "Commit Message",
      value: truncatedMsg
    },
    { key: "environment", label: "Environment", value: event.environment ?? "" },
    { key: "step", label: "Failed Step", value: event.pipeline.step ?? "" },
    { key: "stage", label: "Failed Stage", value: event.pipeline.stage ?? "" },
    { key: "exitCode", label: "Exit Code", value: event.failure.exitCode?.toString() ?? "" },
    {
      key: "retryCount",
      label: "Retry Count",
      value: event.pipeline.retryCount?.toString() ?? ""
    },
    {
      key: "runAttempt",
      label: "Run Attempt",
      value: event.pipeline.runAttempt?.toString() ?? ""
    },
    { key: "job", label: "Job", value: event.pipeline.job ?? "" },
    { key: "jobName", label: "Job Name", value: event.pipeline.jobName ?? "" },
    { key: "eventName", label: "Event Name", value: event.eventName ?? "" },
    { key: "runnerOs", label: "Runner OS", value: event.pipeline.runnerOs ?? "" },
    { key: "runnerArch", label: "Runner Arch", value: event.pipeline.runnerArch ?? "" },
    { key: "runnerType", label: "Runner Type", value: event.pipeline.runnerType ?? "" },
    { key: "runnerEnvironment", label: "Runner Environment", value: event.pipeline.runnerEnvironment ?? "" },
    { key: "runnerDebug", label: "Runner Debug", value: event.pipeline.runnerDebug !== void 0 ? String(event.pipeline.runnerDebug) : "" },
    { key: "runNumber", label: "Run Number", value: event.pipeline.runNumber?.toString() ?? "" },
    { key: "triggeredBy", label: "Triggered By", value: event.triggeredBy ?? "unknown" },
    { key: "refType", label: "Ref Type", value: event.pipeline.refType ?? "" },
    { key: "workflowRef", label: "Workflow Ref", value: event.pipeline.workflowRef ?? "" },
    { key: "reason", label: "Build Reason", value: event.pipeline.reason ?? "" },
    { key: "teamProject", label: "Team Project", value: event.pipeline.teamProject ?? "" },
    { key: "teamProjectId", label: "Team Project ID", value: event.pipeline.teamProjectId ?? "" },
    { key: "agentPool", label: "Agent Pool", value: event.pipeline.agentPool ?? "" },
    { key: "buildUri", label: "Build URI", value: event.pipeline.buildUri ?? "" },
    { key: "buildNumber", label: "Build Number", value: event.pipeline.buildNumber ?? "" },
    { key: "workflowSha", label: "Workflow SHA", value: event.pipeline.workflowSha ?? "" },
    { key: "action", label: "Action", value: event.pipeline.action ?? "" },
    { key: "actionPath", label: "Action Path", value: event.pipeline.actionPath ?? "" },
    { key: "actionRepository", label: "Action Repo", value: event.pipeline.actionRepository ?? "" },
    { key: "baseRef", label: "Base Ref", value: event.pipeline.baseRef ?? "" },
    { key: "headRef", label: "Head Ref", value: event.pipeline.headRef ?? "" },
    { key: "runnerTemp", label: "Runner Temp", value: event.pipeline.runnerTemp ?? "" },
    { key: "runnerToolCache", label: "Runner Tool Cache", value: event.pipeline.runnerToolCache ?? "" },
    { key: "runnerWorkspace", label: "Runner Workspace", value: event.pipeline.runnerWorkspace ?? "" },
    { key: "workspace", label: "Workspace", value: event.pipeline.workspace ?? "" },
    { key: "jobStatus", label: "Job Status", value: event.pipeline.jobStatus ?? "" },
    { key: "jobContainer", label: "Job Container", value: event.pipeline.jobContainer ?? "" },
    { key: "jobServices", label: "Job Services", value: event.pipeline.jobServices ?? "" },
    { key: "strategyIndex", label: "Matrix Index", value: event.pipeline.strategyJobIndex?.toString() ?? "" },
    { key: "strategyTotal", label: "Matrix Total", value: event.pipeline.strategyJobTotal?.toString() ?? "" },
    { key: "actionRef", label: "Action Ref", value: event.pipeline.actionRef ?? "" },
    { key: "actionStatus", label: "Action Status", value: event.pipeline.actionStatus ?? "" },
    { key: "repositoryGitUrl", label: "Repo Git URL", value: event.pipeline.repositoryGitUrl ?? "" },
    { key: "repositoryClean", label: "Repo Clean", value: event.pipeline.repositoryClean ?? "" },
    { key: "repositoryGitSubmoduleCheckout", label: "Git Submodule Checkout", value: event.pipeline.repositoryGitSubmoduleCheckout ?? "" },
    { key: "checksStageAttempt", label: "Checks Stage Attempt", value: event.pipeline.checksStageAttempt ?? "" },
    { key: "strategyName", label: "Strategy Name", value: event.pipeline.strategyName ?? "" },
    { key: "strategyCycleName", label: "Strategy Cycle Name", value: event.pipeline.strategyCycleName ?? "" },
    { key: "cronScheduleDisplayName", label: "Cron Display Name", value: event.pipeline.cronScheduleDisplayName ?? "" },
    { key: "secretSource", label: "Secret Source", value: event.pipeline.secretSource ?? "" },
    { key: "eventPayload", label: "Event Payload", value: event.eventPayload ? "Included (JSON)" : "" },
    { key: "retentionDays", label: "Log Retention", value: event.pipeline.retentionDays?.toString() ?? "" },
    { key: "refProtected", label: "Ref Protected", value: event.pipeline.refProtected !== void 0 ? String(event.pipeline.refProtected) : "" },
    { key: "apiUrl", label: "API URL", value: event.apiUrl ?? "" },
    { key: "graphqlUrl", label: "GraphQL URL", value: event.graphqlUrl ?? "" },
    { key: "agentContainerMapping", label: "Container Mapping", value: event.pipeline.agentContainerMapping ?? "" },
    { key: "agentReleaseDirectory", label: "Release Dir", value: event.pipeline.agentReleaseDirectory ?? "" },
    { key: "agentRootDirectory", label: "Agent Root", value: event.pipeline.agentRootDirectory ?? "" },
    { key: "pipelineWorkspace", label: "Pipeline Workspace", value: event.pipeline.pipelineWorkspace ?? "" },
    { key: "systemDebug", label: "System Debug", value: event.pipeline.systemDebug ?? "" },
    { key: "systemDefaultWorkingDirectory", label: "Default Working Dir", value: event.pipeline.systemDefaultWorkingDirectory ?? "" },
    { key: "systemCollectionUri", label: "Collection URI", value: event.pipeline.systemCollectionUri ?? "" },
    { key: "systemTeamFoundationCollectionUri", label: "TF Collection URI", value: event.pipeline.systemTeamFoundationCollectionUri ?? "" },
    { key: "releaseDeploymentRequestedFor", label: "Release Requested For", value: event.pipeline.releaseDeploymentRequestedFor ?? "" },
    { key: "releaseDeploymentRequestedForEmail", label: "Release Requester Email", value: event.pipeline.releaseDeploymentRequestedForEmail ?? "" },
    { key: "releaseDeploymentId", label: "Release Deployment ID", value: event.pipeline.releaseDeploymentId ?? "" },
    { key: "releaseDefinitionEnvironmentId", label: "Release Def Env ID", value: event.pipeline.releaseDefinitionEnvironmentId ?? "" },
    { key: "releaseDefinitionId", label: "Release Def ID", value: event.pipeline.releaseDefinitionId ?? "" },
    { key: "releaseDefinitionName", label: "Release Def Name", value: event.pipeline.releaseDefinitionName ?? "" },
    { key: "releaseEnvironmentId", label: "Release Env ID", value: event.pipeline.releaseEnvironmentId ?? "" },
    { key: "releaseEnvironmentName", label: "Release Env Name", value: event.pipeline.releaseEnvironmentName ?? "" },
    { key: "releasePrimaryArtifactSourceAlias", label: "Primary Artifact Alias", value: event.pipeline.releasePrimaryArtifactSourceAlias ?? "" },
    { key: "releaseDescription", label: "Release Description", value: event.pipeline.releaseDescription ?? "" },
    { key: "releaseId", label: "Release ID", value: event.pipeline.releaseId ?? "" },
    { key: "releaseName", label: "Release Name", value: event.pipeline.releaseName ?? "" },
    { key: "releaseUri", label: "Release URI", value: event.pipeline.releaseUri ?? "" },
    { key: "systemJobDisplayName", label: "Job Display Name", value: event.pipeline.systemJobDisplayName ?? "" },
    { key: "systemJobId", label: "Job ID", value: event.pipeline.systemJobId ?? "" },
    { key: "systemJobName", label: "System Job Name", value: event.pipeline.systemJobName ?? "" },
    { key: "systemPhaseAttempt", label: "Phase Attempt", value: event.pipeline.systemPhaseAttempt ?? "" },
    { key: "systemStageAttempt", label: "Stage Attempt", value: event.pipeline.systemStageAttempt ?? "" },
    { key: "systemStageDisplayName", label: "Stage Display Name", value: event.pipeline.systemStageDisplayName ?? "" },
    { key: "systemStageName", label: "Stage Name", value: event.pipeline.systemStageName ?? "" },
    { key: "systemWorkFolder", label: "System Work Folder", value: event.pipeline.systemWorkFolder ?? "" },
    { key: "tfBuild", label: "TF Build", value: event.pipeline.tfBuild ?? "" },
    { key: "systemPhaseDisplayName", label: "Phase Display Name", value: event.pipeline.systemPhaseDisplayName ?? "" },
    { key: "systemPhaseName", label: "Phase Name", value: event.pipeline.systemPhaseName ?? "" },
    { key: "systemPlanId", label: "System Plan ID", value: event.pipeline.systemPlanId ?? "" },
    { key: "systemTimelineId", label: "System Timeline ID", value: event.pipeline.systemTimelineId ?? "" },
    { key: "systemCollectionId", label: "System Collection ID", value: event.pipeline.systemCollectionId ?? "" },
    { key: "systemHostType", label: "System Host Type", value: event.pipeline.systemHostType ?? "" },
    { key: "prIsFork", label: "PR Is Fork", value: event.pipeline.prIsFork ?? "" },
    { key: "prId", label: "PR ID", value: event.pipeline.prId ?? "" },
    { key: "prNumber", label: "PR Number", value: event.pipeline.prNumber ?? "" },
    { key: "prTargetBranchName", label: "PR Target Branch", value: event.pipeline.prTargetBranchName ?? "" },
    { key: "prSourceBranch", label: "PR Source Branch", value: event.pipeline.prSourceBranch ?? "" },
    { key: "prSourceCommitId", label: "PR Source Commit", value: event.pipeline.prSourceCommitId ?? "" },
    { key: "prSourceRepoUri", label: "PR Source Repo URI", value: event.pipeline.prSourceRepoUri ?? "" },
    { key: "prTargetBranch", label: "PR Target Branch (full)", value: event.pipeline.prTargetBranch ?? "" },
    { key: "stageRequestedBy", label: "Stage Requested By", value: event.pipeline.stageRequestedBy ?? "" },
    { key: "stageRequestedForId", label: "Stage Requester ID", value: event.pipeline.stageRequestedForId ?? "" },
    { key: "triggeredByDefinitionName", label: "Triggered By Pipeline", value: event.pipeline.triggeredByDefinitionName ?? "" },
    { key: "triggeredByBuildNumber", label: "Triggered By Build #", value: event.pipeline.triggeredByBuildNumber ?? "" },
    { key: "triggeredByDefinitionId", label: "Triggered By Def ID", value: event.pipeline.triggeredByDefinitionId ?? "" },
    { key: "triggeredByBuildId", label: "Triggered By Build ID", value: event.pipeline.triggeredByBuildId ?? "" },
    { key: "environmentResourceName", label: "Env Resource Name", value: event.pipeline.environmentResourceName ?? "" },
    { key: "environmentId", label: "Environment ID", value: event.pipeline.environmentId ?? "" },
    { key: "sourceTfvcShelveset", label: "TFVC Shelveset", value: event.pipeline.sourceTfvcShelveset ?? "" },
    { key: "definitionId", label: "Definition ID", value: event.pipeline.definitionId ?? "" },
    { key: "agentId", label: "Agent ID", value: event.pipeline.agentId ?? "" },
    { key: "agentName", label: "Agent Name", value: event.pipeline.runnerName ?? "" },
    { key: "agentMachineName", label: "Agent Machine", value: event.pipeline.agentMachineName ?? "" },
    { key: "agentJobStatus", label: "Agent Job Status", value: event.pipeline.agentJobStatus ?? "" },
    { key: "agentBuildDirectory", label: "Agent Build Dir", value: event.pipeline.agentBuildDirectory ?? "" },
    { key: "agentHomeDirectory", label: "Agent Home Dir", value: event.pipeline.agentHomeDirectory ?? "" },
    { key: "agentTempDirectory", label: "Agent Temp Dir", value: event.pipeline.agentTempDirectory ?? "" },
    { key: "agentToolsDirectory", label: "Agent Tools Dir", value: event.pipeline.agentToolsDirectory ?? "" },
    { key: "agentWorkFolder", label: "Agent Work Folder", value: event.pipeline.agentWorkFolder ?? "" },
    { key: "artifactStagingDirectory", label: "Artifact Staging Dir", value: event.pipeline.artifactStagingDirectory ?? "" },
    { key: "binariesDirectory", label: "Binaries Dir", value: event.pipeline.binariesDirectory ?? "" },
    { key: "containerId", label: "Container ID", value: event.pipeline.containerId ?? "" },
    { key: "definitionVersion", label: "Definition Version", value: event.pipeline.definitionVersion ?? "" },
    { key: "repositoryLocalPath", label: "Repo Local Path", value: event.pipeline.repositoryLocalPath ?? "" },
    { key: "sourcesDirectory", label: "Sources Dir", value: event.pipeline.sourcesDirectory ?? "" },
    { key: "stagingDirectory", label: "Staging Dir", value: event.pipeline.stagingDirectory ?? "" },
    { key: "testResultsDirectory", label: "Test Results Dir", value: event.pipeline.testResultsDirectory ?? "" },
    { key: "requestedFor", label: "Requested For", value: event.pipeline.requestedFor ?? "" },
    { key: "requestedForEmail", label: "Requester Email", value: event.pipeline.requestedForEmail ?? "" },
    { key: "requestedForId", label: "Requester ID", value: event.pipeline.requestedForId ?? "" },
    { key: "queuedBy", label: "Queued By", value: event.pipeline.queuedBy ?? "" },
    { key: "queuedById", label: "Queued By ID", value: event.pipeline.queuedById ?? "" },
    { key: "sourceBranchName", label: "Source Branch Name", value: event.pipeline.sourceBranchName ?? "" },
    { key: "fullSourceBranch", label: "Source Branch (full ref)", value: event.pipeline.fullSourceBranch ?? "" },
    { key: "sourceVersionMessage", label: "Commit Message", value: event.pipeline.sourceVersionMessage ?? "" },
    { key: "repositoryId", label: "Repository ID", value: event.pipeline.repositoryId ?? "" },
    { key: "repositoryProvider", label: "Repo Provider", value: event.pipeline.repositoryProvider ?? "" },
    { key: "repositoryUri", label: "Repo URI", value: event.pipeline.repositoryUri ?? "" },
    {
      key: "duration",
      label: "Duration",
      value: event.durationMs ? `${(event.durationMs / 1e3).toFixed(1)}s` : ""
    },
    {
      key: "startedAt",
      label: "Started At",
      value: event.startedAt ? new Date(event.startedAt).toUTCString() : ""
    }
  ];
  const CORE_FIELDS = /* @__PURE__ */ new Set([
    "pipeline",
    "repository",
    "branch",
    "commit",
    "commitmessage",
    "step",
    "environment",
    "source",
    "triggeredby"
  ]);
  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, " ");
      allFields.push({ key, label: displayKey, value });
    }
  }
  if (event.pipeline.releaseArtifacts) {
    for (const [key, value] of Object.entries(event.pipeline.releaseArtifacts)) {
      const displayKey = key.replace(/^Release\.Artifacts\./, "Artifact: ");
      allFields.push({ key, label: displayKey, value: String(value) });
    }
  }
  let fieldsToDisplay = [];
  if (displayMetadata && displayMetadata.length > 0) {
    const whitelist = new Set(displayMetadata.map((k) => k.toLowerCase()));
    fieldsToDisplay = allFields.filter((f) => whitelist.has(f.key.toLowerCase()));
  } else {
    const explicitSet = new Set((event.explicitFields || []).map((f) => f.toLowerCase()));
    fieldsToDisplay = allFields.filter((f) => {
      if (f.value === "") return false;
      const isCore = CORE_FIELDS.has(f.key.toLowerCase());
      const isExplicit = explicitSet.has(f.key.toLowerCase());
      const isCustomMeta = event.metadata && event.metadata[f.key] !== void 0;
      return isCore || isExplicit || isCustomMeta;
    });
  }
  if (fieldsToDisplay.length > 0) {
    out.push("## Pipeline Metadata");
    out.push("| Field | Value |");
    out.push("| --- | --- |");
    for (const field of fieldsToDisplay) {
      out.push(`| ${field.label} | ${field.value} |`);
    }
    out.push("");
  }
  if (event.failure.errorMessage) {
    out.push("### Error Message");
    out.push("```");
    out.push(event.failure.errorMessage);
    out.push("```");
    out.push("");
  }
  if (event.failure.logs) {
    const cleaned = maskLogs ? maskSecrets(event.failure.logs) : event.failure.logs;
    const { text, failingStep } = buildSmartExcerpt(cleaned, event.source, logExcerptLines);
    const logHeader = failingStep ? `### Failing Step: ${failingStep}` : "### Relevant Logs";
    out.push(logHeader);
    if (event.failure.logsTruncated) {
      out.push("> Logs were truncated by the adapter \u2014 see attachment for full output.");
    }
    out.push("```log");
    out.push(text);
    out.push("```");
    out.push("");
  }
  out.push("### Links");
  out.push(`- [Pipeline](${event.pipeline.url})`);
  if (event.pipeline.runUrl) {
    out.push(`- [Pipeline Run](${event.pipeline.runUrl})`);
  }
  out.push(`- [Repository](${event.repository.url})`);
  out.push(`- [Commit](${event.commit.url})`);
  if (event.pullRequest) {
    out.push(`- [Pull Request #${event.pullRequest.number}](${event.pullRequest.url})`);
  }
  const externalLinks = fields.externalLinks || [];
  const renderedTitles = /* @__PURE__ */ new Set(["Pipeline", "Pipeline Run", "Repository", "Commit"]);
  for (const link of externalLinks) {
    if (renderedTitles.has(link.title) || link.title.startsWith("Commit ") || link.title.startsWith("PR #") || link.title.startsWith("Pull Request #")) {
      continue;
    }
    out.push(`- [${link.title}](${link.url})`);
  }
  out.push("");
  if (fields.provenance && Object.keys(fields.provenance).length > 0) {
    out.push("---");
    out.push("");
    out.push(
      `<sub>Generated by PipelineIQ \xB7 signature \`${fields.dedupSignature ?? "?"}\`</sub>`
    );
  }
  return out.join("\n");
}

// src/core/notifications/slack.ts
var SEVERITY_EMOJI = {
  Critical: "\u{1F534}",
  High: "\u{1F7E0}",
  Medium: "\u{1F7E1}",
  Low: "\u{1F535}"
};
async function sendSlack(payload, config) {
  const emoji = SEVERITY_EMOJI[payload.severity] ?? "\u26AA";
  const ticketStatus = payload.isNewTicket ? "new ticket" : `seen ${payload.dedupCount ?? 1}\xD7`;
  const metricsText = config.includeMetrics !== false && payload.metrics ? buildMetricsText(payload.metrics) : null;
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} [${payload.severity.toUpperCase()}] ${payload.title} \u2014 ${payload.repo}`,
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Pipeline:* ${payload.pipeline}` },
        { type: "mrkdwn", text: `*Branch:* ${payload.branch}` },
        {
          type: "mrkdwn",
          text: `*Jira:* <${payload.jiraUrl}|${payload.jiraKey}> (${ticketStatus})`
        },
        { type: "mrkdwn", text: `*Priority:* ${payload.priority}` }
      ]
    }
  ];
  if (payload.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Root cause:* ${payload.summary}` }
    });
  }
  if (metricsText) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `\u{1F4CA}  ${metricsText}` }]
    });
  }
  const body = { blocks };
  if (config.channel) body.channel = config.channel;
  if (config.username) body.username = config.username;
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
function buildMetricsText(metrics) {
  const parts = [];
  if (metrics.mttrHours !== void 0) parts.push(`MTTR ${metrics.mttrHours}h`);
  if (metrics.blastRadius !== void 0) parts.push(`${metrics.blastRadius} repos affected`);
  return parts.join("  |  ");
}

// src/core/notifications/teams.ts
var SEVERITY_COLOR = {
  Critical: "attention",
  High: "warning",
  Medium: "accent",
  Low: "good"
};
async function sendTeams(payload, config) {
  const color = SEVERITY_COLOR[payload.severity] ?? "accent";
  const ticketStatus = payload.isNewTicket ? "New ticket" : `Seen ${payload.dedupCount ?? 1}\xD7`;
  const facts = [
    { title: "Pipeline", value: payload.pipeline },
    { title: "Branch", value: payload.branch },
    { title: "Jira", value: `[${payload.jiraKey}](${payload.jiraUrl}) \u2014 ${ticketStatus}` },
    { title: "Priority", value: payload.priority }
  ];
  if (config.includeMetrics !== false && payload.metrics) {
    if (payload.metrics.mttrHours !== void 0) {
      facts.push({ title: "MTTR", value: `${payload.metrics.mttrHours}h avg` });
    }
    if (payload.metrics.blastRadius !== void 0) {
      facts.push({ title: "Blast radius", value: `${payload.metrics.blastRadius} repos` });
    }
  }
  const bodyBlocks = [
    {
      type: "TextBlock",
      text: `[${payload.severity.toUpperCase()}] ${payload.title}`,
      weight: "Bolder",
      size: "Medium",
      color
    },
    { type: "TextBlock", text: payload.repo, isSubtle: true },
    { type: "FactSet", facts }
  ];
  if (payload.summary) {
    bodyBlocks.push({ type: "TextBlock", text: payload.summary, wrap: true });
  }
  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: bodyBlocks
        }
      }
    ]
  };
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card)
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// src/core/notifications/index.ts
var NotificationService = class {
  constructor(config) {
    this.config = config;
  }
  config;
  async send(payload) {
    if (this.config.enabled === false) return {};
    const result = {};
    const tasks = [];
    if (this.config.slack) {
      const cfg = this.config.slack;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendSlack(payload, cfg).then((r) => {
          result.slack = r;
        }));
      }
    }
    if (this.config.teams) {
      const cfg = this.config.teams;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendTeams(payload, cfg).then((r) => {
          result.teams = r;
        }));
      }
    }
    const settled = await Promise.allSettled(tasks);
    for (const s of settled) {
      if (s.status === "rejected") {
        console.warn(`[PipelineIQ] Notification dispatch error: ${s.reason}`);
      }
    }
    return result;
  }
};

// src/core/self-healing/engine.ts
import * as fs2 from "fs";
import * as path2 from "path";
import { execSync } from "child_process";

// src/core/self-healing/fix-generator.ts
import * as fs from "fs";
import * as path from "path";

// src/core/ai/providers.ts
function stripThinkingTags(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
var OpenAIProvider = class {
  name = "openai";
  apiKey;
  model;
  maxTokens;
  temperature;
  endpoint;
  apiVersion;
  enableThinking;
  thinkingBudget;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4o";
    this.maxTokens = config.maxTokens || 1e3;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8e3;
  }
  isAvailable() {
    return true;
  }
  /** o1 / o3 / o4 series use Chat Completions with reasoning_effort */
  isReasoningModel(model) {
    return /^o[134][-\s]|^o[134]$/.test(model.toLowerCase());
  }
  /** gpt-5.x models use the new Responses API */
  isResponsesApiModel(model) {
    return /^gpt-5/.test(model.toLowerCase());
  }
  /**
   * Map thinkingBudget → reasoning effort for o-series Chat Completions.
   * Accepts "low" | "medium" | "high".
   */
  reasoningEffort() {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 16e3) return "high";
    if (this.thinkingBudget >= 8e3) return "medium";
    return "low";
  }
  /**
   * Map thinkingBudget → reasoning effort for gpt-5.x Responses API.
   * Accepts "none" | "minimal" | "low" | "medium" | "high" | "xhigh".
   */
  responsesApiReasoningEffort() {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 32e3) return "xhigh";
    if (this.thinkingBudget >= 16e3) return "high";
    if (this.thinkingBudget >= 8e3) return "medium";
    if (this.thinkingBudget >= 4e3) return "low";
    if (this.thinkingBudget >= 2e3) return "minimal";
    return "none";
  }
  async generateInsights(request) {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: this.apiKey });
    const fallbackModels = [
      // Mini / Nano first (cost-efficient)
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5-mini",
      "gpt-5-nano",
      // Frontier (no Pro)
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5",
      // Legacy stable
      "gpt-4o",
      "gpt-4o-mini",
      // Open-weight (last resort)
      "gpt-oss-120b",
      "gpt-oss-20b"
    ];
    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) candidateModels.push(m);
    }
    const systemPrompt = `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment

Be concise but thorough. Focus on actionable insights.`;
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError = null;
    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using OpenAI model: ${currentModelName}`);
      const isReasoning = this.isReasoningModel(currentModelName);
      const isResponsesApi = this.isResponsesApiModel(currentModelName);
      const maxRetries = 2;
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          let content = null;
          if (isResponsesApi) {
            const inputItems = request.isRawPrompt ? [{ role: "user", content: prompt }] : [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ];
            const responsesParams = {
              model: currentModelName,
              input: inputItems,
              max_output_tokens: this.maxTokens
            };
            if (this.enableThinking) {
              const effort = this.responsesApiReasoningEffort();
              responsesParams["reasoning"] = { effort };
              console.log(`[PipelineIQ] OpenAI Responses API reasoning.effort: ${effort}`);
            }
            const response = await openai.responses.create(responsesParams);
            const textItem = response.output.find(
              (item) => item.type === "message" || item.type === "output_text"
            );
            if (textItem?.type === "message") {
              const textContent = textItem.content?.find((c) => c.type === "output_text");
              content = textContent?.text ?? null;
            } else if (textItem?.type === "output_text") {
              content = textItem.text ?? null;
            }
          } else if (isReasoning) {
            const params = {
              model: currentModelName,
              messages: request.isRawPrompt ? [{ role: "user", content: prompt }] : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
              max_completion_tokens: this.maxTokens
            };
            if (this.enableThinking) {
              params["reasoning_effort"] = this.reasoningEffort();
              console.log(`[PipelineIQ] OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
            }
            const completion = await openai.chat.completions.create(params);
            content = completion.choices[0]?.message?.content ?? null;
          } else {
            const params = {
              model: currentModelName,
              messages: request.isRawPrompt ? [{ role: "user", content: prompt }] : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
              max_tokens: this.maxTokens,
              temperature: this.temperature
            };
            const completion = await openai.chat.completions.create(params);
            content = completion.choices[0]?.message?.content ?? null;
          }
          if (!content) throw new Error("No response from OpenAI");
          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content);
        } catch (error) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";
          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("500");
          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] OpenAI model ${currentModelName} hit quota/rate limit. Falling back...`);
            break;
          }
          if (isRetryable && attempt <= maxRetries) {
            const delay = Math.pow(2, attempt) * 1e3;
            console.warn(`[PipelineIQ] OpenAI API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
            await new Promise((resolve3) => setTimeout(resolve3, delay));
            continue;
          }
          break;
        }
      }
    }
    throw new Error(`OpenAI API error: ${lastError?.message || "Unknown error"}`);
  }
  buildPrompt(request) {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }
  parseResponse(content) {
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary,
        rootCause: parsed.rootCause,
        remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
        severity: parsed.severity,
        classification: parsed.classification,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment
      };
    } catch {
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity"),
        classification: this.extractField(content, "classification"),
        confidence: 0.5,
        riskAssessment: this.extractField(content, "riskAssessment")
      };
    }
  }
  extractField(content, fieldName) {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i");
    return content.match(regex)?.[1]?.trim();
  }
  extractArrayField(content, fieldName) {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
  }
};
var AnthropicProvider = class {
  name = "anthropic";
  apiKey;
  model;
  maxTokens;
  temperature;
  endpoint;
  apiVersion;
  enableThinking;
  thinkingBudget;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-sonnet-4-5";
    this.maxTokens = config.maxTokens || 1e3;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8e3;
  }
  isAvailable() {
    return true;
  }
  async generateInsights(request) {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: this.apiKey });
    const fallbackModels = [
      "claude-sonnet-4-5",
      "claude-opus-4-5",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
      "claude-3-haiku-20240307"
    ];
    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) candidateModels.push(m);
    }
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError = null;
    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using Anthropic model: ${currentModelName}`);
      const maxRetries = 2;
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const params = {
            model: currentModelName,
            // When thinking is enabled, max_tokens must exceed budget_tokens
            max_tokens: this.enableThinking ? Math.max(this.maxTokens, this.thinkingBudget + 1e3) : this.maxTokens,
            messages: [
              {
                role: "user",
                content: request.isRawPrompt ? prompt : `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment

Be concise but thorough. Focus on actionable insights.

${prompt}`
              }
            ]
          };
          if (this.enableThinking) {
            params["thinking"] = { type: "enabled", budget_tokens: this.thinkingBudget };
            params["temperature"] = 1;
            console.log(`[PipelineIQ] Anthropic extended thinking enabled (budget: ${this.thinkingBudget} tokens)`);
          } else {
            params["temperature"] = this.temperature;
          }
          const message = await anthropic.messages.create(params);
          const textBlock = message.content.find((b) => b.type === "text");
          const content = textBlock?.type === "text" ? textBlock.text : "";
          if (!content) throw new Error("No response from Anthropic");
          if (request.isRawPrompt) return { rootCause: content };
          return this.parseResponse(content);
        } catch (error) {
          attempt++;
          lastError = error;
          const errorMessage = error.message || "";
          const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("limit_exceeded");
          const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("500");
          if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
            console.warn(`[PipelineIQ] Anthropic model ${currentModelName} hit quota/rate limit. Falling back...`);
            break;
          }
          if (isRetryable && attempt <= maxRetries) {
            const delay = Math.pow(2, attempt) * 1e3;
            console.warn(`[PipelineIQ] Anthropic API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
            await new Promise((resolve3) => setTimeout(resolve3, delay));
            continue;
          }
          break;
        }
      }
    }
    throw new Error(`Anthropic API error: ${lastError?.message || "Unknown error"}`);
  }
  buildPrompt(request) {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }
  parseResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment
        };
      }
    } catch {
    }
    return {
      summary: this.extractField(content, "summary"),
      rootCause: this.extractField(content, "rootCause"),
      remediation: this.extractArrayField(content, "remediation"),
      severity: this.extractField(content, "severity"),
      classification: this.extractField(content, "classification"),
      confidence: 0.5,
      riskAssessment: this.extractField(content, "riskAssessment")
    };
  }
  extractField(content, fieldName) {
    return content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"))?.[1]?.trim();
  }
  extractArrayField(content, fieldName) {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
  }
};
var AzureOpenAIProvider = class {
  name = "azure-openai";
  apiKey;
  endpoint;
  deployment;
  apiVersion;
  model;
  maxTokens;
  temperature;
  enableThinking;
  thinkingBudget;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("Azure OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "https://your-resource.openai.azure.com";
    this.deployment = config.deployment || "gpt-4o";
    this.model = config.model || "gpt-4o";
    this.apiVersion = config.apiVersion || "2025-01-01-preview";
    this.maxTokens = config.maxTokens || 1e3;
    this.temperature = config.temperature || 0.1;
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8e3;
  }
  isAvailable() {
    return true;
  }
  isReasoningModel(deployment) {
    return /^o[134][-\s]|^o[134]$/i.test(deployment);
  }
  isResponsesApiModel(deployment) {
    return /^gpt-5/i.test(deployment);
  }
  reasoningEffort() {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 16e3) return "high";
    if (this.thinkingBudget >= 8e3) return "medium";
    return "low";
  }
  responsesApiReasoningEffort() {
    if (this.thinkingBudget < 0 || this.thinkingBudget >= 32e3) return "xhigh";
    if (this.thinkingBudget >= 16e3) return "high";
    if (this.thinkingBudget >= 8e3) return "medium";
    if (this.thinkingBudget >= 4e3) return "low";
    if (this.thinkingBudget >= 2e3) return "minimal";
    return "none";
  }
  async generateInsights(request) {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: `${this.endpoint}/openai/deployments/${this.deployment}`,
      defaultQuery: { "api-version": this.apiVersion },
      defaultHeaders: { "api-key": this.apiKey }
    });
    const systemPrompt = `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.`;
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    console.log(`[PipelineIQ] Using Azure OpenAI deployment: ${this.deployment}`);
    const isReasoning = this.isReasoningModel(this.deployment);
    const isResponsesApi = this.isResponsesApiModel(this.deployment);
    const maxRetries = 2;
    let attempt = 0;
    let lastError = null;
    while (attempt <= maxRetries) {
      try {
        let content = null;
        if (isResponsesApi) {
          const inputItems = request.isRawPrompt ? [{ role: "user", content: prompt }] : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];
          const responsesParams = {
            model: this.deployment,
            input: inputItems,
            max_output_tokens: this.maxTokens
          };
          if (this.enableThinking) {
            const effort = this.responsesApiReasoningEffort();
            responsesParams["reasoning"] = { effort };
            console.log(`[PipelineIQ] Azure OpenAI Responses API reasoning.effort: ${effort}`);
          }
          const response = await openai.responses.create(responsesParams);
          const textItem = response.output.find(
            (item) => item.type === "message" || item.type === "output_text"
          );
          if (textItem?.type === "message") {
            const textContent = textItem.content?.find((c) => c.type === "output_text");
            content = textContent?.text ?? null;
          } else if (textItem?.type === "output_text") {
            content = textItem.text ?? null;
          }
        } else if (isReasoning) {
          const params = {
            model: this.deployment,
            messages: request.isRawPrompt ? [{ role: "user", content: prompt }] : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            max_completion_tokens: this.maxTokens
          };
          if (this.enableThinking) {
            params["reasoning_effort"] = this.reasoningEffort();
            console.log(`[PipelineIQ] Azure OpenAI reasoning_effort: ${params["reasoning_effort"]}`);
          }
          const completion = await openai.chat.completions.create(params);
          content = completion.choices[0]?.message?.content ?? null;
        } else {
          const params = {
            model: this.deployment,
            messages: request.isRawPrompt ? [{ role: "user", content: prompt }] : [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            max_tokens: this.maxTokens,
            temperature: this.temperature
          };
          const completion = await openai.chat.completions.create(params);
          content = completion.choices[0]?.message?.content ?? null;
        }
        if (!content) throw new Error("No response from Azure OpenAI");
        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content);
      } catch (error) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";
        const isRetryable = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("500");
        if (isRetryable && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1e3;
          console.warn(`[PipelineIQ] Azure OpenAI API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
          await new Promise((resolve3) => setTimeout(resolve3, delay));
          continue;
        }
        break;
      }
    }
    throw new Error(`Azure OpenAI API error: ${lastError?.message || "Unknown error"}`);
  }
  buildPrompt(request) {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment || "Not specified"}
Exit Code: ${request.exitCode || "Not specified"}
Failed Command: ${request.failedCommand || "Not specified"}

Error Message:
${request.errorMessage || "No error message provided"}

Stack Trace:
${request.stackTrace || "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext || "No historical context available"}

Current Category: ${request.category || "Not classified yet"}
`;
  }
  parseResponse(content) {
    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary,
        rootCause: parsed.rootCause,
        remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
        severity: parsed.severity,
        classification: parsed.classification,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment
      };
    } catch {
      return {
        summary: this.extractField(content, "summary"),
        rootCause: this.extractField(content, "rootCause"),
        remediation: this.extractArrayField(content, "remediation"),
        severity: this.extractField(content, "severity"),
        classification: this.extractField(content, "classification"),
        confidence: 0.5,
        riskAssessment: this.extractField(content, "riskAssessment")
      };
    }
  }
  extractField(content, fieldName) {
    return content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"))?.[1]?.trim();
  }
  extractArrayField(content, fieldName) {
    const match = content.match(new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, "i"));
    if (!match) return [];
    const value = match[1]?.trim() ?? "";
    try {
      return JSON.parse(value);
    } catch {
      return value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
  }
};
var LocalAIProvider = class {
  name = "local";
  baseURL;
  model;
  maxTokens;
  temperature;
  apiKey;
  enableThinking;
  constructor(config) {
    if (!config.endpoint) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.endpoint (e.g. 'http://localhost:11434/v1')"
      );
    }
    if (!config.model) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.model (e.g. 'llama3.2')"
      );
    }
    this.baseURL = config.endpoint;
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? 1e3;
    this.temperature = config.temperature ?? 0.1;
    this.apiKey = config.apiKey ?? "local";
    this.enableThinking = config.enableThinking ?? false;
  }
  isAvailable() {
    return true;
  }
  async generateInsights(request) {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: this.baseURL, apiKey: this.apiKey });
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    console.log(`[PipelineIQ] Using Local AI model: ${this.model}`);
    const systemContent = this.enableThinking ? `You are a CI/CD failure analysis expert. Before answering, think through the problem step by step inside <think></think> tags, then provide your structured JSON response outside those tags.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.` : `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with: summary, rootCause, remediation (array), severity (Critical/High/Medium/Low), classification, confidence (0-1), riskAssessment.`;
    const maxRetries = 2;
    let attempt = 0;
    let lastError = null;
    while (attempt <= maxRetries) {
      try {
        const completion = await client.chat.completions.create({
          model: this.model,
          messages: request.isRawPrompt ? [
            { role: "user", content: prompt }
          ] : [
            { role: "system", content: systemContent },
            { role: "user", content: prompt }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        });
        let content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No response from local AI");
        content = stripThinkingTags(content);
        if (request.isRawPrompt) return { rootCause: content };
        return this.parseResponse(content);
      } catch (error) {
        attempt++;
        lastError = error;
        const errorMessage = error.message || "";
        const isRetryable = errorMessage.includes("429") || errorMessage.includes("rate_limit") || errorMessage.includes("503") || errorMessage.includes("500") || errorMessage.includes("fetch failed");
        if (isRetryable && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1e3;
          console.warn(`[PipelineIQ] Local AI error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
          await new Promise((resolve3) => setTimeout(resolve3, delay));
          continue;
        }
        break;
      }
    }
    throw new Error(`Local AI error: ${lastError?.message || "Unknown error"}`);
  }
  buildPrompt(request) {
    return `
Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment ?? "Not specified"}
Exit Code: ${request.exitCode ?? "Not specified"}
Failed Command: ${request.failedCommand ?? "Not specified"}

Error Message:
${request.errorMessage ?? "No error message provided"}

Stack Trace:
${request.stackTrace ?? "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext ?? "No historical context available"}

Current Category: ${request.category ?? "Not classified yet"}`;
  }
  parseResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation) ? parsed.remediation : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment
        };
      }
    } catch {
    }
    return { confidence: 0.5 };
  }
};

// src/core/ai/gemini-provider.ts
var GeminiProvider = class {
  name = "gemini";
  apiKey;
  model;
  maxTokens;
  temperature;
  endpoint;
  enableThinking;
  thinkingBudget;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-2.5-flash";
    this.maxTokens = config.maxTokens || 4e3;
    this.temperature = config.temperature || 0.1;
    this.endpoint = config.endpoint || "https://generativelanguage.googleapis.com/v1beta";
    this.enableThinking = config.enableThinking ?? false;
    this.thinkingBudget = config.thinkingBudget ?? 8e3;
  }
  isAvailable() {
    return true;
  }
  async generateInsights(request) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const fallbackModels = [
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ];
    const candidateModels = [this.model];
    for (const m of fallbackModels) {
      if (m !== this.model) {
        candidateModels.push(m);
      }
    }
    const prompt = request.isRawPrompt ? request.logs : this.buildPrompt(request);
    let lastError = null;
    for (const currentModelName of candidateModels) {
      console.log(`[PipelineIQ] Using Gemini model: ${currentModelName}`);
      try {
        const generationConfig = {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          responseMimeType: "application/json"
        };
        if (this.enableThinking) {
          generationConfig["thinkingConfig"] = { thinkingBudget: this.thinkingBudget };
        }
        const model = genAI.getGenerativeModel({
          model: currentModelName,
          generationConfig
        });
        const maxRetries = 2;
        let attempt = 0;
        while (attempt <= maxRetries) {
          try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (request.isRawPrompt) {
              return { rootCause: text };
            }
            return this.parseResponse(text);
          } catch (error) {
            attempt++;
            lastError = error;
            const errorMessage = error.message || "";
            const isQuotaOrRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota");
            const isRetryable = isQuotaOrRateLimit || errorMessage.includes("503") || errorMessage.includes("Service Unavailable");
            if (isQuotaOrRateLimit && currentModelName !== candidateModels[candidateModels.length - 1]) {
              console.warn(`[PipelineIQ] Gemini model ${currentModelName} hit quota/rate limit. Falling back to the next available model...`);
              break;
            }
            if (isRetryable && attempt <= maxRetries) {
              const delay = Math.pow(2, attempt) * 1e3;
              console.warn(`[PipelineIQ] Gemini API error (${errorMessage}). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
              await new Promise((resolve3) => setTimeout(resolve3, delay));
              continue;
            }
            break;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
    console.error("Gemini API error after trying all candidate models:", lastError);
    throw new Error(`Gemini API error: ${lastError?.message || "Unknown error"}`);
  }
  buildPrompt(request) {
    return `You are an expert DevOps and software engineering analyst. Analyze the following CI/CD failure and provide insights.

**Failure Context:**
- Pipeline: ${request.pipelineName}
- Repository: ${request.repositoryName}
- Branch: ${request.branch}
- Environment: ${request.environment || "Unknown"}
- Error: ${request.errorMessage || "No error message"}
- Exit Code: ${request.exitCode || "Unknown"}
- Failed Command: ${request.failedCommand || "Unknown"}

**Logs:**
\`\`\`
${request.logs}
\`\`\`

${request.stackTrace ? `
**Stack Trace:**
\`\`\`${request.stackTrace}\`\`\`` : ""}

${request.historicalContext ? `
**Historical Context:**
${request.historicalContext}` : ""}

Please provide a JSON response with the following structure:
{
  "summary": "Brief summary of what went wrong (max 255 characters)",
  "rootCause": "Detailed explanation of the root cause",
  "remediation": ["Step 1: Fix this", "Step 2: Do that", "Step 3: Verify"],
  "severity": "Critical|High|Medium|Low",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "classification": "Infrastructure|Build|Deployment|Test|Dependency|Security|Authentication|Timeout|Network|CloudProvider|Unknown",
  "riskAssessment": "Brief risk assessment",
  "timeline": "Estimated time to fix"
}

Focus on actionable insights and practical solutions. Be specific and helpful.`;
  }
  parseResponse(text) {
    const jsonStr = text.trim().startsWith("{") ? text : (() => {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? m[0] : null;
    })();
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          summary: parsed.summary || "Analysis completed",
          rootCause: parsed.rootCause || "Unable to determine root cause",
          remediation: parsed.remediation || ["Review logs for more details"],
          severity: parsed.severity || "Medium",
          assignee: null,
          tags: parsed.tags || [],
          confidence: parsed.confidence ?? 0.8,
          classification: parsed.classification || "Unknown",
          riskAssessment: parsed.riskAssessment,
          timeline: parsed.timeline
        };
      } catch (error) {
        console.error("Failed to parse Gemini response JSON:", error);
      }
    }
    throw new Error(`Gemini returned unparseable response: ${text.slice(0, 200)}`);
  }
};

// src/core/self-healing/fix-generator.ts
var FixGenerator = class {
  provider = null;
  constructor(config) {
    this.provider = this.initializeProvider(config);
  }
  initializeProvider(config) {
    if (!config.provider || !config.apiKey) return null;
    try {
      switch (config.provider) {
        case "openai":
          return new OpenAIProvider(config);
        case "anthropic":
          return new AnthropicProvider(config);
        case "azure-openai":
          return new AzureOpenAIProvider(config);
        case "local":
          return new LocalAIProvider(config);
        case "gemini":
          return new GeminiProvider(config);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  isAvailable() {
    return this.provider !== null && this.provider.isAvailable();
  }
  /**
   * Generate a structured code fix from the failure context.
   *
   * @param event       The full failure event with logs, errors, etc.
   * @param rootCause   AI-generated root cause analysis
   * @param remediation AI-generated remediation steps
   * @param category    Failure classification
   * @returns           A CodeFix if the AI can produce one, or null
   */
  async generateFix(event, rootCause, remediation, category, retryContext) {
    if (!this.provider) return null;
    const prompt = this.buildFixPrompt(event, rootCause, remediation, category, retryContext);
    try {
      const response = await this.provider.generateInsights({
        logs: prompt,
        errorMessage: event.failure.errorMessage ?? "",
        pipelineName: event.pipeline.name,
        repositoryName: event.repository.name,
        branch: event.branch,
        category,
        isRawPrompt: true
      });
      const fixJson = response.rootCause;
      if (!fixJson) return null;
      return this.parseFix(fixJson, category);
    } catch (error) {
      console.warn(`[PipelineIQ] Fix generation failed: ${error}`);
      return null;
    }
  }
  /**
   * Determine the root workspace path (GitHub, ADO, or local fallback)
   */
  getWorkspaceRoot() {
    return process.env.GITHUB_WORKSPACE || process.env.SYSTEM_DEFAULTWORKINGDIRECTORY || process.cwd();
  }
  extractFilePaths(text) {
    const regex = /(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.[a-zA-Z][a-zA-Z0-9_-]*\b/g;
    const matches = text.match(regex) || [];
    const paths = [...new Set(matches)].filter((p) => !p.includes("node_modules"));
    const root = this.getWorkspaceRoot();
    try {
      if (!paths.includes("package.json") && fs.existsSync(path.resolve(root, "package.json"))) {
        paths.push("package.json");
      }
    } catch {
    }
    return paths;
  }
  /**
   * Read files from the local workspace to give the AI context.
   */
  getWorkspaceContext(event, rootCause) {
    const textToScan = `${event.failure.errorMessage ?? ""}
${event.failure.logs ?? ""}
${rootCause}`;
    const paths = this.extractFilePaths(textToScan);
    if (paths.length === 0) return "";
    const root = this.getWorkspaceRoot();
    const fileContents = [];
    for (const p of paths.slice(0, 10)) {
      try {
        const fullPath = path.resolve(root, p);
        if (!fullPath.startsWith(path.resolve(root))) continue;
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const truncated = content.split("\n").slice(0, 1e3).join("\n");
          fileContents.push(`--- FILE: ${p} ---
${truncated}`);
        }
      } catch (e) {
      }
    }
    if (fileContents.length === 0) return "";
    return `
LOCAL WORKSPACE CONTEXT (Source Code for failing files):
${fileContents.join("\n\n")}
`;
  }
  /**
   * Build the specialized prompt for code fix generation.
   * This is the core of the self-healing intelligence.
   */
  buildFixPrompt(event, rootCause, remediation, category, retryContext) {
    const workspaceContext = this.getWorkspaceContext(event, rootCause);
    const retrySection = retryContext ? `
PREVIOUS ATTEMPT FAILED VERIFICATION:
Your previous fix was applied locally and failed the build with this error:
${retryContext.previousError}
Generate a CORRECTED fix that addresses both the original failure AND avoids this new error. Pay special attention to syntax correctness \u2014 do not break method chains, leave orphaned operators, or introduce incomplete statements.
` : "";
    return `You are a CI/CD Self-Healing Engine. Your task is to generate a PRECISE code fix for a pipeline failure.${retrySection}

IMPORTANT RULES:
- Generate comprehensive fixes that address the root cause entirely.
- You may modify as many files and lines as necessary to ensure the pipeline succeeds.
- NEVER modify files containing secrets, credentials, or environment variables.
- NEVER attempt to manually generate or edit auto-generated lockfiles (e.g., package-lock.json, yarn.lock, pnpm-lock.yaml, Cargo.lock, Gemfile.lock). If you need to add, update, or remove dependencies, edit only the package specification file (e.g., package.json, Cargo.toml, Gemfile). The Self-Healing Engine will automatically execute the necessary package installation commands (like npm install) locally to safely regenerate and synchronize the lockfile. Therefore, you do not need to include any lockfile files in your 'changes' list.
- Output ONLY valid JSON \u2014 no markdown fences, no explanation outside JSON.
- If you cannot generate a confident fix, return: {"canFix": false, "reason": "explanation"}

FAILURE CONTEXT:
- Repository: ${event.repository.owner}/${event.repository.name}
- Branch: ${event.branch}
- Pipeline: ${event.pipeline.name}
- Failed Step: ${event.pipeline.step ?? "unknown"}
- Exit Code: ${event.failure.exitCode ?? "unknown"}
- Category: ${category}

ROOT CAUSE:
${rootCause}

REMEDIATION STEPS:
${remediation.map((s, i) => `${i + 1}. ${s}`).join("\n")}

ERROR MESSAGE:
${event.failure.errorMessage ?? "No error message"}

RELEVANT LOGS (last 100 lines):
${(event.failure.logs ?? "").split("\n").slice(-100).join("\n")}${workspaceContext}

Generate a JSON response with this EXACT structure:
{
  "canFix": true,
  "title": "Short fix title (max 80 chars)",
  "description": "What the fix does and why",
  "confidence": 0.85,
  "riskLevel": "low",
  "estimatedTimeSavedMinutes": 15,
  "changes": [
    {
      "filePath": "relative/path/to/file.ts",
      "action": "modify",
      "originalContent": "...exact snippet from the file to replace...",
      "newContent": "...new snippet to insert...",
      "changeDescription": "What this specific change does"
    }
  ]
}`;
  }
  /**
   * Parse the AI response into a structured CodeFix.
   */
  parseFix(rawResponse, category) {
    try {
      let jsonStr = rawResponse;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      if (!parsed.canFix) {
        console.info(`[PipelineIQ] AI determined fix is not possible: ${parsed.reason ?? "unknown"}`);
        return null;
      }
      if (!parsed.changes || !Array.isArray(parsed.changes) || parsed.changes.length === 0) {
        return null;
      }
      const changes = parsed.changes.map((c) => ({
        filePath: c.filePath,
        action: c.action ?? "modify",
        originalContent: c.originalContent,
        newContent: c.newContent,
        changeDescription: c.changeDescription ?? "Auto-generated fix"
      }));
      const fixId = `piq-fix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return {
        id: fixId,
        title: parsed.title ?? "Automated pipeline fix",
        description: parsed.description ?? "Fix generated by PipelineIQ Self-Healing Engine",
        changes,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        category,
        riskLevel: parsed.riskLevel ?? "medium",
        estimatedTimeSavedMinutes: parsed.estimatedTimeSavedMinutes
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Failed to parse AI fix response: ${error}`);
      console.warn(`[PipelineIQ] Raw AI response was:`, rawResponse);
      return null;
    }
  }
};

// src/core/self-healing/patch.ts
function applyPatch(originalContent, originalSnippet, newSnippet, filePath) {
  const fileDesc = filePath ? ` in ${filePath}` : "";
  const normalizeNewlines = (str) => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const hasCRLF = originalContent.includes("\r\n");
  const content = normalizeNewlines(originalContent);
  const snippet = normalizeNewlines(originalSnippet);
  const replacement = normalizeNewlines(newSnippet);
  const restoreLineEndings = (str) => hasCRLF ? str.replace(/\n/g, "\r\n") : str;
  if (content.includes(snippet)) {
    const patched = content.replace(snippet, replacement);
    return restoreLineEndings(patched);
  }
  const contentLines = content.split("\n");
  const snippetLines = snippet.split("\n");
  let startIdx = 0;
  while (startIdx < snippetLines.length && (snippetLines[startIdx] ?? "").trim() === "") {
    startIdx++;
  }
  let endIdx = snippetLines.length - 1;
  while (endIdx >= startIdx && (snippetLines[endIdx] ?? "").trim() === "") {
    endIdx--;
  }
  if (startIdx <= endIdx) {
    const targetLines = snippetLines.slice(startIdx, endIdx + 1);
    const matchIdx = contentLines.findIndex((_, i) => {
      if (i + targetLines.length > contentLines.length) return false;
      for (let j = 0; j < targetLines.length; j++) {
        if ((contentLines[i + j] ?? "").trim() !== (targetLines[j] ?? "").trim()) {
          return false;
        }
      }
      return true;
    });
    if (matchIdx !== -1) {
      const before = contentLines.slice(0, matchIdx).join("\n");
      const after = contentLines.slice(matchIdx + targetLines.length).join("\n");
      const patched = [before, replacement, after].filter((p) => p !== "").join("\n");
      return restoreLineEndings(patched);
    }
  }
  const collapseWS = (str) => str.replace(/[ \t]+/g, " ");
  const collapsedContent = collapseWS(content);
  const collapsedSnippet = collapseWS(snippet);
  if (collapsedSnippet.length > 0 && collapsedContent.includes(collapsedSnippet)) {
    const matchStart = collapsedContent.indexOf(collapsedSnippet);
    let origIdx = 0;
    let collIdx = 0;
    while (collIdx < matchStart && origIdx < content.length) {
      const ch = content[origIdx];
      if (/[ \t]/.test(ch)) {
        origIdx++;
        while (origIdx < content.length && /[ \t]/.test(content[origIdx])) {
          origIdx++;
        }
        collIdx++;
      } else {
        origIdx++;
        collIdx++;
      }
    }
    const realStart = origIdx;
    let snippetCollIdx = 0;
    while (snippetCollIdx < collapsedSnippet.length && origIdx < content.length) {
      const ch = content[origIdx];
      if (/[ \t]/.test(ch)) {
        origIdx++;
        while (origIdx < content.length && /[ \t]/.test(content[origIdx])) {
          origIdx++;
        }
        snippetCollIdx++;
      } else {
        origIdx++;
        snippetCollIdx++;
      }
    }
    const realEnd = origIdx;
    const patched = content.slice(0, realStart) + replacement + content.slice(realEnd);
    return restoreLineEndings(patched);
  }
  throw new Error(`Could not find the original code snippet to modify${fileDesc}.`);
}

// src/core/self-healing/github-provider.ts
var GitHubProvider = class {
  name = "github";
  token;
  constructor(token) {
    if (!token) {
      throw new Error("[PipelineIQ] GitHub token is required for self-healing PR creation");
    }
    this.token = token;
  }
  async createFixPR(fix, repoOwner, repoName, baseBranch, baseSha, issueKey, options) {
    const { Octokit: Octokit2 } = await import("@octokit/rest");
    const octokit = new Octokit2({ auth: this.token });
    const branchName = options.branchName;
    const ref = `refs/heads/${branchName}`;
    try {
      await octokit.git.createRef({
        owner: repoOwner,
        repo: repoName,
        ref,
        sha: baseSha
      });
    } catch (e) {
      if (e.status === 422 && String(e).includes("Reference already exists")) {
        console.warn(`[PipelineIQ] Branch ${branchName} already exists. Deleting it to recreate cleanly...`);
        try {
          await octokit.git.deleteRef({
            owner: repoOwner,
            repo: repoName,
            ref: `heads/${branchName}`
          });
          await octokit.git.createRef({
            owner: repoOwner,
            repo: repoName,
            ref,
            sha: baseSha
          });
        } catch (deleteError) {
          console.error(`[PipelineIQ] Failed to recreate branch reference:`, {
            status: deleteError.status,
            message: deleteError.message,
            data: deleteError.response?.data
          });
          throw deleteError;
        }
      } else {
        console.error(`[PipelineIQ] Failed to create branch reference:`, {
          status: e.status,
          message: e.message,
          data: e.response?.data
        });
        throw e;
      }
    }
    const treeItems = [];
    for (const change of fix.changes) {
      if (change.action === "delete") {
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          sha: null
        });
      } else if (change.action === "modify" && change.originalContent) {
        const fullContent = await this.fetchAndPatch(
          octokit,
          repoOwner,
          repoName,
          baseSha,
          change.filePath,
          change.originalContent,
          change.newContent ?? ""
        );
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: fullContent
        });
      } else {
        treeItems.push({
          path: change.filePath,
          mode: "100644",
          type: "blob",
          content: change.newContent ?? ""
        });
      }
    }
    const tree = await octokit.git.createTree({
      owner: repoOwner,
      repo: repoName,
      base_tree: baseSha,
      tree: treeItems
    });
    const commitMessage = this.buildCommitMessage(fix, issueKey);
    const commit = await octokit.git.createCommit({
      owner: repoOwner,
      repo: repoName,
      message: commitMessage,
      tree: tree.data.sha,
      parents: [baseSha]
    });
    await octokit.git.updateRef({
      owner: repoOwner,
      repo: repoName,
      ref: `heads/${branchName}`,
      sha: commit.data.sha
    });
    const prBody = this.buildPRBody(fix, issueKey);
    let pr;
    try {
      pr = await octokit.pulls.create({
        owner: repoOwner,
        repo: repoName,
        title: `\u{1F916} [PipelineIQ] ${fix.title}`,
        head: branchName,
        base: baseBranch,
        body: prBody,
        draft: options.draft
      });
    } catch (error) {
      console.error(`[PipelineIQ] GitHub pulls.create API call failed:`, {
        status: error.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
    if (options.reviewers.length > 0) {
      try {
        await octokit.pulls.requestReviewers({
          owner: repoOwner,
          repo: repoName,
          pull_number: pr.data.number,
          reviewers: options.reviewers
        });
      } catch (e) {
        console.warn(`[PipelineIQ] Failed to request reviewers: ${e}`);
      }
    }
    if (options.labels.length > 0) {
      try {
        await octokit.issues.addLabels({
          owner: repoOwner,
          repo: repoName,
          issue_number: pr.data.number,
          labels: options.labels
        });
      } catch (e) {
        console.warn(`[PipelineIQ] Failed to apply labels: ${e}`);
      }
    }
    return {
      prUrl: pr.data.html_url,
      prNumber: pr.data.number,
      branchName
    };
  }
  buildCommitMessage(fix, issueKey) {
    const filesChanged = fix.changes.map((c) => `  - ${c.action}: ${c.filePath}`).join("\n");
    return [
      `fix: ${fix.title}`,
      "",
      fix.description,
      "",
      `Files changed:`,
      filesChanged,
      "",
      `Jira: ${issueKey}`,
      `Confidence: ${Math.round(fix.confidence * 100)}%`,
      `Risk: ${fix.riskLevel}`,
      "",
      `Generated by PipelineIQ Self-Healing Engine`
    ].join("\n");
  }
  buildPRBody(fix, issueKey) {
    const changeList = fix.changes.map((c) => `| \`${c.filePath}\` | ${c.action} | ${c.changeDescription} |`).join("\n");
    return [
      `## \u{1F916} PipelineIQ Self-Healing Fix`,
      "",
      `> **This PR was automatically generated by PipelineIQ.** It requires human review and approval before merging.`,
      "",
      `### Summary`,
      fix.description,
      "",
      `### Changes`,
      `| File | Action | Description |`,
      `| --- | --- | --- |`,
      changeList,
      "",
      `### Metadata`,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Jira Issue | ${issueKey} |`,
      `| AI Confidence | ${Math.round(fix.confidence * 100)}% |`,
      `| Risk Level | ${fix.riskLevel} |`,
      `| Category | ${fix.category} |`,
      fix.estimatedTimeSavedMinutes ? `| Est. Time Saved | ${fix.estimatedTimeSavedMinutes} min |` : "",
      "",
      `### \u26A0\uFE0F Review Checklist`,
      `- [ ] Fix addresses the root cause correctly`,
      `- [ ] No unintended side effects`,
      `- [ ] Tests pass with this change`,
      `- [ ] Safe to merge to target branch`,
      "",
      `---`,
      `<sub>Generated by PipelineIQ Self-Healing Engine \xB7 Fix ID: \`${fix.id}\`</sub>`
    ].filter(Boolean).join("\n");
  }
  /**
   * Fetch the original file content from the repo and apply the AI's
   * snippet-level patch to produce the full modified file.
   *
   * The Git Trees API requires full file content for modifications, but
   * the AI only generates the snippet that needs changing. This method
   * bridges that gap by:
   *   1. Fetching the file at the base commit SHA
   *   2. Finding the originalContent snippet in the file
   *   3. Replacing it with the newContent snippet
   */
  async fetchAndPatch(octokit, owner, repo, baseSha, filePath, originalSnippet, newSnippet) {
    let originalFile;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: baseSha
      });
      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        throw new Error(`Path "${filePath}" is not a file`);
      }
      originalFile = Buffer.from(data.content, "base64").toString("utf-8");
    } catch (error) {
      console.warn(`[PipelineIQ] Could not fetch ${filePath} for patching: ${error}`);
      return newSnippet;
    }
    return applyPatch(originalFile, originalSnippet, newSnippet, filePath);
  }
};

// src/core/self-healing/azure-provider.ts
var AzureDevOpsProvider = class {
  name = "azure-devops";
  token;
  orgUrl;
  constructor(token, orgUrl) {
    if (!token) {
      throw new Error("[PipelineIQ] Azure DevOps token is required for self-healing PR creation");
    }
    if (!orgUrl) {
      throw new Error("[PipelineIQ] Azure DevOps organization URL is required");
    }
    this.token = token;
    this.orgUrl = orgUrl.replace(/\/+$/, "");
  }
  async createFixPR(fix, repoOwner, repoName, baseBranch, baseSha, issueKey, options) {
    const { default: axios } = await import("axios");
    const projectName = repoOwner;
    const apiBase = `${this.orgUrl}/${projectName}/_apis/git/repositories/${repoName}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`:${this.token}`).toString("base64")}`
    };
    const apiVersion = "api-version=7.1";
    const branchName = options.branchName;
    const changes = fix.changes.map(async (change) => {
      if (change.action === "delete") {
        return {
          changeType: "delete",
          item: { path: `/${change.filePath}` }
        };
      } else if (change.action === "create") {
        return {
          changeType: "add",
          item: { path: `/${change.filePath}` },
          newContent: {
            content: change.newContent ?? "",
            contentType: "rawtext"
          }
        };
      } else if (change.action === "modify" && change.originalContent) {
        const fullContent = await this.fetchAndPatch(
          axios,
          apiBase,
          apiVersion,
          baseSha,
          change.filePath,
          change.originalContent,
          change.newContent ?? "",
          headers
        );
        return {
          changeType: "edit",
          item: { path: `/${change.filePath}` },
          newContent: {
            content: fullContent,
            contentType: "rawtext"
          }
        };
      } else {
        return {
          changeType: "edit",
          item: { path: `/${change.filePath}` },
          newContent: {
            content: change.newContent ?? "",
            contentType: "rawtext"
          }
        };
      }
    });
    const resolvedChanges = await Promise.all(changes);
    const commitMessage = this.buildCommitMessage(fix, issueKey);
    const pushPayload = {
      refUpdates: [
        {
          name: `refs/heads/${branchName}`,
          oldObjectId: baseSha
        }
      ],
      commits: [
        {
          comment: commitMessage,
          changes: resolvedChanges
        }
      ]
    };
    await axios.post(`${apiBase}/pushes?${apiVersion}`, pushPayload, { headers });
    const baseBranchRef = baseBranch.startsWith("refs/") ? baseBranch : `refs/heads/${baseBranch}`;
    const prBody = this.buildPRBody(fix, issueKey);
    const prPayload = {
      sourceRefName: `refs/heads/${branchName}`,
      targetRefName: baseBranchRef,
      title: `\u{1F916} [PipelineIQ] ${fix.title}`,
      description: prBody,
      isDraft: options.draft
    };
    if (options.reviewers.length > 0) {
      prPayload.reviewers = options.reviewers.map((r) => ({
        id: r
        // ADO reviewer IDs or unique names
      }));
    }
    const prResponse = await axios.post(
      `${apiBase}/pullrequests?${apiVersion}`,
      prPayload,
      { headers }
    );
    const prData = prResponse.data;
    const prId = prData.pullRequestId;
    const prUrl = `${this.orgUrl}/${projectName}/_git/${repoName}/pullrequest/${prId}`;
    if (options.labels.length > 0) {
      for (const label of options.labels) {
        try {
          await axios.post(
            `${apiBase}/pullrequests/${prId}/labels?${apiVersion}`,
            { name: label },
            { headers }
          );
        } catch (e) {
          console.warn(`[PipelineIQ] Failed to apply ADO PR label "${label}": ${e}`);
        }
      }
    }
    return {
      prUrl,
      prNumber: prId,
      branchName
    };
  }
  buildCommitMessage(fix, issueKey) {
    return [
      `fix: ${fix.title}`,
      "",
      fix.description,
      "",
      `Jira: ${issueKey}`,
      `Confidence: ${Math.round(fix.confidence * 100)}%`,
      "",
      `Generated by PipelineIQ Self-Healing Engine`
    ].join("\n");
  }
  buildPRBody(fix, issueKey) {
    const changeList = fix.changes.map((c) => `| \`${c.filePath}\` | ${c.action} | ${c.changeDescription} |`).join("\n");
    return [
      `## \u{1F916} PipelineIQ Self-Healing Fix`,
      "",
      `> **This PR was automatically generated by PipelineIQ.** It requires human review and approval before merging.`,
      "",
      `### Summary`,
      fix.description,
      "",
      `### Changes`,
      `| File | Action | Description |`,
      `| --- | --- | --- |`,
      changeList,
      "",
      `### Metadata`,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Jira Issue | ${issueKey} |`,
      `| AI Confidence | ${Math.round(fix.confidence * 100)}% |`,
      `| Risk Level | ${fix.riskLevel} |`,
      `| Category | ${fix.category} |`,
      "",
      `---`,
      `Generated by PipelineIQ Self-Healing Engine \xB7 Fix ID: ${fix.id}`
    ].join("\n");
  }
  /**
   * Fetch the original file content from ADO and apply the AI's
   * snippet-level patch to produce the full modified file.
   */
  async fetchAndPatch(axios, apiBase, apiVersion, baseSha, filePath, originalSnippet, newSnippet, headers) {
    let originalFile;
    try {
      const response = await axios.get(
        `${apiBase}/items?path=/${filePath}&versionDescriptor.version=${baseSha}&versionDescriptor.versionType=commit&${apiVersion}`,
        { headers, responseType: "text" }
      );
      originalFile = response.data;
    } catch (error) {
      console.warn(`[PipelineIQ] Could not fetch ${filePath} for patching: ${error}`);
      return newSnippet;
    }
    return applyPatch(originalFile, originalSnippet, newSnippet, filePath);
  }
};

// src/core/self-healing/engine.ts
var SelfHealingEngine = class {
  config;
  fixGenerator;
  constructor(config, aiConfig) {
    this.config = config;
    this.fixGenerator = new FixGenerator(aiConfig);
  }
  /**
   * Attempt to self-heal a pipeline failure.
   *
   * @param event       The failure event
   * @param rootCause   AI-generated root cause (from enrichment pipeline)
   * @param remediation AI-generated remediation steps
   * @param category    Failure classification
   * @param issueKey    The Jira issue key (for cross-linking in the PR)
   * @returns           SelfHealingResult with fix details and PR URL
   */
  async attemptFix(event, rootCause, remediation, category, issueKey) {
    if (!this.isCategoryAllowed(category)) {
      return {
        attempted: false,
        success: false,
        reason: `Category "${category}" is not eligible for self-healing (allowed: ${this.config.allowedCategories.join(", ")})`,
        dryRun: this.config.dryRun
      };
    }
    if (!this.fixGenerator.isAvailable()) {
      return {
        attempted: false,
        success: false,
        reason: "AI provider is not available for fix generation",
        dryRun: this.config.dryRun
      };
    }
    let fix;
    try {
      fix = await this.fixGenerator.generateFix(event, rootCause, remediation, category);
    } catch (error) {
      return {
        attempted: true,
        success: false,
        reason: `Fix generation failed: ${error}`,
        dryRun: this.config.dryRun
      };
    }
    if (!fix) {
      return {
        attempted: true,
        success: false,
        reason: "AI could not generate a viable fix for this failure",
        dryRun: this.config.dryRun
      };
    }
    const guardrailResult = this.validateGuardrails(fix);
    if (guardrailResult) {
      return {
        attempted: true,
        success: false,
        fix,
        reason: guardrailResult,
        dryRun: this.config.dryRun
      };
    }
    if (this.config.dryRun) {
      return {
        attempted: true,
        success: true,
        fix,
        reason: "Dry run \u2014 fix generated but not applied",
        dryRun: true
      };
    }
    if (this.config.enableVerification || this.config.autoRegenerateLockfile && this.isLockfileDesync(event)) {
      const root = this.getWorkspaceRoot();
      let previousVerificationError;
      for (let verifyAttempt = 1; verifyAttempt <= 2; verifyAttempt++) {
        if (verifyAttempt === 2 && previousVerificationError) {
          console.log("[PipelineIQ] Verification failed \u2014 retrying fix generation with error feedback...");
          try {
            const retryFix = await this.fixGenerator.generateFix(
              event,
              rootCause,
              remediation,
              category,
              { previousError: previousVerificationError }
            );
            if (retryFix) {
              fix = retryFix;
            } else {
              break;
            }
          } catch {
            break;
          }
        }
        const backups = /* @__PURE__ */ new Map();
        try {
          console.log(`[PipelineIQ] Starting local verification/regeneration${verifyAttempt > 1 ? ` (attempt ${verifyAttempt})` : ""}...`);
          if (this.config.autoRegenerateLockfile && this.isLockfileDesync(event)) {
            console.log("[PipelineIQ] Lockfile desync detected \u2014 regenerating lockfile locally via npm install...");
            try {
              const lockPath = path2.resolve(root, "package-lock.json");
              if (fs2.existsSync(lockPath)) {
                backups.set("package-lock.json", fs2.readFileSync(lockPath, "utf-8"));
              } else {
                backups.set("package-lock.json", null);
              }
              execSync("npm install", { cwd: root, stdio: "inherit" });
              console.log("[PipelineIQ] Successfully regenerated package-lock.json");
              if (fs2.existsSync(lockPath)) {
                const newLockContent = fs2.readFileSync(lockPath, "utf-8");
                fix.changes = fix.changes.filter((c) => c.filePath !== "package-lock.json");
                fix.changes.push({
                  filePath: "package-lock.json",
                  action: backups.get("package-lock.json") !== null ? "modify" : "create",
                  originalContent: backups.get("package-lock.json") || "",
                  newContent: newLockContent,
                  changeDescription: "Regenerated package-lock.json to resolve desynchronization with package.json"
                });
              }
            } catch (lockError) {
              console.warn(`[PipelineIQ] Lockfile regeneration failed: ${lockError}`);
              throw new Error(`Failed to regenerate package-lock.json: ${lockError}`);
            }
          }
          for (const change of fix.changes) {
            if (change.filePath === "package-lock.json") continue;
            const fullPath = path2.resolve(root, change.filePath);
            if (fs2.existsSync(fullPath)) {
              backups.set(change.filePath, fs2.readFileSync(fullPath, "utf-8"));
            } else {
              backups.set(change.filePath, null);
            }
            if (change.action === "delete") {
              if (fs2.existsSync(fullPath)) {
                fs2.unlinkSync(fullPath);
              }
            } else if (change.action === "modify" && change.originalContent) {
              const diskContent = backups.get(change.filePath);
              if (diskContent === null || diskContent === void 0) {
                throw new Error(
                  `File "${change.filePath}" was not found in the local workspace (${root}). Add an "actions/checkout" step before "pipelineiq analyze" in your workflow so that self-healing verification can read and patch source files.`
                );
              }
              const originalContent = diskContent;
              let patched;
              try {
                patched = applyPatch(originalContent, change.originalContent ?? "", change.newContent ?? "", change.filePath);
              } catch (patchError) {
                throw new Error(`AI-generated fix references code not found in ${change.filePath} \u2014 the snippet may be hallucinated. ${patchError}`);
              }
              fs2.mkdirSync(path2.dirname(fullPath), { recursive: true });
              fs2.writeFileSync(fullPath, patched, "utf-8");
            } else {
              fs2.mkdirSync(path2.dirname(fullPath), { recursive: true });
              fs2.writeFileSync(fullPath, change.newContent ?? "", "utf-8");
            }
          }
          const verificationCommands = this.resolveVerificationCommands(category, root);
          if (this.config.enableVerification && verificationCommands.length > 0) {
            console.log(`[PipelineIQ] Running verification commands: ${verificationCommands.join(" && ")}`);
            for (const cmd of verificationCommands) {
              try {
                execSync(cmd, { cwd: root, stdio: "inherit" });
              } catch (cmdError) {
                console.warn(`[PipelineIQ] Verification command "${cmd}" failed: ${cmdError}`);
                throw new Error(`Verification command "${cmd}" failed: ${cmdError}`);
              }
            }
            console.log("[PipelineIQ] Verification commands completed successfully.");
          }
          for (const [relPath, originalContent] of backups.entries()) {
            const fullPath = path2.resolve(root, relPath);
            if (originalContent === null) {
              if (fs2.existsSync(fullPath)) fs2.unlinkSync(fullPath);
            } else {
              fs2.writeFileSync(fullPath, originalContent, "utf-8");
            }
          }
          console.log("[PipelineIQ] Restored workspace files, local verification complete.");
          break;
        } catch (verifyError) {
          for (const [relPath, originalContent] of backups.entries()) {
            const fullPath = path2.resolve(root, relPath);
            if (originalContent === null) {
              if (fs2.existsSync(fullPath)) fs2.unlinkSync(fullPath);
            } else {
              fs2.writeFileSync(fullPath, originalContent, "utf-8");
            }
          }
          const errorMsg = verifyError.message || String(verifyError);
          const isRetriable = !errorMsg.includes("was not found in the local workspace") && !errorMsg.includes("snippet may be hallucinated");
          if (!isRetriable || verifyAttempt >= 2) {
            return {
              attempted: true,
              success: false,
              fix,
              reason: `Local verification/regeneration failed: ${errorMsg}`,
              dryRun: this.config.dryRun
            };
          }
          previousVerificationError = errorMsg;
          console.warn("[PipelineIQ] Verification attempt 1 failed \u2014 will retry with error context.");
        }
      }
    }
    try {
      const provider = this.resolveProvider(event);
      const branchName = this.buildBranchName(issueKey, fix);
      const result = await provider.createFixPR(
        fix,
        event.repository.owner,
        event.repository.name,
        event.branch,
        event.commit.sha,
        issueKey,
        {
          draft: this.config.draftPr,
          reviewers: this.config.reviewers,
          labels: this.config.prLabels,
          branchName
        }
      );
      return {
        attempted: true,
        success: true,
        fix,
        prUrl: result.prUrl,
        prNumber: result.prNumber,
        branchName: result.branchName,
        dryRun: false
      };
    } catch (error) {
      const errorMessage = String(error);
      let reason = `PR creation failed: ${errorMessage}`;
      if ((errorMessage.includes("Resource not accessible by integration") || errorMessage.includes("Resource not accessible by personal access token")) && fix.changes.some((c) => c.filePath.startsWith(".github/workflows/"))) {
        reason = `Cannot modify .github/workflows/ files without a Personal Access Token (PAT) with the 'workflow' scope. Token is restricted.`;
      } else if (errorMessage.includes("Resource not accessible")) {
        reason = `Insufficient GitHub token permissions. Ensure the token has 'Contents: write' and 'Pull requests: write' access.`;
      }
      return {
        attempted: true,
        success: false,
        fix,
        reason,
        dryRun: false
      };
    }
  }
  // ── Safety Guardrails ────────────────────────────────────────────────────
  /**
   * Validate a fix against all configured safety guardrails.
   * Returns an error message if the fix is rejected, or null if it passes.
   */
  validateGuardrails(fix) {
    if (!this.config.enableGuardrails) {
      return null;
    }
    if (fix.confidence < this.config.minConfidence) {
      return `Fix confidence ${Math.round(fix.confidence * 100)}% is below threshold ${Math.round(this.config.minConfidence * 100)}%`;
    }
    if (fix.changes.length > this.config.maxFilesChanged) {
      return `Fix changes ${fix.changes.length} files (max: ${this.config.maxFilesChanged})`;
    }
    const totalLines = fix.changes.reduce((sum, c) => {
      const newLines = (c.newContent ?? "").split("\n").length;
      const oldLines = (c.originalContent ?? "").split("\n").length;
      return sum + Math.abs(newLines - oldLines) + Math.min(newLines, oldLines);
    }, 0);
    if (totalLines > this.config.maxLinesChanged) {
      return `Fix changes ~${totalLines} lines (max: ${this.config.maxLinesChanged})`;
    }
    for (const change of fix.changes) {
      for (const pattern of this.config.blockedPaths) {
        if (matchGlob(change.filePath, pattern)) {
          return `Fix touches blocked path "${change.filePath}" (pattern: ${pattern})`;
        }
      }
    }
    if (fix.riskLevel === "high") {
      return `Fix has high risk level \u2014 requires manual intervention`;
    }
    return null;
  }
  isCategoryAllowed(category) {
    if (!this.config.enableGuardrails) return true;
    return this.config.allowedCategories.some(
      (allowed) => allowed.toLowerCase() === category.toLowerCase()
    );
  }
  // ── Provider Resolution ──────────────────────────────────────────────────
  resolveProvider(event) {
    const platform = this.config.platform ?? this.detectPlatform(event);
    switch (platform) {
      case "github": {
        const token = this.config.githubToken ?? process.env.GITHUB_TOKEN ?? "";
        return new GitHubProvider(token);
      }
      case "azure-devops": {
        const token = this.config.azureToken ?? process.env.SYSTEM_ACCESSTOKEN ?? "";
        const orgUrl = process.env.SYSTEM_COLLECTIONURI ?? "";
        return new AzureDevOpsProvider(token, orgUrl);
      }
      default:
        throw new Error(`Unsupported self-healing platform: ${platform}`);
    }
  }
  detectPlatform(event) {
    if (event.source === "azure-devops") return "azure-devops";
    return "github";
  }
  // ── Branch Naming ────────────────────────────────────────────────────────
  buildBranchName(issueKey, fix) {
    const slug = fix.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    return `${this.config.branchPrefix}/${issueKey.toLowerCase()}-${slug}`;
  }
  getWorkspaceRoot() {
    return process.env.GITHUB_WORKSPACE || process.env.SYSTEM_DEFAULTWORKINGDIRECTORY || process.cwd();
  }
  isLockfileDesync(event) {
    const errorText = `${event.failure.errorMessage ?? ""}
${event.failure.logs ?? ""}`;
    return errorText.includes("package-lock.json is out of sync") || errorText.includes("package.json and package-lock.json or npm-shrinkwrap.json are in sync") || errorText.includes("npm ci failed") || errorText.includes("cipm can only install packages");
  }
  /**
   * Auto-detect the verification commands to run after applying a fix.
   *
   * Priority:
   *   1. If the user explicitly provided commands via config, use those.
   *   2. Detect the language/ecosystem from files in the workspace.
   *   3. Pick install + build/test/lint commands for that ecosystem based on
   *      the failure category.
   *   4. If the ecosystem is unrecognised, return [] (skip verification rather
   *      than running a wrong command and getting a false failure).
   */
  resolveVerificationCommands(category, root) {
    if (this.config.verificationCommands.length > 0) {
      return this.config.verificationCommands;
    }
    const exists = (f) => fs2.existsSync(path2.resolve(root, f));
    const cat = category.toLowerCase();
    if (exists("package.json")) {
      const pm = exists("yarn.lock") ? "yarn" : exists("pnpm-lock.yaml") ? "pnpm" : "npm";
      const install = pm === "yarn" ? "yarn install" : pm === "pnpm" ? "pnpm install" : "npm install";
      let scripts = {};
      try {
        scripts = JSON.parse(fs2.readFileSync(path2.resolve(root, "package.json"), "utf-8")).scripts ?? {};
      } catch {
      }
      const has = (s) => Boolean(scripts[s]);
      const run = (s) => pm === "npm" ? `npm run ${s}` : `${pm} ${s}`;
      const cmds = [install];
      if (cat === "test") {
        if (has("build")) cmds.push(run("build"));
        if (has("test")) cmds.push(run("test"));
      } else if (cat === "lint") {
        if (has("lint")) cmds.push(run("lint"));
        else if (has("lint:fix")) cmds.push(run("lint:fix"));
      } else {
        if (has("build")) cmds.push(run("build"));
        else if (has("compile")) cmds.push(run("compile"));
      }
      return cmds.length > 1 ? cmds : [];
    }
    if (exists("go.mod")) {
      if (cat === "test") return ["go test ./..."];
      return ["go build ./..."];
    }
    if (exists("Cargo.toml")) {
      if (cat === "test") return ["cargo test"];
      return ["cargo build"];
    }
    if (exists("pyproject.toml") || exists("setup.py") || exists("setup.cfg")) {
      const usesUv = exists("uv.lock");
      const usesPip = exists("requirements.txt") || exists("requirements-dev.txt");
      const install = usesUv ? "uv sync" : usesPip ? "pip install -r requirements.txt" : "pip install -e .";
      if (cat === "test") return [install, "pytest"];
      if (cat === "lint") return [install, "flake8 . || ruff check ."];
      return [install, "python -m py_compile $(find . -name '*.py' -not -path './.git/*')"];
    }
    if (exists("Pipfile")) {
      if (cat === "test") return ["pipenv install", "pipenv run pytest"];
      return ["pipenv install", `pipenv run python -c 'import compileall; compileall.compile_dir(".", quiet=True)'`];
    }
    if (exists("pom.xml")) {
      if (cat === "test") return ["mvn test -B"];
      return ["mvn compile -B"];
    }
    if (exists("build.gradle") || exists("build.gradle.kts")) {
      const gradlew = exists("gradlew") ? "./gradlew" : "gradle";
      if (cat === "test") return [`${gradlew} test`];
      return [`${gradlew} build -x test`];
    }
    if (exists("Gemfile")) {
      if (cat === "test") return ["bundle install", "bundle exec rspec"];
      return ["bundle install", "bundle exec rake"];
    }
    if (exists("composer.json")) {
      if (cat === "test") return ["composer install --no-interaction", "composer run test"];
      return ["composer install --no-interaction", "composer run build"];
    }
    if (exists("global.json") || exists("Directory.Build.props")) {
      if (cat === "test") return ["dotnet restore", "dotnet test"];
      return ["dotnet restore", "dotnet build"];
    }
    try {
      const hasDotnet = fs2.readdirSync(root).some((f) => f.endsWith(".sln") || f.endsWith(".csproj"));
      if (hasDotnet) {
        if (cat === "test") return ["dotnet restore", "dotnet test"];
        return ["dotnet restore", "dotnet build"];
      }
    } catch {
    }
    if (exists("Makefile") || exists("makefile")) {
      if (cat === "test") return ["make test"];
      return ["make build"];
    }
    console.warn("[PipelineIQ] Could not detect project ecosystem for verification \u2014 skipping local verification.");
    return [];
  }
};
function matchGlob(filePath, pattern) {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.replace(/\\/g, "/").toLowerCase();
  const regexStr = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regexStr}$`).test(normalizedPath) || new RegExp(`(^|/)${regexStr}($|/)`).test(normalizedPath);
}

// src/core/pipeline.ts
async function processFailureEvent(event, config, options = {}) {
  const logger = options.logger ?? pino({ level: "info" });
  const ctx = {
    event,
    config,
    fields: {},
    provenance: {}
  };
  const jira = options.jiraClient ?? createEnhancedJiraClient(config.jira, config.jiraCustomFields);
  const enrichers = [
    deterministicEnricher,
    computedEnricher,
    createHistoryEnricher(jira),
    ...options.extraEnrichers ?? []
  ];
  for (const enricher of enrichers) {
    logger.debug({ enricher: enricher.name }, "running enricher");
    await enricher.enrich(ctx);
  }
  ctx.fields.description = renderDescription(
    event,
    ctx.fields,
    config.logExcerptLines,
    config.maskSecrets,
    config.displayMetadata,
    ctx.history,
    ctx.metrics
  );
  ctx.fields.provenance = ctx.provenance;
  if (ctx.metrics) {
    ctx.fields.metrics = ctx.metrics;
  }
  const spec = JiraTicketSpecSchema.parse(ctx.fields);
  const metrics = ctx.metrics;
  async function maybeNotify(issueKey, isNewTicket) {
    if (!config.notifications) return void 0;
    const service = new NotificationService(config.notifications);
    const notifPayload = buildNotificationPayload(ctx, issueKey, isNewTicket, config.jira.baseUrl);
    try {
      return await service.send(notifPayload);
    } catch (error) {
      console.warn(`[PipelineIQ] Notification stage failed: ${error}`);
      return void 0;
    }
  }
  if (config.dedup.enabled) {
    const existing = await jira.findBySignature(
      config.jiraProject,
      spec.dedupSignature,
      config.dedup.windowHours
    );
    if (existing) {
      const isClosed = config.dedup.closedStatuses.includes(existing.status);
      if (isClosed && config.dedup.onClosedHit === "create-new") {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "closed duplicate found \u2014 creating new ticket as per strategy"
        );
      } else if (isClosed && config.dedup.onClosedHit === "skip") {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "closed duplicate found \u2014 skipping as per strategy"
        );
        return {
          action: "skipped",
          reason: `Duplicate closed issue: ${existing.key}`,
          spec,
          ...metrics !== void 0 && { metrics }
        };
      } else {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "dedup hit \u2014 updating existing issue"
        );
        if (isClosed && config.dedup.onClosedHit === "reopen") {
          logger.info({ issueKey: existing.key, status: existing.status }, "re-opening closed issue");
          try {
            await jira.transitionIssue(existing.key, config.dedup.reopenTransition);
            await jira.addComment(
              existing.key,
              `\u26A0\uFE0F Failure re-occurred while issue was ${existing.status}. Re-opening for investigation.`
            );
          } catch (e) {
            logger.warn({ err: e, issueKey: existing.key }, "failed to re-open issue");
          }
        }
        await jira.addComment(
          existing.key,
          `Failure recurred at ${(/* @__PURE__ */ new Date()).toISOString()} \u2014 ${event.pipeline.url}`
        );
        if (config.autoWorklog && event.durationMs) {
          const seconds = Math.floor(event.durationMs / 1e3);
          if (seconds > 0) {
            await jira.addWorklog(existing.key, seconds, `Pipeline recurrence duration: ${seconds}s`);
          }
        }
        const notifications2 = await maybeNotify(existing.key, false);
        return {
          action: "updated",
          issueKey: existing.key,
          spec,
          ...metrics !== void 0 && { metrics },
          ...notifications2 !== void 0 && { notifications: notifications2 }
        };
      }
    }
  }
  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");
  if (config.dedup.enabled) {
    const existing = await jira.findBySignature(
      config.jiraProject,
      spec.dedupSignature,
      config.dedup.windowHours
    );
    if (existing && existing.key !== created.key && config.dedup.closedStatuses.includes(existing.status) && config.dedup.onClosedHit === "create-new") {
      try {
        await jira.linkIssues(created.key, existing.key, "Relates");
        await jira.addComment(
          created.key,
          `\u2139\uFE0F This failure was previously tracked in ${existing.key} (Status: ${existing.status}). A new ticket has been opened to track the fresh effort.`
        );
      } catch (e) {
        logger.warn({ err: e }, "failed to link new issue to previous one");
      }
    }
  }
  if (config.autoWorklog && event.durationMs) {
    const seconds = Math.floor(event.durationMs / 1e3);
    if (seconds > 0) {
      await jira.addWorklog(created.key, seconds, `Initial failure duration: ${seconds}s`);
    }
  }
  let selfHealingResult;
  if (config.selfHealing?.enabled) {
    logger.info({ issueKey: created.key }, "self-healing enabled \u2014 attempting fix");
    try {
      const healEngine = new SelfHealingEngine(
        config.selfHealing,
        {
          provider: config.ai.provider,
          apiKey: config.ai.apiKey,
          model: config.ai.model,
          endpoint: config.ai.endpoint,
          maxTokens: 8192,
          temperature: 0.2,
          timeout: 6e4,
          retryAttempts: 2,
          minConfidence: config.selfHealing.minConfidence,
          enableThinking: config.ai.enableThinking ?? false,
          thinkingBudget: config.ai.thinkingBudget ?? 8e3
        }
      );
      const rootCause = ctx.fields.rca ?? "";
      const remediation = Array.isArray(ctx.fields.remediationSteps) ? ctx.fields.remediationSteps : [];
      const category = ctx.fields.category ?? "Unknown";
      selfHealingResult = await healEngine.attemptFix(
        event,
        rootCause,
        remediation,
        category,
        created.key
      );
      if (selfHealingResult.success && selfHealingResult.prUrl) {
        logger.info(
          { issueKey: created.key, prUrl: selfHealingResult.prUrl },
          "self-healing PR created"
        );
        await jira.addComment(
          created.key,
          `\u{1F916} **Self-Healing Fix Available**

PipelineIQ has generated an automated fix and opened a Pull Request for review:

\u{1F517} [${selfHealingResult.prUrl}](${selfHealingResult.prUrl})

| Field | Value |
| --- | --- |
| Confidence | ${Math.round((selfHealingResult.fix?.confidence ?? 0) * 100)}% |
| Risk | ${selfHealingResult.fix?.riskLevel ?? "unknown"} |
| Files Changed | ${selfHealingResult.fix?.changes.length ?? 0} |

> \u26A0\uFE0F This fix requires human review and approval before merging.`
        );
      } else if (selfHealingResult.attempted) {
        logger.info(
          { issueKey: created.key, reason: selfHealingResult.reason },
          "self-healing attempted but did not produce a PR"
        );
      }
    } catch (error) {
      logger.warn({ err: error }, "self-healing stage failed");
      selfHealingResult = {
        attempted: true,
        success: false,
        reason: `Self-healing engine error: ${error}`,
        dryRun: config.selfHealing.dryRun ?? false
      };
    }
  }
  const notifications = await maybeNotify(created.key, true);
  return {
    action: "created",
    issueKey: created.key,
    spec,
    ...metrics !== void 0 && { metrics },
    ...notifications !== void 0 && { notifications },
    ...selfHealingResult !== void 0 && { selfHealing: selfHealingResult }
  };
}
function buildNotificationPayload(ctx, issueKey, isNewTicket, jiraBaseUrl) {
  return {
    title: ctx.fields.summary ?? "Pipeline failure",
    ...ctx.fields.rca !== void 0 && { summary: ctx.fields.rca },
    severity: ctx.fields.severity ?? "Medium",
    priority: ctx.fields.priority ?? "Medium",
    jiraKey: issueKey,
    jiraUrl: `${jiraBaseUrl}/browse/${issueKey}`,
    repo: ctx.event.repository.name,
    pipeline: ctx.event.pipeline.name,
    branch: ctx.event.branch,
    isNewTicket,
    ...ctx.history?.similarCount !== void 0 && { dedupCount: ctx.history.similarCount },
    ...ctx.metrics !== void 0 && {
      metrics: {
        ...ctx.metrics.mttrHours !== void 0 && { mttrHours: ctx.metrics.mttrHours },
        ...ctx.metrics.blastRadius !== void 0 && { blastRadius: ctx.metrics.blastRadius }
      }
    }
  };
}

// src/core/ai/ai-engine.ts
var AIEngine = class _AIEngine {
  provider = null;
  config;
  isInitialized = false;
  constructor(config) {
    this.config = config;
    this.initializeProvider();
  }
  /**
   * Initialize AI provider based on configuration
   */
  initializeProvider() {
    if (!this.config.provider) {
      return;
    }
    try {
      switch (this.config.provider) {
        case "openai":
          this.provider = new OpenAIProvider(this.config);
          break;
        case "anthropic":
          this.provider = new AnthropicProvider(this.config);
          break;
        case "azure-openai":
          this.provider = new AzureOpenAIProvider(this.config);
          break;
        case "local":
          this.provider = new LocalAIProvider(this.config);
          break;
        case "gemini":
          this.provider = new GeminiProvider(this.config);
          break;
        default:
          console.warn(`Unknown AI provider: ${this.config.provider}`);
          return;
      }
      if (this.provider.isAvailable()) {
        this.isInitialized = true;
      } else {
        console.warn(`AI provider ${this.config.provider} is not available, falling back to deterministic`);
        this.provider = null;
      }
    } catch (error) {
      console.warn(`Failed to initialize AI provider ${this.config.provider}: ${error}`);
      this.provider = null;
    }
  }
  /**
   * Check if AI engine is available and ready
   */
  isAvailable() {
    return this.isInitialized && this.provider !== null;
  }
  /**
   * Get the name of the current provider
   */
  getProvider() {
    return this.provider?.name || "none";
  }
  /**
   * Main enrichment method - follows PRD architectural contract
   * 
   * Pipeline:
   * field value = AI producer (if enabled & succeeds & confidence ≥ threshold)
   *            → deterministic producer (always)
   *            → null / omitted (only for advanced AI-only fields)
   */
  async enrich(event, config, history) {
    const results = [];
    if (!this.isAvailable()) {
      const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
      this.addDeterministicResults(results, deterministicFallback, event);
      return results;
    }
    try {
      const classification = DeterministicFallbackEngine.generateClassification(event);
      const aiRequest = this.buildAIRequest(event, { classification }, history);
      const aiResponse = await this.provider.generateInsights(aiRequest);
      const meetsConfidence = !aiResponse.confidence || aiResponse.confidence >= (config.minConfidence || 0.6);
      if (meetsConfidence) {
        results.push(
          { field: "summary", value: aiResponse.summary, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "rootCause", value: aiResponse.rootCause, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "remediationSteps", value: aiResponse.remediation, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "category", value: aiResponse.classification, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "severity", value: aiResponse.severity, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "priority", value: this.severityToPriority(aiResponse.severity), provenance: "ai", confidence: aiResponse.confidence, aiUsed: true }
        );
      } else {
        const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
        this.addDeterministicResults(results, deterministicFallback, event);
      }
    } catch (error) {
      console.warn(`[PipelineIQ] AI Enrichment failed, falling back to signatures: ${error}`);
      const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
      this.addDeterministicResults(results, deterministicFallback, event);
    }
    return results;
  }
  /**
   * Add deterministic fallback results to enrichment results
   */
  addDeterministicResults(results, fallback, event) {
    results.push(
      { field: "summary", value: fallback.summary, provenance: "fallback", aiUsed: false },
      { field: "rootCause", value: fallback.rootCause, provenance: "fallback", aiUsed: false },
      { field: "remediation", value: fallback.remediation, provenance: "fallback", aiUsed: false },
      { field: "severity", value: fallback.severity, provenance: "fallback", aiUsed: false },
      { field: "classification", value: fallback.classification, provenance: "fallback", aiUsed: false },
      { field: "assignee", value: null, provenance: "fallback", aiUsed: false },
      { field: "tags", value: fallback.tags, provenance: "fallback", aiUsed: false },
      { field: "riskAssessment", value: DeterministicFallbackEngine.generateRiskAssessment(event), provenance: "fallback", aiUsed: false }
    );
  }
  /**
   * Build AI request from failure event and deterministic fallback
   */
  buildAIRequest(event, fallback, history) {
    let historicalContext = "";
    if (history) {
      historicalContext = `This failure has a signature that has appeared ${history.similarCount} times in the last 30 days. `;
      if (history.isFlaky) {
        historicalContext += "This appears to be a FLAKY failure (alternating success/failure). ";
      }
      if (history.trend) {
        historicalContext += `The failure trend is currently ${history.trend.toUpperCase()}. `;
      }
    }
    return {
      logs: event.failure.logs || "",
      errorMessage: event.failure.errorMessage || "",
      stackTrace: event.failure.stackTrace || "",
      failedCommand: event.failure.failedCommand || "",
      exitCode: event.failure.exitCode,
      pipelineName: event.pipeline.name,
      repositoryName: event.repository.name,
      branch: event.branch,
      environment: event.environment,
      category: fallback.classification,
      // Use deterministic classification as hint
      historicalContext
    };
  }
  /**
   * Create AI engine instance with mode-based configuration
   */
  static create(mode, config) {
    let engineConfig = {
      maxTokens: 4096,
      temperature: 0.1,
      timeout: 3e4,
      retryAttempts: 3,
      minConfidence: 0.6,
      enableThinking: false,
      thinkingBudget: 8e3,
      ...config
    };
    switch (mode) {
      case "disabled":
        return new _AIEngine(engineConfig);
      case "assist":
        return new _AIEngine({
          ...engineConfig,
          provider: engineConfig.provider || "gemini",
          temperature: 0.1,
          minConfidence: 0.7
          // Higher confidence threshold
        });
      case "full":
        return new _AIEngine({
          ...engineConfig,
          provider: engineConfig.provider || "gemini",
          temperature: 0.3,
          // More creative
          minConfidence: 0.5,
          // Lower confidence threshold
          maxTokens: 8192
        });
      default:
        return new _AIEngine(engineConfig);
    }
  }
  severityToPriority(severity) {
    switch (severity) {
      case "Critical":
        return "Highest";
      case "High":
        return "High";
      case "Medium":
        return "Medium";
      case "Low":
        return "Low";
      default:
        return "Medium";
    }
  }
};

// src/core/enrichers/ai.ts
var aiEnricher = {
  name: "ai",
  source: "ai",
  async enrich(ctx) {
    const { event, config } = ctx;
    if (config.ai.mode === "disabled") {
      return;
    }
    const { temperature, ...restAiConfig } = config.ai;
    const aiEngine = AIEngine.create(config.ai.mode, {
      ...restAiConfig,
      maxTokens: config.ai.maxLogTokens,
      ...temperature !== void 0 ? { temperature } : {}
    });
    if (!aiEngine.isAvailable()) {
      return;
    }
    try {
      const results = await aiEngine.enrich(event, config.ai, ctx.history);
      for (const result of results) {
        if (result.aiUsed && result.value) {
          let fieldName = result.field;
          if (fieldName === "rootCause") {
            setField(ctx, "rca", result.value, "ai", true);
          } else if (fieldName === "remediation") {
            setField(ctx, "remediationSteps", result.value, "ai", true);
          } else if (fieldName === "classification") {
            const currentLabels = ctx.fields.labels || [];
            const newLabels = Array.isArray(result.value) ? result.value : [String(result.value)];
            setField(ctx, "labels", Array.from(/* @__PURE__ */ new Set([...currentLabels, ...newLabels])), "ai");
          } else {
            setField(ctx, fieldName, result.value, "ai", true);
          }
        }
      }
    } catch (error) {
      console.warn(`AI Enrichment failed: ${error}`);
    }
  }
};

// src/core/ai/types.ts
import { z as z8 } from "zod";
var AIProviderSchema = z8.enum(["openai", "anthropic", "azure-openai", "local", "gemini"]);
var AIRequestSchema = z8.object({
  logs: z8.string(),
  errorMessage: z8.string().optional(),
  stackTrace: z8.string().optional(),
  failedCommand: z8.string().optional(),
  exitCode: z8.number().int().optional(),
  pipelineName: z8.string(),
  repositoryName: z8.string(),
  branch: z8.string(),
  environment: z8.string().optional(),
  category: z8.string().optional(),
  historicalContext: z8.string().optional(),
  isRawPrompt: z8.boolean().optional()
});
var AIResponseSchema = z8.object({
  summary: z8.string().optional(),
  rootCause: z8.string().optional(),
  remediation: z8.array(z8.string()).optional(),
  severity: z8.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignee: z8.string().nullable().optional(),
  tags: z8.array(z8.string()).optional(),
  confidence: z8.number().min(0).max(1).optional(),
  postmortem: z8.string().optional(),
  timeline: z8.string().optional(),
  riskAssessment: z8.string().optional(),
  classification: z8.enum([
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
  ]).optional()
});
var AIEngineConfigSchema = z8.object({
  provider: AIProviderSchema.optional(),
  apiKey: z8.string().optional(),
  model: z8.string().optional(),
  endpoint: z8.string().optional(),
  deployment: z8.string().optional(),
  apiVersion: z8.string().optional(),
  modelPath: z8.string().optional(),
  maxTokens: z8.number().int().positive().default(1e3),
  temperature: z8.number().min(0).max(2).default(0.1),
  timeout: z8.number().int().positive().default(3e4),
  retryAttempts: z8.number().int().positive().default(3),
  minConfidence: z8.number().min(0).max(1).default(0.6),
  /** Enable extended thinking / reasoning for models that support it.
   *  Gemini 2.5+: uses thinkingConfig with thinkingBudget tokens.
   *  Anthropic: uses extended_thinking with budget_tokens. */
  enableThinking: z8.boolean().default(false),
  /** Token budget for thinking (Gemini: thinkingBudget, Anthropic: budget_tokens).
   *  -1 = dynamic (model decides). Only used when enableThinking is true. */
  thinkingBudget: z8.number().int().default(8e3)
});

// src/core/log-parser/types.ts
import { z as z9 } from "zod";
var LogEntrySchema = z9.object({
  timestamp: z9.string().datetime().optional(),
  level: z9.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
  message: z9.string(),
  source: z9.string().optional(),
  metadata: z9.record(z9.unknown()).optional()
});
var ParsedLogSchema = z9.object({
  entries: z9.array(LogEntrySchema),
  errorMessages: z9.array(z9.string()),
  stackTraces: z9.array(z9.string()),
  exitCodes: z9.array(z9.number().int()),
  failedCommands: z9.array(z9.string()),
  relevantEntries: z9.array(LogEntrySchema),
  summary: z9.string().optional(),
  truncated: z9.boolean().default(false)
});
var LogFormatSchema = z9.enum([
  "github-actions",
  "azure-devops",
  "terraform",
  "kubernetes",
  "docker",
  "junit",
  "generic"
]);
var ParseOptionsSchema = z9.object({
  format: LogFormatSchema.default("generic"),
  maxEntries: z9.number().int().positive().default(1e3),
  extractStackTraces: z9.boolean().default(true),
  extractErrorMessages: z9.boolean().default(true),
  extractExitCodes: z9.boolean().default(true),
  extractCommands: z9.boolean().default(true),
  relevantKeywords: z9.array(z9.string()).default([
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
    "invalid"
  ])
});

// src/core/log-parser/parsers.ts
function parseLogs(rawLogs, options = {}) {
  const parsedOptions = ParseOptionsSchema.parse(options);
  const parser = getParser(parsedOptions.format);
  return parser(rawLogs, parsedOptions);
}
function getParser(format) {
  switch (format) {
    case "github-actions":
      return parseGitHubActions;
    case "azure-devops":
      return parseAzureDevOps;
    case "terraform":
      return parseTerraform;
    case "kubernetes":
      return parseKubernetes;
    case "docker":
      return parseDocker;
    case "junit":
      return parseJUnit;
    default:
      return parseGeneric;
  }
}
function parseGitHubActions(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    const stepMatch = line.match(/^##\[group\](.+?)##\[endgroup\]/);
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
    let level = "info";
    if (line.includes("error") || line.includes("Error")) level = "error";
    else if (line.includes("warning") || line.includes("Warning")) level = "warn";
    else if (line.includes("debug")) level = "debug";
    const entry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "github-actions"
    };
    entries.push(entry);
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseAzureDevOps(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z)/);
    const sectionMatch = line.match(/##\[(\w+)\](.+)/);
    let level = "info";
    if (line.includes("error") || line.includes("Error")) level = "error";
    else if (line.includes("warning") || line.includes("Warning")) level = "warn";
    else if (line.includes("debug")) level = "debug";
    const entry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "azure-devops",
      metadata: sectionMatch ? { section: sectionMatch[1], task: sectionMatch[2] } : void 0
    };
    entries.push(entry);
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseTerraform(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    const terraformMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}[+-]\d{4})\s+\[([a-z]+)\]\s+(.+)$/);
    let level = "info";
    let message = line;
    let timestamp;
    if (terraformMatch) {
      timestamp = terraformMatch[1];
      const colorLevel = terraformMatch[2];
      message = terraformMatch[3];
      switch (colorLevel) {
        case "red":
          level = "error";
          break;
        case "yellow":
          level = "warn";
          break;
        case "cyan":
          level = "debug";
          break;
        default:
          level = "info";
          break;
      }
    }
    const entry = {
      timestamp,
      level,
      message,
      source: "terraform"
    };
    entries.push(entry);
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseKubernetes(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    const k8sMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)\s+([FS])\s+(\S+)\s+(\S+)\s+(.+)$/);
    let level = "info";
    let message = line;
    let timestamp;
    if (k8sMatch) {
      timestamp = k8sMatch[1];
      const stream = k8sMatch[2];
      const pod = k8sMatch[3];
      const namespace = k8sMatch[4];
      const logMessage = k8sMatch[5];
      message = logMessage;
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";
      const entry = {
        timestamp,
        level,
        message,
        source: "kubernetes",
        metadata: { stream, pod, namespace }
      };
      entries.push(entry);
      if (isRelevantEntry(logMessage, options.relevantKeywords)) {
        relevantEntries.push(entry);
      }
    } else {
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";
      const entry = {
        level,
        message: line,
        source: "kubernetes"
      };
      entries.push(entry);
      if (isRelevantEntry(line, options.relevantKeywords)) {
        relevantEntries.push(entry);
      }
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseDocker(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    const dockerMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)\s+(\w+)\s+(.+)$/);
    let level = "info";
    let message = line;
    let timestamp;
    if (dockerMatch) {
      timestamp = dockerMatch[1];
      const logLevel = dockerMatch[2].toLowerCase();
      message = dockerMatch[3];
      switch (logLevel) {
        case "error":
          level = "error";
          break;
        case "warn":
          level = "warn";
          break;
        case "debug":
          level = "debug";
          break;
        default:
          level = "info";
          break;
      }
    } else {
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";
    }
    const entry = {
      timestamp,
      level,
      message,
      source: "docker"
    };
    entries.push(entry);
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseJUnit(rawLogs, options) {
  const entries = [];
  const relevantEntries = [];
  const failureMatches = rawLogs.match(/<failure[^>]*message="([^"]*)"[^>]*>(.*?)<\/failure>/gs) || [];
  for (const failure of failureMatches) {
    const messageMatch = failure.match(/message="([^"]*)"/);
    const contentMatch = failure.match(/>(.*?)<\/failure>/);
    if (messageMatch) {
      const entry = {
        level: "error",
        message: `Test failure: ${messageMatch[1]}`,
        source: "junit",
        metadata: {
          failureMessage: messageMatch[1],
          failureContent: contentMatch?.[1]
        }
      };
      entries.push(entry);
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function parseGeneric(rawLogs, options) {
  const lines = rawLogs.split("\n");
  const entries = [];
  const relevantEntries = [];
  for (const line of lines) {
    let level = "info";
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
    if (line.includes("error") || line.includes("Error") || line.includes("ERROR")) level = "error";
    else if (line.includes("warning") || line.includes("Warning") || line.includes("WARN")) level = "warn";
    else if (line.includes("debug") || line.includes("Debug") || line.includes("DEBUG")) level = "debug";
    else if (line.includes("fatal") || line.includes("Fatal") || line.includes("FATAL")) level = "fatal";
    const entry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "generic"
    };
    entries.push(entry);
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }
  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs
  });
}
function isRelevantEntry(message, keywords) {
  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()));
}
function extractStructuredData({
  entries,
  relevantEntries,
  options,
  rawLogs
}) {
  const errorMessages = [];
  const stackTraces = [];
  const exitCodes = [];
  const failedCommands = [];
  if (options.extractErrorMessages) {
    errorMessages.push(...extractErrorMessages(rawLogs));
  }
  if (options.extractStackTraces) {
    stackTraces.push(...extractStackTraces(rawLogs));
  }
  if (options.extractExitCodes) {
    exitCodes.push(...extractExitCodes(rawLogs));
  }
  if (options.extractCommands) {
    failedCommands.push(...extractFailedCommands(rawLogs));
  }
  const limitedEntries = options.maxEntries > 0 ? entries.slice(0, options.maxEntries) : entries;
  return {
    entries: limitedEntries,
    errorMessages,
    stackTraces,
    exitCodes,
    failedCommands,
    relevantEntries,
    truncated: entries.length > options.maxEntries
  };
}

// src/cli/index.ts
import { Octokit } from "@octokit/rest";
var pkg = JSON.parse(await fs3.readFile(new URL("../../package.json", import.meta.url), "utf-8"));
var program = new Command();
program.name("pipelineiq").description("CLI for PipelineIQ CI/CD failure intelligence").version(pkg.version);
program.command("analyze").description("Analyze failure logs and create Jira tickets").option("-l, --logs <path>", "Path to log file or directory").option("-f, --format <format>", "Log format (github-actions, azure-devops, terraform, kubernetes, docker, junit, generic)", "generic").option("-s, --source <source>", "Failure source (github, azure-devops)", "github").option("-c, --config <path>", "Path to config file", "./pipelineiq.json").option("--dry-run", "Show what would be done without creating Jira issues", false).option("--github-token <token>", "GitHub token for API access").option("--azure-token <token>", "Azure DevOps PAT for API access").option("--environment <env>", "Deployment environment (dev/staging/production)").option("--repository <repo>", "Repository name (owner/repo)").option("--branch <branch>", "Branch name").option("--commit <sha>", "Commit SHA").option("--pipeline <name>", "Pipeline/workflow name").option("--run-id <id>", "Run ID or build number").option("--run-number <number>", "Run number").option("--run-url <url>", "Run URL or pipeline URL").option("--event-name <name>", "Event name (push, pull_request, etc.)").option("--run-attempt <count>", "Run attempt count").option("--runner-os <os>", "Runner operating system").option("--runner-arch <arch>", "Runner architecture").option("--api-url <url>", "GitHub/Azure API URL").option("--actor <name>", "Triggered by user").option("--job-name <name>", "Specific job name").option("--repository-owner <owner>", "Repository owner").option("--action <name>", "Name of current action").option("--action-path <path>", "Path to current action").option("--action-repository <repo>", "Repository of current action").option("--base-ref <ref>", "Target branch of PR").option("--head-ref <ref>", "Source branch of PR").option("--runner-temp <path>", "Runner temporary directory").option("--runner-tool-cache <path>", "Runner tool cache path").option("--runner-workspace <path>", "Runner workspace path").option("--ref <ref>", "Full git ref").option("--ref-protected <bool>", "Whether branch protections exist").option("--retention-days <days>", "Log retention days").option("--workflow-ref <ref>", "Workflow ref").option("--workflow-sha <sha>", "Workflow SHA").option("--graphql-url <url>", "GitHub GraphQL URL").option("--workspace <path>", "Default workspace directory").option("--job-status <status>", "Current job status").option("--job-container <json>", "Job container details").option("--job-services <json>", "Service container details").option("--strategy-job-index <number>", "Current matrix job index").option("--strategy-job-total <number>", "Total matrix jobs").option("--action-ref <ref>", "Action git reference").option("--action-status <status>", "Action execution status").option("--repository-git-url <url>", "Git URL for the repository").option("--secret-source <source>", "Secret source (Actions, etc)").option("--agent-container-mapping <json>", "Mapping of container resource names to Docker IDs").option("--agent-release-directory <path>", "Release artifacts directory").option("--agent-root-directory <path>", "Working root directory of agent").option("--pipeline-workspace <path>", "Pipeline workspace directory").option("--system-debug <bool>", "Enables verbose logging").option("--system-default-working-directory <path>", "Default working directory").option("--system-team-foundation-collection-uri <url>", "Collection URI").option("--release-deployment-requested-for <name>", "User requesting deployment").option("--release-deployment-requested-for-email <email>", "Deployment requester email").option("--release-deployment-id <id>", "Deployment ID").option("--release-definition-environment-id <id>", "Release environment ID").option("--release-definition-id <id>", "Release definition ID").option("--release-definition-name <name>", "Release definition name").option("--release-environment-id <id>", "Release environment ID").option("--release-environment-name <name>", "Release environment name").option("--release-primary-artifact-source-alias <alias>", "Primary artifact alias").option("--release-description <text>", "Release description").option("--release-id <id>", "Release ID").option("--release-name <name>", "Release name").option("--release-uri <url>", "Release URI").option("--agent-id <id>", "Unique ID of agent").option("--agent-name <name>", "Name of agent").option("--agent-machine-name <name>", "Machine name of agent host").option("--agent-build-directory <path>", "Local path on agent where build folders are created").option("--agent-home-directory <path>", "Directory where agent is installed").option("--agent-temp-directory <path>", "Temp directory used by agent").option("--agent-tools-directory <path>", "Tool cache directory").option("--agent-work-folder <path>", "Agent work directory").option("--artifact-staging-directory <path>", "Directory where artifacts are copied before publishing").option("--binaries-directory <path>", "Output directory for binaries").option("--container-id <id>", "Artifact container ID").option("--definition-version <version>", "Build definition version").option("--repository-local-path <path>", "Local path of the repository").option("--sources-directory <path>", "Directory where source code is downloaded").option("--staging-directory <path>", "Staging directory for build artifacts").option("--test-results-directory <path>", "Directory where test results are stored").option("--event-payload <json>", "Full JSON event payload").option("--stage-requested-by <name>", "User who manually triggered the stage (Build.StageRequestedBy)").option("--stage-requested-for-id <id>", "GUID of user who triggered the stage (Build.StageRequestedForId)").option("--source-tfvc-shelveset <name>", "TFVC shelveset name for gated/shelveset builds (Build.SourceTfvcShelveset)").option("--issue-type <type>", "Jira issue type to create (default from config)").option("--dedup-window <hours>", "Deduplication window in hours (default from config)").option("--jira-url <url>", "Jira base URL").option("--jira-email <email>", "Jira user email").option("--jira-token <token>", "Jira API token").option("--jira-project <key>", "Jira project key").option("--ai-mode <mode>", "AI mode (disabled | assist | full)").option("--ai-api-key <key>", "AI API key").option("--ai-provider <provider>", "AI provider (openai | anthropic | azure-openai | gemini)").option("-m, --ai-model <model>", "AI model to use (e.g. gpt-4, gemini-2.5-flash)").option("--ai-max-tokens <tokens>", "Maximum output tokens for AI response").option("--ai-thinking", "Enable extended thinking/reasoning for models that support it (Gemini 2.5+, Claude 3.7+)").option("--ai-thinking-budget <tokens>", "Token budget for thinking (default: 8000, -1 = dynamic)", parseInt).option("--assignee <id>", "Jira account ID to assign the issue to (defaults to unassigned)").option("--default-assignee <id>", "Alias for --assignee (defaults to unassigned)").option("--display-meta <fields>", "Comma-separated list of metadata fields to display", (val) => val.split(",")).option("--meta <key=value>", "Custom metadata to include in the ticket (can be repeated)", (val, memo) => {
  memo.push(val);
  return memo;
}, []).option("--ai-endpoint <url>", "Base URL for local AI provider (e.g. http://localhost:11434/v1)").option("--slack-webhook <url>", "Slack incoming webhook URL \u2014 enables Slack notifications").option("--slack-channel <channel>", "Slack channel override (e.g. #incidents)").option("--slack-notify-on <severities>", "Comma-separated severities that trigger Slack (e.g. Critical,High)", (val) => val.split(",")).option("--slack-username <name>", "Slack bot display name").option("--no-slack-metrics", "Omit MTTR/blast-radius row from Slack messages").option("--teams-webhook <url>", "Teams incoming webhook URL \u2014 enables Teams notifications").option("--teams-notify-on <severities>", "Comma-separated severities that trigger Teams (e.g. Critical)", (val) => val.split(",")).option("--no-teams-metrics", "Omit MTTR/blast-radius facts from Teams messages").option("--no-notifications", "Disable all notifications for this run (overrides config)").option("--self-heal", "Enable self-healing (auto-fix + PR creation)").option("--self-heal-dry-run", "Generate fix but don't create PR").option("--self-heal-confidence <threshold>", "Minimum AI confidence for self-healing (0-1)").option("--self-heal-max-files <count>", "Maximum files a fix can change").option("--self-heal-max-lines <count>", "Maximum lines a fix can change").option("--self-heal-draft", "Create draft PR (default: true)").option("--self-heal-guardrails", "Enforce self-healing safety guardrails", true).option("--no-self-heal-guardrails", "Disable self-healing safety guardrails (allow wider fixes)").option("--self-heal-reviewers <users>", "Comma-separated PR reviewers", (val) => val.split(",")).option("--self-heal-labels <labels>", "Comma-separated PR labels", (val) => val.split(",")).option("--self-heal-categories <cats>", "Comma-separated allowed failure categories", (val) => val.split(",")).option("--self-heal-verify", "Enable local verification commands (compilation/testing/regeneration)").option("--self-heal-verification-commands <commands>", "Comma-separated verification commands", (val) => val.split(",")).option("--self-heal-auto-lockfile", "Enable automatic package-lock.json regeneration (default: true)", true).option("--no-self-heal-auto-lockfile", "Disable automatic package-lock.json regeneration").action(async (options) => {
  await handleAnalyze(options);
});
program.command("config").description("Manage PipelineIQ configuration").option("-i, --init", "Initialize configuration file", false).option("-s, --show", "Show current configuration", false).option("-v, --validate", "Validate configuration", false).action(async (options) => {
  await handleConfig(options);
});
program.command("parse").description("Parse and analyze log files").option("-l, --logs <path>", "Path to log file or directory", "").option("-f, --format <format>", "Log format", "generic").option("-o, --output <path>", "Output file for parsed results", "./parsed-logs.json").action(async (options) => {
  await handleParse(options);
});
program.command("test").description("Test PipelineIQ configuration and connectivity").option("-c, --config <path>", "Path to config file", "./pipelineiq.json").option("--jira", "Test Jira connectivity", false).option("--ai", "Test AI provider", false).option("--ai-provider <provider>", "AI provider to test").option("--ai-model <model>", "AI model to test").option("--ai-api-key <key>", "AI API key to test").action(async (options) => {
  await handleTest(options);
});
async function handleAnalyze(options) {
  const spinner = ora("Analyzing failure...").start();
  try {
    let configData = await loadConfig(options.config);
    if (options.jiraUrl) configData.jira.baseUrl = options.jiraUrl.trim();
    if (options.jiraEmail) configData.jira.email = options.jiraEmail.trim();
    if (options.jiraToken) configData.jira.apiToken = options.jiraToken.trim();
    if (options.jiraProject) configData.jiraProject = options.jiraProject.trim();
    if (options.issueType) configData.issueType = options.issueType.trim();
    if (options.assignee || options.defaultAssignee) {
      configData.defaultAssignee = (options.assignee || options.defaultAssignee).trim();
    }
    if (options.dedupWindow) configData.dedup.windowHours = parseInt(options.dedupWindow);
    if (options.aiMode) configData.ai.mode = options.aiMode.trim();
    if (options.aiApiKey) configData.ai.apiKey = options.aiApiKey.trim();
    if (options.aiProvider) configData.ai.provider = options.aiProvider.trim();
    if (options.aiModel) configData.ai.model = options.aiModel.trim();
    if (options.aiMaxTokens) configData.ai.maxLogTokens = Number.parseInt(options.aiMaxTokens, 10);
    if (options.aiEndpoint) configData.ai.endpoint = options.aiEndpoint.trim();
    if (options.aiThinking !== void 0) configData.ai.enableThinking = options.aiThinking;
    if (options.aiThinkingBudget !== void 0) configData.ai.thinkingBudget = options.aiThinkingBudget;
    if (options.displayMeta) configData.displayMetadata = options.displayMeta;
    if (options.notifications === false) {
      configData.notifications = { ...configData.notifications, enabled: false };
    } else {
      if (options.slackWebhook) {
        configData.notifications ??= {};
        configData.notifications.slack ??= { webhookUrl: options.slackWebhook };
        configData.notifications.slack.webhookUrl = options.slackWebhook.trim();
        if (options.slackChannel) configData.notifications.slack.channel = options.slackChannel.trim();
        if (options.slackNotifyOn) configData.notifications.slack.notifyOn = options.slackNotifyOn;
        if (options.slackUsername) configData.notifications.slack.username = options.slackUsername.trim();
        if (options.slackMetrics === false) configData.notifications.slack.includeMetrics = false;
      }
      if (options.teamsWebhook) {
        configData.notifications ??= {};
        configData.notifications.teams ??= { webhookUrl: options.teamsWebhook };
        configData.notifications.teams.webhookUrl = options.teamsWebhook.trim();
        if (options.teamsNotifyOn) configData.notifications.teams.notifyOn = options.teamsNotifyOn;
        if (options.teamsMetrics === false) configData.notifications.teams.includeMetrics = false;
      }
    }
    if (options.selfHeal) {
      configData.selfHealing ??= { enabled: true };
      configData.selfHealing.enabled = true;
      if (options.selfHealDryRun) configData.selfHealing.dryRun = true;
      if (options.selfHealConfidence) configData.selfHealing.minConfidence = parseFloat(options.selfHealConfidence);
      if (options.selfHealMaxFiles) configData.selfHealing.maxFilesChanged = parseInt(options.selfHealMaxFiles);
      if (options.selfHealMaxLines) configData.selfHealing.maxLinesChanged = parseInt(options.selfHealMaxLines);
      if (options.selfHealDraft !== void 0) configData.selfHealing.draftPr = options.selfHealDraft;
      if (options.selfHealGuardrails !== void 0) configData.selfHealing.enableGuardrails = options.selfHealGuardrails;
      if (options.selfHealReviewers) configData.selfHealing.reviewers = options.selfHealReviewers;
      if (options.selfHealLabels) configData.selfHealing.prLabels = options.selfHealLabels;
      if (options.selfHealCategories) configData.selfHealing.allowedCategories = options.selfHealCategories;
      if (options.selfHealVerify !== void 0) configData.selfHealing.enableVerification = options.selfHealVerify;
      if (options.selfHealVerificationCommands !== void 0) configData.selfHealing.verificationCommands = options.selfHealVerificationCommands;
      if (options.selfHealAutoLockfile !== void 0) configData.selfHealing.autoRegenerateLockfile = options.selfHealAutoLockfile;
    }
    if (configData.selfHealing) {
      if (options.githubToken) configData.selfHealing.githubToken = options.githubToken.trim();
      if (options.azureToken) configData.selfHealing.azureToken = options.azureToken.trim();
    }
    const config = PipelineIQConfigSchema.parse(configData);
    let event;
    if (options.logs) {
      const logContent = await readLogs(options.logs);
      const parsedLogs = parseLogs(logContent, {
        format: options.format,
        extractStackTraces: true,
        extractErrorMessages: true,
        extractExitCodes: true,
        extractCommands: true
      });
      event = await createFailureEvent(options.source, parsedLogs, options);
    } else {
      spinner.text = "Fetching logs from platform API...";
      event = await fetchEventFromPlatform(options);
    }
    spinner.text = "Initializing Jira client...";
    const jira = createJiraClient(config.jira);
    const isConnected = await jira.checkConnection();
    if (!isConnected) {
      throw new Error(`Could not connect to Jira at ${config.jira.baseUrl}. Please check your email and API token.`);
    }
    spinner.text = "Analyzing failure with PipelineIQ...";
    const explicitFields = [];
    const flagMap = {
      pipeline: "pipeline",
      repository: "repository",
      branch: "branch",
      commit: "commit",
      environment: "environment",
      runId: "runNumber",
      // Map runId to runNumber for display
      runNumber: "runNumber",
      runUrl: "runUrl",
      runAttempt: "runAttempt",
      runnerOs: "runnerOs",
      runnerArch: "runnerArch",
      runnerName: "runnerName",
      jobName: "jobName",
      eventName: "eventName",
      actor: "triggeredBy",
      apiUrl: "apiUrl",
      graphqlUrl: "graphqlUrl",
      repositoryOwner: "repositoryOwner",
      action: "action",
      actionPath: "actionPath",
      actionRepository: "actionRepository",
      baseRef: "baseRef",
      headRef: "headRef",
      runnerTemp: "runnerTemp",
      runnerToolCache: "runnerToolCache",
      runnerWorkspace: "runnerWorkspace",
      ref: "ref",
      refProtected: "refProtected",
      retentionDays: "retentionDays",
      workflowRef: "workflowRef",
      workflowSha: "workflowSha",
      workspace: "workspace",
      jobStatus: "jobStatus",
      jobContainer: "jobContainer",
      jobServices: "jobServices",
      strategyJobIndex: "strategyJobIndex",
      strategyJobTotal: "strategyJobTotal",
      actionRef: "actionRef",
      actionStatus: "actionStatus",
      repositoryGitUrl: "repositoryGitUrl",
      secretSource: "secretSource",
      agentContainerMapping: "agentContainerMapping",
      agentReleaseDirectory: "agentReleaseDirectory",
      agentRootDirectory: "agentRootDirectory",
      pipelineWorkspace: "pipelineWorkspace",
      systemDebug: "systemDebug",
      systemDefaultWorkingDirectory: "systemDefaultWorkingDirectory",
      systemTeamFoundationCollectionUri: "systemTeamFoundationCollectionUri",
      releaseDeploymentRequestedFor: "releaseDeploymentRequestedFor",
      releaseDeploymentRequestedForEmail: "releaseDeploymentRequestedForEmail",
      releaseDeploymentId: "releaseDeploymentId",
      releaseDefinitionEnvironmentId: "releaseDefinitionEnvironmentId",
      releaseDefinitionId: "releaseDefinitionId",
      releaseDefinitionName: "releaseDefinitionName",
      releaseEnvironmentId: "releaseEnvironmentId",
      releaseEnvironmentName: "releaseEnvironmentName",
      releasePrimaryArtifactSourceAlias: "releasePrimaryArtifactSourceAlias",
      releaseDescription: "releaseDescription",
      releaseId: "releaseId",
      releaseName: "releaseName",
      releaseUri: "releaseUri",
      eventPayload: "eventPayload"
    };
    for (const [flag, metaKey] of Object.entries(flagMap)) {
      if (options[flag] !== void 0) {
        explicitFields.push(metaKey);
      }
    }
    const result = await processFailureEvent({
      ...event,
      explicitFields: [...event.explicitFields || [], ...explicitFields]
    }, config, {
      extraEnrichers: [aiEnricher]
    });
    spinner.succeed();
    if (options.dryRun) {
      console.log(chalk.blue("Dry run - would create/update Jira issue:"));
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.action === "skipped") {
        console.log(chalk.yellow(`\u26A0 ${result.action}: ${result.reason}`));
      } else {
        console.log(chalk.green(`\u2713 ${result.action}: ${result.issueKey}`));
      }
      if (result.selfHealing) {
        const sh = result.selfHealing;
        if (sh.success && sh.prUrl) {
          console.log(chalk.magenta(`
\u{1F916} Self-Healing PR Created:`));
          console.log(chalk.magenta(`   PR: ${sh.prUrl}`));
          console.log(chalk.magenta(`   Branch: ${sh.branchName}`));
          console.log(chalk.magenta(`   Confidence: ${Math.round((sh.fix?.confidence ?? 0) * 100)}%`));
          console.log(chalk.magenta(`   Risk: ${sh.fix?.riskLevel ?? "unknown"}`));
          if (sh.fix?.changes) {
            console.log(chalk.magenta(`   Changes Proposed:`));
            for (const change of sh.fix.changes) {
              console.log(chalk.magenta(`     - [${change.action.toUpperCase()}] ${change.filePath} (${change.changeDescription})`));
            }
          }
          console.log(chalk.dim(`   \u26A0 Requires human review before merging`));
        } else if (sh.dryRun && sh.fix) {
          console.log(chalk.cyan(`
\u{1F9EA} Self-Healing Dry Run \u2014 Fix Generated:`));
          console.log(chalk.cyan(`   Title: ${sh.fix.title}`));
          console.log(chalk.cyan(`   Confidence: ${Math.round(sh.fix.confidence * 100)}%`));
          console.log(chalk.cyan(`   Risk: ${sh.fix.riskLevel}`));
          if (sh.fix.changes) {
            console.log(chalk.cyan(`   Changes Proposed:`));
            for (const change of sh.fix.changes) {
              console.log(chalk.cyan(`     - [${change.action.toUpperCase()}] ${change.filePath} (${change.changeDescription})`));
            }
          }
        } else if (sh.attempted && !sh.success) {
          console.log(chalk.yellow(`
\u26A0 Self-Healing Failed: ${sh.reason}`));
        }
      }
    }
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
async function handleConfig(options) {
  try {
    if (options.init) {
      await initConfig();
      return;
    }
    if (options.show) {
      const config = await loadConfig("./pipelineiq.json");
      console.log(chalk.blue("Current configuration:"));
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    if (options.validate) {
      const config = await loadConfig(options.config);
      const validation = PipelineIQConfigSchema.safeParse(config);
      if (validation.success) {
        console.log(chalk.green("\u2713 Configuration is valid"));
      } else {
        console.log(chalk.red("\u2717 Configuration validation failed:"));
        console.error(validation.error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
async function handleParse(options) {
  const spinner = ora("Parsing logs...").start();
  try {
    const logContent = await readLogs(options.logs);
    const parsedLogs = parseLogs(logContent, {
      format: options.format,
      extractStackTraces: true,
      extractErrorMessages: true,
      extractExitCodes: true,
      extractCommands: true
    });
    spinner.succeed();
    await fs3.writeJson(options.output, parsedLogs, { spaces: 2 });
    console.log(chalk.green(`\u2713 Parsed logs saved to ${options.output}`));
    console.log(chalk.blue("\nParsing Summary:"));
    console.log(`- Total entries: ${parsedLogs.entries.length}`);
    console.log(`- Error messages: ${parsedLogs.errorMessages.length}`);
    console.log(`- Stack traces: ${parsedLogs.stackTraces.length}`);
    console.log(`- Exit codes: ${parsedLogs.exitCodes.length}`);
    console.log(`- Failed commands: ${parsedLogs.failedCommands.length}`);
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
async function handleTest(options) {
  try {
    const config = await loadConfig(options.config);
    if (options.aiProvider) config.ai.provider = options.aiProvider;
    if (options.aiModel) config.ai.model = options.aiModel;
    if (options.aiApiKey) config.ai.apiKey = options.aiApiKey;
    if (options.jira) {
      const spinner = ora("Testing Jira connectivity...").start();
      const jira = createJiraClient(config.jira);
      try {
        await jira.request("GET", `/rest/api/3/project/${config.jiraProject}`);
        spinner.succeed();
        console.log(chalk.green("\u2713 Jira connectivity test passed"));
      } catch (error) {
        spinner.fail();
        console.log(chalk.red("\u2717 Jira connectivity test failed:"));
        console.error(error instanceof Error ? error.message : String(error));
      }
    }
    if (options.ai && config.ai.mode !== "disabled") {
      const spinner = ora("Testing AI provider...").start();
      try {
        const aiEngine = AIEngine.create(config.ai.mode, config.ai);
        if (aiEngine.isAvailable()) {
          spinner.succeed();
          console.log(chalk.green(`\u2713 AI provider "${aiEngine.getProvider()}" is available`));
        } else {
          spinner.warn();
          console.log(chalk.yellow(`\u26A0 AI provider "${config.ai.provider}" is not available`));
        }
      } catch (error) {
        spinner.fail();
        console.log(chalk.red("\u2717 AI provider test failed:"));
        console.error(error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
async function fetchEventFromPlatform(options) {
  const source = options.source || (process.env.GITHUB_ACTIONS ? "github" : process.env.SYSTEM_COLLECTIONURI ? "azure-devops" : "github");
  if (source === "github") {
    const { mapGithubContext } = await import("./map-event-553JYXNQ.js");
    const token = options.githubToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token is required to fetch logs from API. Use --github-token or set GITHUB_TOKEN environment variable.");
    }
    const octokit = new Octokit({ auth: token });
    const ghContext = {
      repo: {
        owner: (options.repository || process.env.GITHUB_REPOSITORY || "").split("/")[0] || "",
        repo: (options.repository || process.env.GITHUB_REPOSITORY || "").split("/")[1] || ""
      },
      workflow: options.pipeline || process.env.GITHUB_WORKFLOW || "",
      runId: parseInt(options.runId || process.env.GITHUB_RUN_ID || "0"),
      runNumber: parseInt(options.runNumber || process.env.GITHUB_RUN_NUMBER || "0"),
      sha: options.commit || process.env.GITHUB_SHA || "",
      ref: options.branch || process.env.GITHUB_REF || "",
      actor: process.env.GITHUB_ACTOR || "",
      serverUrl: process.env.GITHUB_SERVER_URL || "https://github.com",
      payload: {},
      // Minimal payload for CLI
      headRef: options.headRef || process.env.GITHUB_HEAD_REF,
      job: options.jobName || process.env.GITHUB_JOB,
      runAttempt: parseInt(options.runAttempt || process.env.GITHUB_RUN_ATTEMPT || "1"),
      eventName: options.eventName || process.env.GITHUB_EVENT_NAME || "push",
      apiUrl: options.apiUrl || process.env.GITHUB_API_URL,
      runnerOs: options.runnerOs || process.env.RUNNER_OS,
      runnerArch: options.runnerArch || process.env.RUNNER_ARCH,
      runnerName: options.runnerName || process.env.RUNNER_NAME,
      metadata: parseMetadata(options.meta)
    };
    return await mapGithubContext(ghContext, octokit, options.environment);
  } else if (source === "azure-devops") {
    const { mapAzureDevOpsContext } = await import("./map-event-SKJCOCXB.js");
    return await mapAzureDevOpsContext(options.environment);
  }
  throw new Error(`Unsupported failure source for automatic log fetching: ${source}. Please provide logs via --logs.`);
}
async function loadConfig(configPath) {
  try {
    if (await fs3.pathExists(configPath)) {
      return await fs3.readJson(configPath);
    }
    if (configPath !== "./pipelineiq.json" && configPath !== "pipelineiq.json") {
      throw new Error(`Configuration file not found at: ${configPath}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`Error reading configuration file ${configPath}: ${error.message}`);
    }
  }
  return {
    jira: {
      baseUrl: (process.env.JIRA_URL || "").trim(),
      email: (process.env.JIRA_EMAIL || "").trim(),
      apiToken: (process.env.JIRA_TOKEN || "").trim()
    },
    jiraProject: (process.env.JIRA_PROJECT || "").trim(),
    ai: { mode: "disabled" },
    dedup: { enabled: true, windowHours: 24 }
  };
}
async function initConfig() {
  const questions = [
    {
      type: "input",
      name: "jiraUrl",
      message: "Jira base URL:",
      validate: (input) => {
        if (!input) return "Jira URL is required";
        try {
          new URL(input);
          return true;
        } catch {
          return "Please enter a valid URL";
        }
      }
    },
    {
      type: "input",
      name: "jiraEmail",
      message: "Jira email:",
      validate: (input) => input.length > 0 || "Email is required"
    },
    {
      type: "password",
      name: "jiraToken",
      message: "Jira API token:",
      validate: (input) => input.length > 0 || "API token is required"
    },
    {
      type: "input",
      name: "jiraProject",
      message: "Jira project key:",
      default: "DEVOPS"
    },
    {
      type: "list",
      name: "aiMode",
      message: "AI mode:",
      choices: ["disabled", "assist", "full"],
      default: "disabled"
    }
  ];
  const answers = await inquirer.prompt(questions);
  const config = {
    jira: {
      baseUrl: answers.jiraUrl,
      email: answers.jiraEmail,
      apiToken: answers.jiraToken
    },
    jiraProject: answers.jiraProject,
    ai: { mode: answers.aiMode },
    dedup: { enabled: true }
  };
  await fs3.writeJson("./pipelineiq.json", config, { spaces: 2 });
  console.log(chalk.green("\u2713 Configuration saved to ./pipelineiq.json"));
}
async function readLogs(logPath) {
  const stats = await fs3.stat(logPath);
  if (stats.isDirectory()) {
    const files = await fs3.readdir(logPath);
    const logFiles = files.filter(
      (file) => file.endsWith(".log") || file.endsWith(".txt") || file.endsWith(".out")
    );
    let allLogs = "";
    for (const file of logFiles.slice(-10)) {
      const content = await fs3.readFile(path3.join(logPath, file), "utf8");
      allLogs += `
=== ${file} ===
${content}
`;
    }
    return allLogs;
  } else {
    return await fs3.readFile(logPath, "utf8");
  }
}
async function createFailureEvent(source, parsedLogs, options) {
  const githubToken = options.githubToken || process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const environment = options.environment || process.env.ENVIRONMENT || process.env.DEPLOYMENT_ENVIRONMENT || process.env.ENVIRONMENT_NAME;
  const githubRepo = process.env.GITHUB_REPOSITORY || options.repository;
  const githubRef = process.env.GITHUB_REF || options.branch;
  const githubSha = process.env.GITHUB_SHA || options.commit;
  const githubRunId = process.env.GITHUB_RUN_ID || options.runId;
  const githubRunNumber = process.env.GITHUB_RUN_NUMBER || options.runId;
  const githubWorkflow = process.env.GITHUB_WORKFLOW || options.pipeline;
  const githubActor = options.actor || process.env.GITHUB_ACTOR;
  const githubServerUrl = process.env.GITHUB_SERVER_URL;
  const githubActorId = process.env.GITHUB_ACTOR_ID;
  const githubApiUrl = options.apiUrl || process.env.GITHUB_API_URL;
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const githubHeadRef = process.env.GITHUB_HEAD_REF;
  const githubJob = process.env.GITHUB_JOB;
  const githubRefName = process.env.GITHUB_REF_NAME;
  const githubRefProtected = process.env.GITHUB_REF_PROTECTED;
  const githubRefType = process.env.GITHUB_REF_TYPE;
  const githubRepositoryId = process.env.GITHUB_REPOSITORY_ID;
  const githubRepositoryOwner = options.repositoryOwner || process.env.GITHUB_REPOSITORY_OWNER;
  const githubRepositoryOwnerId = process.env.GITHUB_REPOSITORY_OWNER_ID;
  const githubRunAttempt = options.runAttempt || process.env.GITHUB_RUN_ATTEMPT;
  const githubTriggeringActor = process.env.GITHUB_TRIGGERING_ACTOR;
  const githubWorkflowRef = process.env.GITHUB_WORKFLOW_REF;
  const githubWorkflowSha = process.env.GITHUB_WORKFLOW_SHA;
  const githubWorkspace = process.env.GITHUB_WORKSPACE;
  const githubRetentionDays = process.env.GITHUB_RETENTION_DAYS;
  const githubEventName = options.eventName || process.env.GITHUB_EVENT_NAME;
  const runnerArch = options.runnerArch || process.env.RUNNER_ARCH;
  const runnerDebug = process.env.RUNNER_DEBUG;
  const runnerEnvironment = process.env.RUNNER_ENVIRONMENT;
  const runnerName = process.env.RUNNER_NAME;
  const runnerOs = options.runnerOs || process.env.RUNNER_OS;
  const runnerTemp = process.env.RUNNER_TEMP;
  const runnerToolCache = process.env.RUNNER_TOOL_CACHE;
  const adoAgentOs = process.env.AGENT_OS;
  const adoAgentArch = process.env.AGENT_OSARCHITECTURE;
  const adoAgentJobName = process.env.AGENT_JOBNAME;
  const adoAgentName = process.env.AGENT_NAME || options.agentName;
  const adoAgentMachineName = process.env.AGENT_MACHINENAME || options.agentMachineName;
  const adoAgentId = process.env.AGENT_ID || options.agentId;
  const adoAgentBuildDirectory = process.env.AGENT_BUILDDIRECTORY || options.agentBuildDirectory;
  const adoAgentHomeDirectory = process.env.AGENT_HOMEDIRECTORY || options.agentHomeDirectory;
  const adoAgentTempDirectory = process.env.AGENT_TEMPDIRECTORY || options.agentTempDirectory;
  const adoAgentToolsDirectory = process.env.AGENT_TOOLSDIRECTORY || options.agentToolsDirectory;
  const adoAgentWorkFolder = process.env.AGENT_WORKFOLDER || options.agentWorkFolder;
  const adoAgentJobStatus = process.env.AGENT_JOBSTATUS || options.jobStatus;
  const adoRepo = process.env.BUILD_REPOSITORY_NAME || options.repository;
  const adoSourceBranch = process.env.BUILD_SOURCEBRANCH || options.branch;
  const adoSourceVersion = process.env.BUILD_SOURCEVERSION || options.commit;
  const adoBuildId = process.env.BUILD_BUILDID || options.runId;
  const adoBuildNumber = process.env.BUILD_BUILDNUMBER || options.runId;
  const adoPipeline = process.env.BUILD_DEFINITIONNAME || options.pipeline;
  const adoRepositoryClean = process.env.BUILD_REPOSITORY_CLEAN;
  const adoRepositoryGitSubmoduleCheckout = process.env.BUILD_REPOSITORY_GIT_SUBMODULECHECKOUT;
  const adoCronScheduleDisplayName = process.env.BUILD_CRONSCHEDULE_DISPLAYNAME;
  const adoStageRequestedBy = options.stageRequestedBy || process.env.BUILD_STAGEREQUESTBY;
  const adoStageRequestedForId = options.stageRequestedForId || process.env.BUILD_STAGEREQUESTFORID;
  const adoSourceTfvcShelveset = options.sourceTfvcShelveset || process.env.BUILD_SOURCETFVCSHELVESET;
  const adoCollectionUri = process.env.SYSTEM_COLLECTIONURI;
  const adoTeamProject = process.env.SYSTEM_TEAMPROJECT;
  const adoRequestedFor = process.env.BUILD_REQUESTEDFOR;
  const adoRequestedForEmail = process.env.BUILD_REQUESTEDFOREMAIL;
  const adoRequestedForId = process.env.BUILD_REQUESTEDFORID;
  const adoSourceVersionMessage = process.env.BUILD_SOURCEVERSIONMESSAGE;
  const adoBuildReason = process.env.BUILD_REASON || options.eventName;
  const adoBuildUri = process.env.BUILD_BUILDURI || options.runUrl;
  const adoDefinitionVersion = process.env.BUILD_DEFINITIONVERSION || options.definitionVersion;
  const adoSourcesDirectory = process.env.BUILD_SOURCESDIRECTORY || options.sourcesDirectory;
  const adoBinariesDirectory = process.env.BUILD_BINARIESDIRECTORY || options.binariesDirectory;
  const adoArtifactStagingDirectory = process.env.BUILD_ARTIFACTSTAGINGDIRECTORY || process.env.BUILD_STAGINGDIRECTORY || options.artifactStagingDirectory;
  const adoStagingDirectory = process.env.BUILD_STAGINGDIRECTORY || options.stagingDirectory;
  const adoContainerId = process.env.BUILD_CONTAINERID || options.containerId;
  const adoRepositoryLocalPath = process.env.BUILD_REPOSITORY_LOCALPATH || options.repositoryLocalPath;
  const adoTestResultsDirectory = process.env.COMMON_TESTRESULTSDIRECTORY || options.testResultsDirectory;
  const adoRepositoryUri = process.env.BUILD_REPOSITORY_URI;
  const adoRepositoryId = process.env.BUILD_REPOSITORY_ID;
  const adoRepositoryProvider = process.env.BUILD_REPOSITORY_PROVIDER;
  const adoSourceBranchName = process.env.BUILD_SOURCEBRANCHNAME;
  const adoQueuedBy = process.env.BUILD_QUEUEDBY;
  const adoQueuedById = process.env.BUILD_QUEUEDBYID;
  const adoReleaseDeploymentRequestedFor = process.env.RELEASE_DEPLOYMENT_REQUESTEDFOR;
  const adoReleaseDeploymentRequestedForEmail = process.env.RELEASE_DEPLOYMENT_REQUESTEDFOREMAIL;
  const adoReleaseDeploymentId = process.env.RELEASE_DEPLOYMENTID;
  const adoReleaseDefinitionEnvironmentId = process.env.RELEASE_DEFINITIONENVIRONMENTID;
  const adoReleaseDefinitionId = process.env.RELEASE_DEFINITIONID;
  const adoReleaseDefinitionName = process.env.RELEASE_DEFINITIONNAME;
  const adoReleaseEnvironmentId = process.env.RELEASE_ENVIRONMENTID;
  const adoReleaseEnvironmentName = process.env.RELEASE_ENVIRONMENTNAME;
  const adoReleasePrimaryArtifactSourceAlias = process.env.RELEASE_PRIMARYARTIFACTSOURCEALIAS;
  const adoReleaseDescription = process.env.RELEASE_RELEASEDESCRIPTION;
  const adoReleaseId = process.env.RELEASE_RELEASEID;
  const adoReleaseName = process.env.RELEASE_RELEASENAME;
  const adoReleaseUri = process.env.RELEASE_RELEASEURI;
  const adoAgentContainerMapping = process.env.AGENT_CONTAINERMAPPING;
  const adoAgentReleaseDirectory = process.env.AGENT_RELEASEDIRECTORY;
  const adoAgentRootDirectory = process.env.AGENT_ROOTDIRECTORY;
  const adoSystemCollectionId = process.env.SYSTEM_COLLECTIONID;
  const adoSystemCollectionUri = process.env.SYSTEM_COLLECTIONURI;
  const adoSystemDefinitionId = process.env.SYSTEM_DEFINITIONID;
  const adoSystemTeamProjectId = process.env.SYSTEM_TEAMPROJECTID;
  const adoSystemTimelineId = process.env.SYSTEM_TIMELINEID;
  const adoSystemJobId = process.env.SYSTEM_JOBID;
  const adoSystemJobName = process.env.SYSTEM_JOBNAME;
  const adoSystemJobAttempt = process.env.SYSTEM_JOBATTEMPT;
  const adoSystemDebug = process.env.SYSTEM_DEBUG;
  const adoSystemDefaultWorkingDirectory = process.env.SYSTEM_DEFAULTWORKINGDIRECTORY;
  const adoSystemTeamFoundationCollectionUri = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
  const adoPipelineWorkspace = process.env.PIPELINE_WORKSPACE;
  const adoSystemStageAttempt = process.env.SYSTEM_STAGEATTEMPT;
  const adoSystemStageDisplayName = process.env.SYSTEM_STAGEDISPLAYNAME;
  const adoSystemStageName = process.env.SYSTEM_STAGENAME;
  const adoSystemWorkFolder = process.env.SYSTEM_WORKFOLDER;
  const adoSystemPhaseAttempt = process.env.SYSTEM_PHASEATTEMPT;
  const adoSystemPhaseDisplayName = process.env.SYSTEM_PHASEDISPLAYNAME;
  const adoSystemPhaseName = process.env.SYSTEM_PHASENAME;
  const adoSystemPlanId = process.env.SYSTEM_PLANID;
  const adoSystemHostType = process.env.SYSTEM_HOSTTYPE;
  const adoSystemJobDisplayName = process.env.SYSTEM_JOBDISPLAYNAME;
  const adoTfBuild = process.env.TF_BUILD;
  const adoChecksStageAttempt = process.env.CHECKS_STAGEATTEMPT;
  const adoStrategyName = process.env.STRATEGY_NAME;
  const adoStrategyCycleName = process.env.STRATEGY_CYCLENAME;
  const adoReleaseArtifacts = {};
  for (const key in process.env) {
    if (key.startsWith("RELEASE_ARTIFACTS_")) {
      adoReleaseArtifacts[key] = process.env[key];
    }
  }
  const adoEnvironmentName = process.env.ENVIRONMENT_NAME;
  const adoEnvironmentId = process.env.ENVIRONMENT_ID;
  const adoEnvironmentResourceName = process.env.ENVIRONMENT_RESOURCENAME;
  const adoEnvironmentResourceId = process.env.ENVIRONMENT_RESOURCEID;
  const adoPrIsFork = process.env.SYSTEM_PULLREQUEST_ISFORK;
  const adoPrId = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
  const adoPrNumber = process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER;
  const adoPrTargetBranch = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH || process.env.SYSTEM_PULLREQUEST_TARGETBRANCHNAME;
  const adoPrSourceBranch = process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH;
  const adoPrSourceCommit = process.env.SYSTEM_PULLREQUEST_SOURCECOMMITID;
  const adoPrSourceRepoUri = process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI;
  const repository = githubRepo || adoRepo || options.repository;
  const branch = githubRef?.replace("refs/heads/", "") || adoSourceBranch?.replace("refs/heads/", "") || adoSourceBranchName || options.branch;
  const commit = githubSha || adoSourceVersion || options.commit;
  const pipeline = githubWorkflow || adoPipeline || options.pipeline;
  const runId = githubRunId || adoBuildId || options.runId;
  const runNumber = githubRunNumber || adoBuildNumber || options.runId;
  const triggeredBy = githubActor || adoRequestedFor || adoRequestedForEmail || adoQueuedBy || adoRequestedForId || adoQueuedById || process.env.BUILD_QUEUEDBY || "cli-user";
  const pullRequestNumber = githubRef?.match(/refs\/pull\/(\d+)\//)?.[1] || adoPrNumber || adoPrId;
  const isPullRequest = !!(githubRef?.includes("refs/pull/") || adoPrId || adoPrNumber);
  const pullRequestBranch = adoPrSourceBranch?.replace("refs/heads/", "");
  const adoJobName = process.env.SYSTEM_JOBNAME || process.env.SYSTEM_PHASENAME || process.env.SYSTEM_STAGENAME || adoAgentJobName;
  const adoJobAttempt = process.env.SYSTEM_JOBATTEMPT;
  const adoPhaseAttempt = process.env.SYSTEM_PHASEATTEMPT;
  const adoRunAttempt = adoJobAttempt || adoPhaseAttempt || process.env.SYSTEM_STAGEATTEMPT;
  const adoApiUrl = process.env.SYSTEM_COLLECTIONURI;
  const finalJobName = options.jobName || githubJob || adoJobName;
  const finalRunAttempt = githubRunAttempt || adoRunAttempt || options.runAttempt;
  const finalEventName = githubEventName || adoBuildReason || options.eventName;
  const finalApiUrl = githubApiUrl || adoCollectionUri || options.apiUrl;
  const finalDefinitionId = adoSystemDefinitionId;
  const finalDefinitionVersion = adoDefinitionVersion;
  const finalSourcesDirectory = adoSourcesDirectory || githubWorkspace;
  const finalBinariesDirectory = adoBinariesDirectory;
  const finalArtifactStagingDirectory = adoArtifactStagingDirectory;
  const finalContainerId = adoContainerId;
  const finalRepositoryLocalPath = adoRepositoryLocalPath;
  const finalRetentionDays = githubRetentionDays ? parseInt(githubRetentionDays) : void 0;
  const finalRunnerEnvironment = runnerEnvironment;
  const finalRunnerDebug = runnerDebug === "1";
  const finalWorkflowRef = githubWorkflowRef;
  const finalWorkflowSha = githubWorkflowSha;
  const finalActorId = githubActorId;
  const finalTriggeringActor = githubTriggeringActor;
  const finalRefType = githubRefType;
  const finalRefProtected = githubRefProtected === "true";
  const finalPrNumber = pullRequestNumber;
  const finalRepoOwner = githubRepositoryOwner;
  const finalRunnerOs = runnerOs || adoAgentOs || options.runnerOs;
  const finalRunnerArch = runnerArch || adoAgentArch || options.runnerArch;
  const finalRunnerName = runnerName || adoAgentName || options.runnerName;
  const finalAgentMachineName = adoAgentMachineName || options.agentMachineName;
  const finalAgentId = adoAgentId || options.agentId;
  const finalAgentBuildDirectory = adoAgentBuildDirectory || options.agentBuildDirectory;
  const finalAgentHomeDirectory = adoAgentHomeDirectory || options.agentHomeDirectory;
  const finalAgentTempDirectory = adoAgentTempDirectory || options.agentTempDirectory;
  const finalAgentToolsDirectory = adoAgentToolsDirectory || options.agentToolsDirectory;
  const finalAgentWorkFolder = adoAgentWorkFolder || options.agentWorkFolder;
  const finalStagingDirectory = adoStagingDirectory || options.stagingDirectory;
  const finalTestResultsDirectory = adoTestResultsDirectory || options.testResultsDirectory;
  const finalAgentContainerMapping = options.agentContainerMapping || adoAgentContainerMapping;
  const finalAgentReleaseDirectory = options.agentReleaseDirectory || adoAgentReleaseDirectory;
  const finalAgentRootDirectory = options.agentRootDirectory || adoAgentRootDirectory;
  const finalPipelineWorkspace = options.pipelineWorkspace || adoPipelineWorkspace;
  const finalSystemJobName = adoSystemJobName;
  const finalSystemDebug = options.systemDebug || adoSystemDebug;
  const finalSystemDefaultWorkingDirectory = options.systemDefaultWorkingDirectory || adoSystemDefaultWorkingDirectory;
  const finalSystemTeamFoundationCollectionUri = options.systemTeamFoundationCollectionUri || adoSystemTeamFoundationCollectionUri;
  const finalReleaseDeploymentRequestedFor = options.releaseDeploymentRequestedFor || adoReleaseDeploymentRequestedFor;
  const finalReleaseDeploymentRequestedForEmail = options.releaseDeploymentRequestedForEmail || adoReleaseDeploymentRequestedForEmail;
  const finalReleaseDeploymentId = options.releaseDeploymentId || adoReleaseDeploymentId;
  const finalReleaseDefinitionEnvironmentId = options.releaseDefinitionEnvironmentId || adoReleaseDefinitionEnvironmentId;
  const finalReleaseDefinitionId = options.releaseDefinitionId || adoReleaseDefinitionId;
  const finalReleaseDefinitionName = options.releaseDefinitionName || adoReleaseDefinitionName;
  const finalReleaseEnvironmentId = options.releaseEnvironmentId || adoReleaseEnvironmentId;
  const finalReleaseEnvironmentName = options.releaseEnvironmentName || adoReleaseEnvironmentName;
  const finalReleasePrimaryArtifactSourceAlias = options.releasePrimaryArtifactSourceAlias || adoReleasePrimaryArtifactSourceAlias;
  const finalReleaseDescription = options.releaseDescription || adoReleaseDescription;
  const finalReleaseId = options.releaseId || adoReleaseId;
  const finalReleaseName = options.releaseName || adoReleaseName;
  const finalReleaseUri = options.releaseUri || adoReleaseUri;
  const metadata = parseMetadata(options.meta);
  const explicitFields = [];
  if (options.pipeline) explicitFields.push("pipeline");
  if (options.repository) explicitFields.push("repository");
  if (options.branch) explicitFields.push("branch");
  if (options.commit) explicitFields.push("commit");
  if (options.environment) explicitFields.push("environment");
  if (options.eventName) explicitFields.push("eventName");
  if (options.jobName) explicitFields.push("jobName");
  if (options.runAttempt) explicitFields.push("runAttempt");
  if (options.runNumber) explicitFields.push("runNumber");
  if (options.runId) explicitFields.push("runNumber");
  if (options.apiUrl) explicitFields.push("apiUrl");
  if (options.runnerOs) explicitFields.push("runnerOs");
  if (options.runnerArch) explicitFields.push("runnerArch");
  if (options.runnerName) explicitFields.push("runnerName");
  if (options.actor) explicitFields.push("triggeredBy");
  if (options.repositoryOwner) explicitFields.push("repositoryOwner");
  if (options.action) explicitFields.push("action");
  if (options.actionPath) explicitFields.push("actionPath");
  if (options.actionRepository) explicitFields.push("actionRepository");
  if (options.baseRef) explicitFields.push("baseRef");
  if (options.headRef) explicitFields.push("headRef");
  if (options.runnerTemp) explicitFields.push("runnerTemp");
  if (options.runnerToolCache) explicitFields.push("runnerToolCache");
  if (options.runnerWorkspace) explicitFields.push("runnerWorkspace");
  if (options.ref) explicitFields.push("ref");
  if (options.refProtected) explicitFields.push("refProtected");
  if (options.retentionDays) explicitFields.push("retentionDays");
  if (options.workflowRef) explicitFields.push("workflowRef");
  if (options.workflowSha) explicitFields.push("workflowSha");
  if (options.graphqlUrl) explicitFields.push("graphqlUrl");
  if (options.workspace) explicitFields.push("workspace");
  if (options.jobStatus) explicitFields.push("jobStatus");
  if (options.jobContainer) explicitFields.push("jobContainer");
  if (options.jobServices) explicitFields.push("jobServices");
  if (options.strategyJobIndex) explicitFields.push("strategyJobIndex");
  if (options.strategyJobTotal) explicitFields.push("strategyJobTotal");
  if (options.actionRef) explicitFields.push("actionRef");
  if (options.actionStatus) explicitFields.push("actionStatus");
  if (options.repositoryGitUrl) explicitFields.push("repositoryGitUrl");
  if (options.secretSource) explicitFields.push("secretSource");
  if (options.eventPayload) explicitFields.push("eventPayload");
  if (options.agentId) explicitFields.push("agentId");
  if (options.agentName) explicitFields.push("runnerName");
  if (options.agentMachineName) explicitFields.push("agentMachineName");
  if (options.agentBuildDirectory) explicitFields.push("agentBuildDirectory");
  if (options.agentHomeDirectory) explicitFields.push("agentHomeDirectory");
  if (options.agentTempDirectory) explicitFields.push("agentTempDirectory");
  if (options.agentToolsDirectory) explicitFields.push("agentToolsDirectory");
  if (options.agentWorkFolder) explicitFields.push("agentWorkFolder");
  if (options.artifactStagingDirectory) explicitFields.push("artifactStagingDirectory");
  if (options.binariesDirectory) explicitFields.push("binariesDirectory");
  if (options.containerId) explicitFields.push("containerId");
  if (options.definitionVersion) explicitFields.push("definitionVersion");
  if (options.repositoryLocalPath) explicitFields.push("repositoryLocalPath");
  if (options.sourcesDirectory) explicitFields.push("sourcesDirectory");
  if (options.stagingDirectory) explicitFields.push("stagingDirectory");
  if (options.testResultsDirectory) explicitFields.push("testResultsDirectory");
  const finalBranch = pullRequestBranch || branch;
  let executionUrl = options.runUrl;
  let definitionUrl = "https://example.com/pipeline";
  if (githubServerUrl && githubRepo) {
    let workflowPath = options.pipeline || githubWorkflow || "unknown";
    const ref = githubWorkflowRef;
    if (ref && typeof ref === "string") {
      const parts = ref.split("@")[0].split("/");
      const filename = parts[parts.length - 1];
      if (filename) {
        workflowPath = filename;
      }
    }
    definitionUrl = `${githubServerUrl}/${githubRepo}/actions/workflows/${workflowPath}`;
    if (runId) {
      executionUrl = executionUrl || `${githubServerUrl}/${githubRepo}/actions/runs/${runId}`;
    }
  } else if (adoCollectionUri && adoTeamProject) {
    const cleanUri = adoCollectionUri.endsWith("/") ? adoCollectionUri.slice(0, -1) : adoCollectionUri;
    if (finalDefinitionId) {
      definitionUrl = `${cleanUri}/${adoTeamProject}/_build?definitionId=${finalDefinitionId}`;
    }
    if (adoBuildId || runId) {
      executionUrl = executionUrl || `${cleanUri}/${adoTeamProject}/_build/results?buildId=${adoBuildId || runId}`;
    }
  }
  let repositoryUrl = options.repository ? githubServerUrl ? `${githubServerUrl}/${repository}` : `https://github.com/${repository}` : "https://github.com/cli-user/unknown-repo";
  if (adoRepositoryUri && !githubServerUrl) {
    repositoryUrl = adoRepositoryUri;
  }
  const hasAllOptions = pipeline && repository && finalBranch && commit;
  if (hasAllOptions) {
    const event2 = {
      source,
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      failedAt: (/* @__PURE__ */ new Date()).toISOString(),
      pipeline: {
        name: pipeline,
        url: definitionUrl,
        runUrl: executionUrl,
        runId: runId || "cli-run",
        runNumber: parseInt(runNumber) || 1,
        step: parsedLogs.entries.find((e) => e.level === "error")?.message?.split(":")[0] || "unknown",
        runAttempt: parseInt(finalRunAttempt) || 1,
        runnerOs: finalRunnerOs,
        runnerArch: finalRunnerArch,
        runnerName: finalRunnerName,
        agentMachineName: finalAgentMachineName,
        definitionId: finalDefinitionId,
        definitionVersion: finalDefinitionVersion,
        sourcesDirectory: finalSourcesDirectory,
        binariesDirectory: finalBinariesDirectory,
        artifactStagingDirectory: finalArtifactStagingDirectory,
        containerId: finalContainerId,
        repositoryLocalPath: finalRepositoryLocalPath,
        stagingDirectory: finalStagingDirectory,
        workflowRef: finalWorkflowRef,
        workflowSha: finalWorkflowSha,
        runnerEnvironment: finalRunnerEnvironment,
        runnerDebug: finalRunnerDebug,
        retentionDays: finalRetentionDays,
        actorId: finalActorId,
        triggeringActor: finalTriggeringActor,
        refType: finalRefType,
        refProtected: finalRefProtected,
        job: finalJobName,
        jobName: finalJobName,
        action: options.action,
        actionPath: options.actionPath,
        actionRepository: options.actionRepository,
        baseRef: options.baseRef,
        headRef: options.headRef,
        runnerTemp: options.runnerTemp,
        runnerToolCache: options.runnerToolCache,
        runnerWorkspace: options.runnerWorkspace,
        workspace: options.workspace,
        jobStatus: options.jobStatus,
        jobContainer: options.jobContainer,
        jobServices: options.jobServices,
        strategyJobIndex: options.strategyJobIndex ? parseInt(options.strategyJobIndex, 10) : void 0,
        strategyJobTotal: options.strategyJobTotal ? parseInt(options.strategyJobTotal, 10) : void 0,
        actionRef: options.actionRef,
        actionStatus: options.actionStatus,
        repositoryGitUrl: options.repositoryGitUrl,
        repositoryClean: adoRepositoryClean,
        repositoryGitSubmoduleCheckout: adoRepositoryGitSubmoduleCheckout,
        secretSource: options.secretSource,
        agentContainerMapping: finalAgentContainerMapping,
        agentReleaseDirectory: finalAgentReleaseDirectory,
        agentRootDirectory: finalAgentRootDirectory,
        agentId: finalAgentId,
        agentBuildDirectory: finalAgentBuildDirectory,
        agentHomeDirectory: finalAgentHomeDirectory,
        agentTempDirectory: finalAgentTempDirectory,
        agentToolsDirectory: finalAgentToolsDirectory,
        agentWorkFolder: finalAgentWorkFolder,
        agentJobStatus: adoAgentJobStatus,
        testResultsDirectory: finalTestResultsDirectory,
        pipelineWorkspace: finalPipelineWorkspace,
        systemJobName: finalSystemJobName,
        systemCollectionId: adoSystemCollectionId,
        systemCollectionUri: adoSystemCollectionUri,
        systemJobId: adoSystemJobId,
        systemDebug: finalSystemDebug,
        systemDefaultWorkingDirectory: finalSystemDefaultWorkingDirectory,
        systemTeamFoundationCollectionUri: finalSystemTeamFoundationCollectionUri,
        systemStageAttempt: adoSystemStageAttempt,
        systemStageDisplayName: adoSystemStageDisplayName,
        systemStageName: adoSystemStageName,
        systemPhaseAttempt: adoSystemPhaseAttempt,
        systemPhaseDisplayName: adoSystemPhaseDisplayName,
        systemPhaseName: adoSystemPhaseName,
        systemPlanId: adoSystemPlanId,
        systemHostType: adoSystemHostType,
        systemJobDisplayName: adoSystemJobDisplayName,
        prIsFork: adoPrIsFork !== void 0 ? String(adoPrIsFork === "True") : void 0,
        prId: adoPrId,
        systemWorkFolder: adoSystemWorkFolder,
        tfBuild: adoTfBuild,
        checksStageAttempt: adoChecksStageAttempt,
        strategyName: adoStrategyName,
        strategyCycleName: adoStrategyCycleName,
        cronScheduleDisplayName: adoCronScheduleDisplayName,
        requestedFor: adoRequestedFor,
        requestedForEmail: adoRequestedForEmail,
        requestedForId: adoRequestedForId,
        queuedBy: adoQueuedBy,
        queuedById: adoQueuedById,
        sourceBranchName: adoSourceBranchName,
        sourceVersionMessage: adoSourceVersionMessage,
        repositoryId: adoRepositoryId,
        repositoryProvider: adoRepositoryProvider,
        repositoryUri: adoRepositoryUri,
        ...adoStageRequestedBy ? { stageRequestedBy: adoStageRequestedBy } : {},
        ...adoStageRequestedForId ? { stageRequestedForId: adoStageRequestedForId } : {},
        ...adoSourceTfvcShelveset ? { sourceTfvcShelveset: adoSourceTfvcShelveset } : {},
        ...adoSourceBranch ? { fullSourceBranch: adoSourceBranch } : {},
        releaseDeploymentRequestedFor: finalReleaseDeploymentRequestedFor,
        releaseDeploymentRequestedForEmail: finalReleaseDeploymentRequestedForEmail,
        releaseDeploymentId: finalReleaseDeploymentId,
        releaseDefinitionEnvironmentId: finalReleaseDefinitionEnvironmentId,
        releaseDefinitionId: finalReleaseDefinitionId,
        releaseDefinitionName: finalReleaseDefinitionName,
        releaseEnvironmentId: finalReleaseEnvironmentId,
        releaseEnvironmentName: finalReleaseEnvironmentName,
        releasePrimaryArtifactSourceAlias: finalReleasePrimaryArtifactSourceAlias,
        releaseDescription: finalReleaseDescription,
        releaseId: finalReleaseId,
        releaseName: finalReleaseName,
        releaseUri: finalReleaseUri,
        releaseArtifacts: Object.keys(adoReleaseArtifacts).length > 0 ? adoReleaseArtifacts : void 0
      },
      repository: {
        owner: options.repositoryOwner || githubRepositoryOwner || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
        name: repository?.split("/")[1] || repository || "unknown-repo",
        url: repositoryUrl,
        defaultBranch: "main",
        id: adoRepositoryId || githubRepositoryId,
        ownerId: githubRepositoryOwnerId,
        provider: adoRepositoryProvider || (githubServerUrl ? "github" : void 0)
      },
      commit: {
        sha: commit,
        url: repository && commit ? githubServerUrl ? `${githubServerUrl}/${repository}/commit/${commit}` : repositoryUrl + `/commit/${commit}` : "https://github.com/cli-user/unknown-repo/commit/unknown",
        message: adoSourceVersionMessage || "CLI analysis",
        author: triggeredBy,
        authorEmail: adoRequestedForEmail
      },
      branch: finalBranch,
      environment,
      triggeredBy,
      eventName: finalEventName,
      apiUrl: finalApiUrl,
      graphqlUrl: options.graphqlUrl,
      eventPayload: options.eventPayload ? typeof options.eventPayload === "string" ? JSON.parse(options.eventPayload) : options.eventPayload : void 0,
      metadata,
      explicitFields,
      failure: {
        exitCode: parsedLogs.exitCodes[0],
        errorMessage: parsedLogs.errorMessages[0],
        failedStep: parsedLogs.entries.find((e) => e.level === "error")?.message?.split(":")[0] || "unknown",
        logs: parsedLogs.entries.map((e) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
        logsTruncated: parsedLogs.truncated
      }
    };
    if (isPullRequest && pullRequestNumber) {
      event2.pullRequest = {
        number: parseInt(pullRequestNumber),
        url: githubServerUrl ? `${githubServerUrl}/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pullrequest/${pullRequestNumber}`
      };
    }
    return event2;
  }
  const questions = [
    {
      type: "input",
      name: "pipelineName",
      message: "Pipeline/workflow name:",
      default: pipeline || "unknown-pipeline"
    },
    {
      type: "input",
      name: "repositoryName",
      message: "Repository name:",
      default: repository || "unknown-repo"
    },
    {
      type: "input",
      name: "branch",
      message: "Branch:",
      default: finalBranch || "main"
    },
    {
      type: "input",
      name: "commitSha",
      message: "Commit SHA:",
      default: commit || "unknown"
    },
    {
      type: "input",
      name: "environment",
      message: "Environment (optional):",
      default: environment
    }
  ];
  const answers = await inquirer.prompt(questions);
  const event = {
    source,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    failedAt: (/* @__PURE__ */ new Date()).toISOString(),
    pipeline: {
      name: pipeline || answers.pipelineName,
      url: definitionUrl,
      runUrl: executionUrl,
      runId: runId || "cli-run",
      runNumber: parseInt(runNumber) || 1,
      step: parsedLogs.entries.find((e) => e.level === "error")?.message?.split(":")[0] || "unknown",
      runAttempt: parseInt(finalRunAttempt) || 1,
      runnerOs: finalRunnerOs,
      runnerArch: finalRunnerArch,
      runnerName: finalRunnerName,
      agentMachineName: finalAgentMachineName,
      definitionId: finalDefinitionId,
      definitionVersion: finalDefinitionVersion,
      sourcesDirectory: finalSourcesDirectory,
      binariesDirectory: finalBinariesDirectory,
      artifactStagingDirectory: finalArtifactStagingDirectory,
      containerId: finalContainerId,
      repositoryLocalPath: finalRepositoryLocalPath,
      workflowRef: finalWorkflowRef,
      workflowSha: finalWorkflowSha,
      runnerEnvironment: finalRunnerEnvironment,
      runnerDebug: finalRunnerDebug,
      retentionDays: finalRetentionDays,
      actorId: finalActorId,
      triggeringActor: finalTriggeringActor,
      refType: finalRefType,
      refProtected: finalRefProtected,
      job: finalJobName,
      jobName: finalJobName,
      ...adoStageRequestedBy ? { stageRequestedBy: adoStageRequestedBy } : {},
      ...adoStageRequestedForId ? { stageRequestedForId: adoStageRequestedForId } : {},
      ...adoSourceTfvcShelveset ? { sourceTfvcShelveset: adoSourceTfvcShelveset } : {},
      ...adoSourceBranch ? { fullSourceBranch: adoSourceBranch } : {}
    },
    repository: {
      owner: options.repositoryOwner || githubRepositoryOwner || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
      name: repository?.split("/")[1] || answers.repositoryName,
      url: repositoryUrl,
      defaultBranch: "main",
      id: adoRepositoryId || githubRepositoryId,
      ownerId: githubRepositoryOwnerId,
      provider: adoRepositoryProvider || (githubServerUrl ? "github" : void 0)
    },
    commit: {
      sha: commit || answers.commitSha,
      url: repository && commit ? githubServerUrl ? `${githubServerUrl}/${repository}/commit/${commit}` : repositoryUrl + `/commit/${commit}` : `https://github.com/cli-user/unknown-repo/commit/${answers.commitSha}`,
      message: adoSourceVersionMessage || "CLI analysis",
      author: triggeredBy
    },
    branch: finalBranch || answers.branch,
    environment: environment || answers.environment,
    triggeredBy,
    eventName: finalEventName,
    apiUrl: finalApiUrl,
    metadata: parseMetadata(options.meta),
    explicitFields: [],
    failure: {
      exitCode: parsedLogs.exitCodes[0],
      errorMessage: parsedLogs.errorMessages[0],
      failedStep: parsedLogs.entries.find((e) => e.level === "error")?.message?.split(":")[0] || "unknown",
      logs: parsedLogs.entries.map((e) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
      logsTruncated: parsedLogs.truncated
    }
  };
  if (isPullRequest && pullRequestNumber) {
    event.pullRequest = {
      number: parseInt(pullRequestNumber),
      url: githubServerUrl ? `${githubServerUrl}/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pullrequest/${pullRequestNumber}`
    };
  }
  return event;
}
function parseMetadata(metaArray) {
  const metadata = {};
  if (!metaArray) return metadata;
  for (const item of metaArray) {
    const [key, ...valueParts] = item.split("=");
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join("=").trim();
    }
  }
  return metadata;
}
process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught exception:"), error);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("Unhandled rejection at:"), promise, "reason:", reason);
  process.exit(1);
});
program.parse();
