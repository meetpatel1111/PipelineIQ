"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/core/types/failure-event.ts
var import_zod, FailureSourceSchema, RepositorySchema, CommitSchema, PullRequestSchema, PipelineSchema, FailureDetailsSchema, FailureEventSchema;
var init_failure_event = __esm({
  "src/core/types/failure-event.ts"() {
    "use strict";
    import_zod = require("zod");
    FailureSourceSchema = import_zod.z.enum(["github", "azure-devops"]);
    RepositorySchema = import_zod.z.object({
      owner: import_zod.z.string(),
      name: import_zod.z.string(),
      url: import_zod.z.string().url(),
      defaultBranch: import_zod.z.string().optional(),
      id: import_zod.z.string().optional(),
      ownerId: import_zod.z.string().optional(),
      provider: import_zod.z.string().optional(),
      visibility: import_zod.z.string().optional(),
      clean: import_zod.z.string().optional(),
      tfvcWorkspace: import_zod.z.string().optional(),
      gitSubmoduleCheckout: import_zod.z.string().optional()
    });
    CommitSchema = import_zod.z.object({
      sha: import_zod.z.string(),
      url: import_zod.z.string().url(),
      message: import_zod.z.string().optional(),
      author: import_zod.z.string().optional(),
      authorEmail: import_zod.z.string().optional(),
      requestedForId: import_zod.z.string().optional(),
      queuedById: import_zod.z.string().optional()
    });
    PullRequestSchema = import_zod.z.object({
      number: import_zod.z.number().int().positive(),
      url: import_zod.z.string().url(),
      title: import_zod.z.string(),
      author: import_zod.z.string()
    });
    PipelineSchema = import_zod.z.object({
      name: import_zod.z.string(),
      url: import_zod.z.string().url(),
      runUrl: import_zod.z.string().url().optional(),
      runId: import_zod.z.string(),
      runNumber: import_zod.z.number().int().nonnegative().optional(),
      stage: import_zod.z.string().optional(),
      job: import_zod.z.string().optional(),
      step: import_zod.z.string().optional(),
      task: import_zod.z.string().optional(),
      runnerType: import_zod.z.string().optional(),
      runnerOs: import_zod.z.string().optional(),
      runnerArch: import_zod.z.string().optional(),
      agentPool: import_zod.z.string().optional(),
      runnerName: import_zod.z.string().optional(),
      agentMachineName: import_zod.z.string().optional(),
      retryCount: import_zod.z.number().int().nonnegative().optional(),
      runAttempt: import_zod.z.number().int().nonnegative().optional(),
      jobName: import_zod.z.string().optional(),
      definitionVersion: import_zod.z.string().optional(),
      definitionId: import_zod.z.string().optional(),
      reason: import_zod.z.string().optional(),
      sourcesDirectory: import_zod.z.string().optional(),
      binariesDirectory: import_zod.z.string().optional(),
      artifactStagingDirectory: import_zod.z.string().optional(),
      containerId: import_zod.z.string().optional(),
      repositoryLocalPath: import_zod.z.string().optional(),
      workflowRef: import_zod.z.string().optional(),
      workflowSha: import_zod.z.string().optional(),
      runnerEnvironment: import_zod.z.string().optional(),
      runnerDebug: import_zod.z.boolean().optional(),
      retentionDays: import_zod.z.number().int().optional(),
      actorId: import_zod.z.string().optional(),
      triggeringActor: import_zod.z.string().optional(),
      triggeringActorId: import_zod.z.string().optional(),
      refType: import_zod.z.string().optional(),
      refProtected: import_zod.z.boolean().optional(),
      agentId: import_zod.z.string().optional(),
      agentJobStatus: import_zod.z.string().optional(),
      agentBuildDirectory: import_zod.z.string().optional(),
      agentHomeDirectory: import_zod.z.string().optional(),
      agentTempDirectory: import_zod.z.string().optional(),
      agentToolsDirectory: import_zod.z.string().optional(),
      agentWorkFolder: import_zod.z.string().optional(),
      agentContainerMapping: import_zod.z.string().optional(),
      agentReleaseDirectory: import_zod.z.string().optional(),
      agentRootDirectory: import_zod.z.string().optional(),
      stagingDirectory: import_zod.z.string().optional(),
      testResultsDirectory: import_zod.z.string().optional(),
      cronScheduleDisplayName: import_zod.z.string().optional(),
      pipelineWorkspace: import_zod.z.string().optional(),
      stageRequestedBy: import_zod.z.string().optional(),
      stageRequestedForId: import_zod.z.string().optional(),
      sourceTfvcShelveset: import_zod.z.string().optional(),
      triggeredByBuildId: import_zod.z.string().optional(),
      triggeredByDefinitionId: import_zod.z.string().optional(),
      triggeredByDefinitionName: import_zod.z.string().optional(),
      triggeredByBuildNumber: import_zod.z.string().optional(),
      triggeredByProjectId: import_zod.z.string().optional(),
      teamProjectId: import_zod.z.string().optional(),
      teamProject: import_zod.z.string().optional(),
      buildUri: import_zod.z.string().optional(),
      buildNumber: import_zod.z.string().optional(),
      environmentId: import_zod.z.string().optional(),
      environmentResourceName: import_zod.z.string().optional(),
      environmentResourceId: import_zod.z.string().optional(),
      strategyName: import_zod.z.string().optional(),
      strategyCycleName: import_zod.z.string().optional(),
      checksStageAttempt: import_zod.z.string().optional(),
      systemWorkFolder: import_zod.z.string().optional(),
      systemCollectionId: import_zod.z.string().optional(),
      systemCollectionUri: import_zod.z.string().optional(),
      systemTeamFoundationCollectionUri: import_zod.z.string().optional(),
      systemDebug: import_zod.z.string().optional(),
      systemDefaultWorkingDirectory: import_zod.z.string().optional(),
      systemHostType: import_zod.z.string().optional(),
      systemJobDisplayName: import_zod.z.string().optional(),
      systemJobId: import_zod.z.string().optional(),
      systemJobName: import_zod.z.string().optional(),
      systemPhaseAttempt: import_zod.z.string().optional(),
      systemPhaseDisplayName: import_zod.z.string().optional(),
      systemPhaseName: import_zod.z.string().optional(),
      systemPlanId: import_zod.z.string().optional(),
      systemStageAttempt: import_zod.z.string().optional(),
      systemStageDisplayName: import_zod.z.string().optional(),
      systemStageName: import_zod.z.string().optional(),
      systemTimelineId: import_zod.z.string().optional(),
      tfBuild: import_zod.z.string().optional(),
      prIsFork: import_zod.z.string().optional(),
      prId: import_zod.z.string().optional(),
      prNumber: import_zod.z.string().optional(),
      prTargetBranchName: import_zod.z.string().optional(),
      prSourceBranch: import_zod.z.string().optional(),
      prSourceCommitId: import_zod.z.string().optional(),
      prSourceRepoUri: import_zod.z.string().optional(),
      prTargetBranch: import_zod.z.string().optional(),
      releaseDeploymentRequestedFor: import_zod.z.string().optional(),
      releaseDeploymentRequestedForEmail: import_zod.z.string().optional(),
      releaseDeploymentId: import_zod.z.string().optional(),
      releaseDefinitionEnvironmentId: import_zod.z.string().optional(),
      releaseDefinitionId: import_zod.z.string().optional(),
      releaseDefinitionName: import_zod.z.string().optional(),
      releaseEnvironmentId: import_zod.z.string().optional(),
      releaseEnvironmentName: import_zod.z.string().optional(),
      releasePrimaryArtifactSourceAlias: import_zod.z.string().optional(),
      releaseDescription: import_zod.z.string().optional(),
      releaseId: import_zod.z.string().optional(),
      requestedFor: import_zod.z.string().optional(),
      requestedForEmail: import_zod.z.string().optional(),
      requestedForId: import_zod.z.string().optional(),
      queuedBy: import_zod.z.string().optional(),
      queuedById: import_zod.z.string().optional(),
      sourceBranchName: import_zod.z.string().optional(),
      fullSourceBranch: import_zod.z.string().optional(),
      sourceVersionMessage: import_zod.z.string().optional(),
      repositoryId: import_zod.z.string().optional(),
      repositoryProvider: import_zod.z.string().optional(),
      repositoryUri: import_zod.z.string().optional(),
      releaseName: import_zod.z.string().optional(),
      releaseUri: import_zod.z.string().optional(),
      releaseArtifacts: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional(),
      triggerId: import_zod.z.string().optional(),
      triggerName: import_zod.z.string().optional(),
      action: import_zod.z.string().optional(),
      actionPath: import_zod.z.string().optional(),
      actionRepository: import_zod.z.string().optional(),
      baseRef: import_zod.z.string().optional(),
      headRef: import_zod.z.string().optional(),
      runnerTemp: import_zod.z.string().optional(),
      runnerToolCache: import_zod.z.string().optional(),
      runnerWorkspace: import_zod.z.string().optional(),
      workspace: import_zod.z.string().optional(),
      jobStatus: import_zod.z.string().optional(),
      jobContainer: import_zod.z.string().optional(),
      jobServices: import_zod.z.string().optional(),
      strategyJobIndex: import_zod.z.number().int().optional(),
      strategyJobTotal: import_zod.z.number().int().optional(),
      actionRef: import_zod.z.string().optional(),
      actionStatus: import_zod.z.string().optional(),
      repositoryGitUrl: import_zod.z.string().optional(),
      repositoryClean: import_zod.z.string().optional(),
      repositoryGitSubmoduleCheckout: import_zod.z.string().optional(),
      secretSource: import_zod.z.string().optional()
    });
    FailureDetailsSchema = import_zod.z.object({
      exitCode: import_zod.z.number().int().optional(),
      errorMessage: import_zod.z.string().optional(),
      failedStep: import_zod.z.string().optional(),
      failedCommand: import_zod.z.string().optional(),
      stackTrace: import_zod.z.string().optional(),
      logs: import_zod.z.string().default(""),
      logsTruncated: import_zod.z.boolean().default(false)
    });
    FailureEventSchema = import_zod.z.object({
      source: FailureSourceSchema,
      startedAt: import_zod.z.string().datetime(),
      failedAt: import_zod.z.string().datetime(),
      durationMs: import_zod.z.number().int().nonnegative().optional(),
      queueTimeMs: import_zod.z.number().int().nonnegative().optional(),
      pipeline: PipelineSchema,
      repository: RepositorySchema,
      commit: CommitSchema,
      branch: import_zod.z.string(),
      pullRequest: PullRequestSchema.optional(),
      environment: import_zod.z.string().optional(),
      triggeredBy: import_zod.z.string().optional(),
      eventName: import_zod.z.string().optional(),
      apiUrl: import_zod.z.string().optional(),
      graphqlUrl: import_zod.z.string().optional(),
      metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).default({}),
      explicitFields: import_zod.z.array(import_zod.z.string()).default([]),
      failure: FailureDetailsSchema,
      eventPayload: import_zod.z.any().optional()
    });
  }
});

// src/core/types/jira-ticket.ts
var import_zod2, SeveritySchema, PrioritySchema, FailureCategorySchema, ExternalLinkSchema, FieldProvenanceSchema, JiraTicketSpecSchema;
var init_jira_ticket = __esm({
  "src/core/types/jira-ticket.ts"() {
    "use strict";
    import_zod2 = require("zod");
    SeveritySchema = import_zod2.z.enum(["Critical", "High", "Medium", "Low"]);
    PrioritySchema = import_zod2.z.enum(["Highest", "High", "Medium", "Low", "Lowest"]);
    FailureCategorySchema = import_zod2.z.enum([
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
    ExternalLinkSchema = import_zod2.z.object({
      url: import_zod2.z.string().url(),
      title: import_zod2.z.string()
    });
    FieldProvenanceSchema = import_zod2.z.enum(["deterministic", "computed", "ai", "fallback", "history"]);
    JiraTicketSpecSchema = import_zod2.z.object({
      projectKey: import_zod2.z.string(),
      issueType: import_zod2.z.string().default("Bug"),
      summary: import_zod2.z.string(),
      description: import_zod2.z.string(),
      priority: PrioritySchema.optional(),
      severity: SeveritySchema.optional(),
      category: FailureCategorySchema.default("Unknown"),
      labels: import_zod2.z.array(import_zod2.z.string()).default([]),
      components: import_zod2.z.array(import_zod2.z.string()).default([]),
      environment: import_zod2.z.string().optional(),
      assignee: import_zod2.z.string().nullable().optional(),
      rca: import_zod2.z.string().optional(),
      remediationSteps: import_zod2.z.array(import_zod2.z.string()).optional(),
      customFields: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.unknown()).default({}),
      dedupSignature: import_zod2.z.string(),
      externalLinks: import_zod2.z.array(ExternalLinkSchema).default([]),
      provenance: import_zod2.z.record(import_zod2.z.string(), FieldProvenanceSchema).default({}),
      metrics: import_zod2.z.custom().optional()
    });
  }
});

// src/core/types/self-healing.ts
var import_zod3, FileChangeSchema, CodeFixSchema, SelfHealingConfigSchema, SelfHealingResultSchema;
var init_self_healing = __esm({
  "src/core/types/self-healing.ts"() {
    "use strict";
    import_zod3 = require("zod");
    FileChangeSchema = import_zod3.z.object({
      /** Relative path from repo root (e.g. "package.json", "src/utils.ts") */
      filePath: import_zod3.z.string(),
      /** The action to take on this file */
      action: import_zod3.z.enum(["modify", "create", "delete"]),
      /** Original file content (for modify/delete — used for PR diff context) */
      originalContent: import_zod3.z.string().optional(),
      /** New file content after the fix */
      newContent: import_zod3.z.string().optional(),
      /** Human-readable explanation of what this specific change does */
      changeDescription: import_zod3.z.string()
    });
    CodeFixSchema = import_zod3.z.object({
      /** Unique identifier for traceability */
      id: import_zod3.z.string(),
      /** Human-readable title for the fix (used as PR title) */
      title: import_zod3.z.string(),
      /** Detailed explanation of what the fix does and why */
      description: import_zod3.z.string(),
      /** List of file-level changes */
      changes: import_zod3.z.array(FileChangeSchema).min(1),
      /** AI confidence in this fix (0–1) */
      confidence: import_zod3.z.number().min(0).max(1),
      /** Failure category this fix addresses */
      category: import_zod3.z.string(),
      /** Risk assessment of applying this fix */
      riskLevel: import_zod3.z.enum(["low", "medium", "high"]),
      /** Estimated time saved by this fix (in minutes) */
      estimatedTimeSavedMinutes: import_zod3.z.number().optional()
    });
    SelfHealingConfigSchema = import_zod3.z.object({
      /** Master switch for self-healing */
      enabled: import_zod3.z.boolean().default(false),
      /** Master switch for safety guardrails. Defaults to ON — enforces the confidence
       *  gate, file/line scope limits, category allow-list, and blocked-path protection.
       *  Set to false to let the AI attempt fixes on a wider range of failures. */
      enableGuardrails: import_zod3.z.boolean().default(true),
      /** Generate the fix but don't push/create PR */
      dryRun: import_zod3.z.boolean().default(false),
      /** Minimum AI confidence required to attempt a fix (0–1) */
      minConfidence: import_zod3.z.number().min(0).max(1).default(0.8),
      /** Maximum number of files a single fix can touch */
      maxFilesChanged: import_zod3.z.number().int().positive().default(10),
      /** Maximum total lines changed across all files */
      maxLinesChanged: import_zod3.z.number().int().positive().default(200),
      /** Failure categories eligible for self-healing */
      allowedCategories: import_zod3.z.array(import_zod3.z.string()).default([
        "Dependency",
        "Build",
        "Test",
        "Configuration"
      ]),
      /** Glob patterns for files that must never be auto-fixed */
      blockedPaths: import_zod3.z.array(import_zod3.z.string()).default([
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
      branchPrefix: import_zod3.z.string().default("pipelineiq/fix"),
      /** Git provider platform ("github" | "azure-devops") — auto-detected from event.source */
      platform: import_zod3.z.enum(["github", "azure-devops"]).optional(),
      /** GitHub token for PR creation (falls back to GITHUB_TOKEN env) */
      githubToken: import_zod3.z.string().optional(),
      /** Azure DevOps PAT for PR creation (falls back to SYSTEM_ACCESSTOKEN env) */
      azureToken: import_zod3.z.string().optional(),
      /** Add draft PR instead of ready-for-review */
      draftPr: import_zod3.z.boolean().default(true),
      /** Auto-assign PR reviewers (GitHub usernames or ADO identities) */
      reviewers: import_zod3.z.array(import_zod3.z.string()).default([]),
      /** PR labels to apply */
      prLabels: import_zod3.z.array(import_zod3.z.string()).default(["pipelineiq", "self-healing", "auto-fix"]),
      /** Enable local verification commands (compilation/testing/regeneration) */
      enableVerification: import_zod3.z.boolean().default(true),
      /** Commands to run in sequence to verify the code fix.
       *  Empty array (default) = auto-detected from package.json scripts + failure category. */
      verificationCommands: import_zod3.z.array(import_zod3.z.string()).default([]),
      /** Automatically regenerate auto-generated lockfiles (package-lock.json, yarn.lock, etc.) when desynchronization is detected */
      autoRegenerateLockfile: import_zod3.z.boolean().default(true)
    });
    SelfHealingResultSchema = import_zod3.z.object({
      /** Whether a fix was attempted */
      attempted: import_zod3.z.boolean(),
      /** Whether the fix was successfully applied */
      success: import_zod3.z.boolean(),
      /** The generated code fix (present even in dry-run) */
      fix: CodeFixSchema.optional(),
      /** URL of the created Pull Request */
      prUrl: import_zod3.z.string().optional(),
      /** PR number */
      prNumber: import_zod3.z.number().optional(),
      /** Branch name used for the fix */
      branchName: import_zod3.z.string().optional(),
      /** Reason if self-healing was skipped or failed */
      reason: import_zod3.z.string().optional(),
      /** Whether this was a dry run */
      dryRun: import_zod3.z.boolean().default(false)
    });
  }
});

// src/core/types/config.ts
var import_zod4, AIModeSchema, JiraAuthSchema, DedupConfigSchema, AIConfigSchema, SlackConfigSchema, TeamsConfigSchema, NotificationsConfigSchema, JiraCustomFieldMappingSchema, PipelineIQConfigSchema;
var init_config = __esm({
  "src/core/types/config.ts"() {
    "use strict";
    import_zod4 = require("zod");
    init_jira_ticket();
    init_self_healing();
    AIModeSchema = import_zod4.z.enum(["disabled", "assist", "full"]);
    JiraAuthSchema = import_zod4.z.object({
      baseUrl: import_zod4.z.string().url(),
      type: import_zod4.z.enum(["cloud", "server"]).default("cloud"),
      email: import_zod4.z.string().email().optional(),
      // Cloud basic auth
      apiToken: import_zod4.z.string().optional(),
      // Cloud basic auth
      username: import_zod4.z.string().optional(),
      // Server basic auth
      password: import_zod4.z.string().optional(),
      // Server basic auth
      accessToken: import_zod4.z.string().optional(),
      // OAuth2 support
      strictGDPR: import_zod4.z.boolean().optional()
      // Privacy support
    });
    DedupConfigSchema = import_zod4.z.object({
      enabled: import_zod4.z.boolean().default(true),
      windowHours: import_zod4.z.number().int().positive().default(24),
      minSimilarity: import_zod4.z.number().min(0).max(1).default(0.85),
      onClosedHit: import_zod4.z.enum(["reopen", "create-new", "skip"]).default("create-new"),
      reopenTransition: import_zod4.z.string().default("Reopen Issue"),
      closedStatuses: import_zod4.z.array(import_zod4.z.string()).default(["Done", "Resolved", "Closed"])
    });
    AIConfigSchema = import_zod4.z.object({
      mode: AIModeSchema.default("disabled"),
      provider: import_zod4.z.enum(["openai", "anthropic", "azure-openai", "gemini", "local"]).optional(),
      apiKey: import_zod4.z.string().optional(),
      model: import_zod4.z.string().optional(),
      endpoint: import_zod4.z.string().optional(),
      temperature: import_zod4.z.number().min(0).max(2).optional(),
      minConfidence: import_zod4.z.number().min(0).max(1).default(0.6),
      maxLogTokens: import_zod4.z.number().int().positive().default(8e3),
      enableThinking: import_zod4.z.boolean().default(false),
      thinkingBudget: import_zod4.z.number().int().default(8e3)
    });
    SlackConfigSchema = import_zod4.z.object({
      webhookUrl: import_zod4.z.string().url(),
      channel: import_zod4.z.string().optional(),
      notifyOn: import_zod4.z.array(SeveritySchema).optional(),
      includeMetrics: import_zod4.z.boolean().optional(),
      username: import_zod4.z.string().optional()
    });
    TeamsConfigSchema = import_zod4.z.object({
      webhookUrl: import_zod4.z.string().url(),
      notifyOn: import_zod4.z.array(SeveritySchema).optional(),
      includeMetrics: import_zod4.z.boolean().optional()
    });
    NotificationsConfigSchema = import_zod4.z.object({
      enabled: import_zod4.z.boolean().optional(),
      slack: SlackConfigSchema.optional(),
      teams: TeamsConfigSchema.optional()
    });
    JiraCustomFieldMappingSchema = import_zod4.z.object({
      externalLinks: import_zod4.z.string().optional(),
      // Default: customfield_10010
      provenance: import_zod4.z.string().optional(),
      // Default: customfield_10011
      dedupSignature: import_zod4.z.string().optional(),
      // Default: customfield_10012
      metrics: import_zod4.z.string().optional()
      // Default: customfield_10013
    });
    PipelineIQConfigSchema = import_zod4.z.object({
      jira: JiraAuthSchema,
      jiraProject: import_zod4.z.string().min(1),
      issueType: import_zod4.z.string().default("Bug"),
      jiraCustomFields: JiraCustomFieldMappingSchema.optional(),
      defaultAssignee: import_zod4.z.string().optional(),
      defaultLabels: import_zod4.z.array(import_zod4.z.string()).default(["pipelineiq", "ci-failure"]),
      ai: AIConfigSchema.default({ mode: "disabled" }),
      dedup: DedupConfigSchema.default({}),
      maskSecrets: import_zod4.z.boolean().default(true),
      logExcerptLines: import_zod4.z.number().int().positive().default(150),
      displayMetadata: import_zod4.z.array(import_zod4.z.string()).optional(),
      autoWorklog: import_zod4.z.boolean().default(false),
      notifications: NotificationsConfigSchema.optional(),
      selfHealing: SelfHealingConfigSchema.optional()
    });
  }
});

// src/core/types/ai-enrichment.ts
var import_zod5, AIEnrichmentSchema, DeterministicFallbackSchema, EnrichmentResultSchema;
var init_ai_enrichment = __esm({
  "src/core/types/ai-enrichment.ts"() {
    "use strict";
    import_zod5 = require("zod");
    AIEnrichmentSchema = import_zod5.z.object({
      summary: import_zod5.z.string().optional(),
      rootCause: import_zod5.z.string().optional(),
      remediation: import_zod5.z.string().optional(),
      severity: import_zod5.z.enum(["Critical", "High", "Medium", "Low"]).optional(),
      assignee: import_zod5.z.string().nullable().optional(),
      tags: import_zod5.z.array(import_zod5.z.string()).optional(),
      confidence: import_zod5.z.number().min(0).max(1).optional(),
      postmortem: import_zod5.z.string().optional(),
      timeline: import_zod5.z.string().optional(),
      riskAssessment: import_zod5.z.string().optional(),
      classification: import_zod5.z.enum([
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
    DeterministicFallbackSchema = import_zod5.z.object({
      summary: import_zod5.z.string().optional(),
      rootCause: import_zod5.z.string().optional(),
      remediation: import_zod5.z.string().optional(),
      severity: import_zod5.z.enum(["Critical", "High", "Medium", "Low"]).optional(),
      assignee: import_zod5.z.string().nullable().optional(),
      tags: import_zod5.z.array(import_zod5.z.string()).optional(),
      classification: import_zod5.z.enum([
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
    EnrichmentResultSchema = import_zod5.z.object({
      field: import_zod5.z.string(),
      value: import_zod5.z.unknown(),
      provenance: import_zod5.z.enum(["deterministic", "computed", "ai", "fallback"]),
      aiUsed: import_zod5.z.boolean().default(false),
      confidence: import_zod5.z.number().min(0).max(1).optional()
    });
  }
});

// src/core/types/deduplication.ts
var import_zod6, DeduplicationResultSchema, FailureSignatureSchema, IncidentClusterSchema;
var init_deduplication = __esm({
  "src/core/types/deduplication.ts"() {
    "use strict";
    import_zod6 = require("zod");
    DeduplicationResultSchema = import_zod6.z.object({
      isDuplicate: import_zod6.z.boolean(),
      existingIssueId: import_zod6.z.string().optional(),
      existingIssueKey: import_zod6.z.string().optional(),
      similarity: import_zod6.z.number().min(0).max(1).optional(),
      signature: import_zod6.z.string(),
      clusterId: import_zod6.z.string().optional(),
      relatedIncidents: import_zod6.z.array(import_zod6.z.string()).optional()
    });
    FailureSignatureSchema = import_zod6.z.object({
      repo: import_zod6.z.string(),
      workflow: import_zod6.z.string(),
      step: import_zod6.z.string(),
      errorPattern: import_zod6.z.string(),
      category: import_zod6.z.string(),
      environment: import_zod6.z.string().optional()
    });
    IncidentClusterSchema = import_zod6.z.object({
      clusterId: import_zod6.z.string(),
      signature: FailureSignatureSchema,
      count: import_zod6.z.number().int().positive(),
      firstSeen: import_zod6.z.string().datetime(),
      lastSeen: import_zod6.z.string().datetime(),
      issueIds: import_zod6.z.array(import_zod6.z.string()),
      isActive: import_zod6.z.boolean().default(true)
    });
  }
});

// src/core/types/operational-metrics.ts
var import_zod7, OperationalMetricsSchema, OwnershipRoutingSchema, NotificationFieldsSchema;
var init_operational_metrics = __esm({
  "src/core/types/operational-metrics.ts"() {
    "use strict";
    import_zod7 = require("zod");
    OperationalMetricsSchema = import_zod7.z.object({
      mttrEstimate: import_zod7.z.number().int().positive().optional(),
      incidentFrequency: import_zod7.z.number().int().nonnegative().optional(),
      failureTrend: import_zod7.z.enum(["increasing", "decreasing", "stable"]).optional(),
      teamReliabilityScore: import_zod7.z.number().min(0).max(100).optional(),
      pipelineReliabilityScore: import_zod7.z.number().min(0).max(100).optional(),
      failureDuration: import_zod7.z.number().int().nonnegative().optional(),
      slaImpact: import_zod7.z.boolean().optional(),
      sloImpact: import_zod7.z.boolean().optional(),
      downtimeEstimate: import_zod7.z.number().int().nonnegative().optional(),
      deploymentRiskScore: import_zod7.z.number().min(0).max(10).optional(),
      blastRadius: import_zod7.z.array(import_zod7.z.string()).optional(),
      flakyDetection: import_zod7.z.boolean().optional(),
      similarFailuresCount: import_zod7.z.number().int().nonnegative().optional(),
      previousIncidentLinks: import_zod7.z.array(import_zod7.z.string()).optional()
    });
    OwnershipRoutingSchema = import_zod7.z.object({
      suggestedTeam: import_zod7.z.string().optional(),
      suggestedAssignee: import_zod7.z.string().optional(),
      escalationPolicy: import_zod7.z.string().optional(),
      onCallEngineer: import_zod7.z.string().optional(),
      serviceOwner: import_zod7.z.string().optional(),
      teamSlackChannel: import_zod7.z.string().optional(),
      teamsChannel: import_zod7.z.string().optional()
    });
    NotificationFieldsSchema = import_zod7.z.object({
      slackNotificationUrl: import_zod7.z.string().url().optional(),
      teamsNotificationUrl: import_zod7.z.string().url().optional(),
      incidentChannel: import_zod7.z.string().optional(),
      stakeholders: import_zod7.z.array(import_zod7.z.string()).optional(),
      notificationStatus: import_zod7.z.enum(["pending", "sent", "delivered", "failed"]).optional(),
      pagerReference: import_zod7.z.string().optional()
    });
  }
});

// src/core/types/index.ts
var init_types = __esm({
  "src/core/types/index.ts"() {
    "use strict";
    init_failure_event();
    init_jira_ticket();
    init_config();
    init_ai_enrichment();
    init_deduplication();
    init_operational_metrics();
    init_self_healing();
  }
});

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
var init_adf = __esm({
  "src/core/jira/adf.ts"() {
    "use strict";
  }
});

// src/core/jira/errors.ts
var JiraApiError, JiraConfigError;
var init_errors = __esm({
  "src/core/jira/errors.ts"() {
    "use strict";
    JiraApiError = class _JiraApiError extends Error {
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
    JiraConfigError = class _JiraConfigError extends Error {
      name = "JiraConfigError";
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _JiraConfigError.prototype);
      }
    };
  }
});

// src/core/jira/client.ts
function createJiraClient(auth) {
  if (auth.type === "server") {
    return new JiraServerClient(auth);
  } else {
    return new JiraCloudClient(auth);
  }
}
var import_jira, import_jira_client, JiraCloudClient, JiraServerClient;
var init_client = __esm({
  "src/core/jira/client.ts"() {
    "use strict";
    import_jira = require("jira.js");
    import_jira_client = __toESM(require("jira-client"), 1);
    init_adf();
    init_errors();
    JiraCloudClient = class {
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
        this.client = (0, import_jira.createClient)(import_jira.ClientType.Version3, {
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
      getApiPath(path3) {
        return `/rest/api/3${path3}`;
      }
      formatDescription(text) {
        return markdownToAdf(text);
      }
      formatAssignee(assigneeId) {
        return { accountId: assigneeId };
      }
    };
    JiraServerClient = class {
      client;
      constructor(auth) {
        const url = new URL(auth.baseUrl);
        this.client = new import_jira_client.default({
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
      getApiPath(path3) {
        return `/rest/api/2${path3}`;
      }
      formatDescription(text) {
        return text;
      }
      formatAssignee(assigneeId) {
        return { name: assigneeId };
      }
    };
  }
});

// src/core/jira/enhanced-client.ts
var EnhancedJiraClient;
var init_enhanced_client = __esm({
  "src/core/jira/enhanced-client.ts"() {
    "use strict";
    init_client();
    init_errors();
    init_adf();
    EnhancedJiraClient = class {
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
      getApiPath(path3) {
        return this.client.getApiPath(path3);
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
  }
});

// src/core/jira/index.ts
function createEnhancedJiraClient(auth, customFields) {
  return new EnhancedJiraClient(auth, customFields);
}
var init_jira = __esm({
  "src/core/jira/index.ts"() {
    "use strict";
    init_client();
    init_enhanced_client();
    init_enhanced_client();
    init_errors();
    init_adf();
  }
});

// src/core/jira/history.ts
var HistoryService;
var init_history = __esm({
  "src/core/jira/history.ts"() {
    "use strict";
    HistoryService = class {
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
  }
});

// src/core/dedup.ts
function computeDedupSignature(event, category) {
  const parts = [
    event.repository.owner,
    event.repository.name,
    event.pipeline.name,
    event.pipeline.step ?? event.failure.failedStep ?? "",
    category,
    fingerprint(event.failure.errorMessage ?? event.failure.logs.slice(0, 2e3))
  ].join("|");
  return (0, import_node_crypto.createHash)("sha1").update(parts).digest("hex").slice(0, 16);
}
function computeFailureFingerprint(event, category) {
  const parts = [
    category,
    fingerprint(event.failure.errorMessage ?? event.failure.logs.slice(0, 2e3))
  ].join("|");
  return (0, import_node_crypto.createHash)("sha1").update(parts).digest("hex").slice(0, 16);
}
function fingerprint(text) {
  return text.replace(/\b[0-9a-f]{8,}\b/gi, "X").replace(/\b\d+\b/g, "N").replace(/(\/[\w.\-]+)+/g, "/PATH").replace(/\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+/g, "TIMESTAMP").replace(/\s+/g, " ").trim().slice(0, 500);
}
var import_node_crypto;
var init_dedup = __esm({
  "src/core/dedup.ts"() {
    "use strict";
    import_node_crypto = require("crypto");
  }
});

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
var init_history2 = __esm({
  "src/core/enrichers/history.ts"() {
    "use strict";
    init_history();
    init_dedup();
  }
});

// src/core/signatures.ts
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
var SIGNATURES, GROUPED_SIGNATURES;
var init_signatures = __esm({
  "src/core/signatures.ts"() {
    "use strict";
    SIGNATURES = [
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
    GROUPED_SIGNATURES = SIGNATURES.reduce((acc, sig) => {
      const cat = sig.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(sig);
      return acc;
    }, {});
  }
});

// src/core/ai/fallbacks.ts
var DeterministicFallbackEngine;
var init_fallbacks = __esm({
  "src/core/ai/fallbacks.ts"() {
    "use strict";
    init_signatures();
    DeterministicFallbackEngine = class {
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
  }
});

// src/core/enrichers/types.ts
function setField(ctx, key, value, source, override = false) {
  if (!override && ctx.fields[key] !== void 0) return;
  ctx.fields[key] = value;
  ctx.provenance[String(key)] = source;
}
var init_types2 = __esm({
  "src/core/enrichers/types.ts"() {
    "use strict";
  }
});

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
function extractDeploymentTargets(logs) {
  const targets = [];
  const targetPatterns = [
    // Kubernetes
    /deploying to[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /namespace[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /cluster[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    // Docker registries
    /pushing to[:\s]*([a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9_\-\/\.]+)/gi,
    /registry[:\s]*([a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9_\-\/\.]+)/gi,
    // Cloud providers
    /environment[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /region[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    // Terraform
    /workspace[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /backend[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi
  ];
  for (const pattern of targetPatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const target = match[1];
      if (target && target.trim().length > 0) {
        targets.push(target.trim());
      }
    }
  }
  return [...new Set(targets)];
}
function extractSecurityIssues(logs) {
  const securityIssues = [];
  const securityPatterns = [
    // Authentication failures
    /(401\s+unauthorized|authentication\s+failed|invalid\s+token|access\s+denied)/gi,
    // Authorization failures
    /(403\s+forbidden|permission\s+denied|access\s+forbidden)/gi,
    // Secret exposure
    /(secret|password|token|key|credential)\s+(exposed|leaked|found)/gi,
    // Vulnerability mentions
    /(vulnerability|cve-\d+|security\s+issue)/gi,
    // TLS/SSL errors
    /(ssl\s+error|tls\s+error|certificate\s+error|handshake\s+failed)/gi,
    // Injection attempts
    /(sql\s+injection|xss|csrf|command\s+injection)/gi
  ];
  for (const pattern of securityPatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      securityIssues.push(...matches.map((match) => match.trim()));
    }
  }
  return [...new Set(securityIssues)];
}
function extractPerformanceIssues(logs) {
  const performanceIssues = [];
  const performancePatterns = [
    // Timeout patterns
    /(timeout|timed\s+out|deadline\s+exceeded)/gi,
    // Memory issues
    /(out\s+of\s+memory|memory\s+leak|heap\s+overflow)/gi,
    // CPU issues
    /(high\s+cpu|cpu\s+spike|cpu\s+exhaustion)/gi,
    // Disk issues
    /(disk\s+full|no\s+space\s+left|storage\s+exhausted)/gi,
    // Network issues
    /(connection\s+refused|connection\s+timeout|network\s+error)/gi,
    // Slow operations
    /(slow\s+query|slow\s+request|performance\s+degradation)/gi
  ];
  for (const pattern of performancePatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      performanceIssues.push(...matches.map((match) => match.trim()));
    }
  }
  return [...new Set(performanceIssues)];
}
var init_extractors = __esm({
  "src/core/log-parser/extractors.ts"() {
    "use strict";
  }
});

// src/core/enrichers/computed.ts
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
var computedEnricher;
var init_computed = __esm({
  "src/core/enrichers/computed.ts"() {
    "use strict";
    init_dedup();
    init_signatures();
    init_fallbacks();
    init_types2();
    init_extractors();
    computedEnricher = {
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
  }
});

// src/core/enrichers/deterministic.ts
var deterministicEnricher;
var init_deterministic = __esm({
  "src/core/enrichers/deterministic.ts"() {
    "use strict";
    init_types2();
    deterministicEnricher = {
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
  }
});

// src/core/secret-mask.ts
function maskSecrets(input) {
  let out = input;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
var PATTERNS;
var init_secret_mask = __esm({
  "src/core/secret-mask.ts"() {
    "use strict";
    PATTERNS = [
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
  }
});

// src/core/log-parser/smart-excerpt.ts
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
var ERROR_ANCHOR_PATTERNS;
var init_smart_excerpt = __esm({
  "src/core/log-parser/smart-excerpt.ts"() {
    "use strict";
    ERROR_ANCHOR_PATTERNS = [
      /^\s*##\[error\]/i,
      /exit\s+code\s+[1-9]\d*/i,
      /process\s+exited\s+with\s+code\s+[1-9]\d*/i,
      /\b(FAIL|FAILED|ERROR)\b/,
      /exception\s+in\s+thread/i,
      /traceback\s+\(most\s+recent\s+call\s+last\)/i,
      /thread\s+'.*'\s+panicked/i,
      /goroutine\s+\d+\s+\[running\]/i
    ];
  }
});

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
var init_renderer = __esm({
  "src/core/renderer.ts"() {
    "use strict";
    init_secret_mask();
    init_smart_excerpt();
  }
});

// src/core/notifications/slack.ts
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
var SEVERITY_EMOJI;
var init_slack = __esm({
  "src/core/notifications/slack.ts"() {
    "use strict";
    SEVERITY_EMOJI = {
      Critical: "\u{1F534}",
      High: "\u{1F7E0}",
      Medium: "\u{1F7E1}",
      Low: "\u{1F535}"
    };
  }
});

// src/core/notifications/teams.ts
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
var SEVERITY_COLOR;
var init_teams = __esm({
  "src/core/notifications/teams.ts"() {
    "use strict";
    SEVERITY_COLOR = {
      Critical: "attention",
      High: "warning",
      Medium: "accent",
      Low: "good"
    };
  }
});

// src/core/notifications/index.ts
var NotificationService;
var init_notifications = __esm({
  "src/core/notifications/index.ts"() {
    "use strict";
    init_slack();
    init_teams();
    NotificationService = class {
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
  }
});

// src/core/ai/providers.ts
function stripThinkingTags(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
var OpenAIProvider, AnthropicProvider, AzureOpenAIProvider, LocalAIProvider;
var init_providers = __esm({
  "src/core/ai/providers.ts"() {
    "use strict";
    OpenAIProvider = class {
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
    AnthropicProvider = class {
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
    AzureOpenAIProvider = class {
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
    LocalAIProvider = class {
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
  }
});

// src/core/ai/gemini-provider.ts
var GeminiProvider;
var init_gemini_provider = __esm({
  "src/core/ai/gemini-provider.ts"() {
    "use strict";
    GeminiProvider = class {
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
  }
});

// src/core/self-healing/fix-generator.ts
var fs, path, FixGenerator;
var init_fix_generator = __esm({
  "src/core/self-healing/fix-generator.ts"() {
    "use strict";
    fs = __toESM(require("fs"), 1);
    path = __toESM(require("path"), 1);
    init_providers();
    init_gemini_provider();
    FixGenerator = class {
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
  }
});

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
var init_patch = __esm({
  "src/core/self-healing/patch.ts"() {
    "use strict";
  }
});

// src/core/self-healing/github-provider.ts
var GitHubProvider;
var init_github_provider = __esm({
  "src/core/self-healing/github-provider.ts"() {
    "use strict";
    init_patch();
    GitHubProvider = class {
      name = "github";
      token;
      constructor(token) {
        if (!token) {
          throw new Error("[PipelineIQ] GitHub token is required for self-healing PR creation");
        }
        this.token = token;
      }
      async createFixPR(fix, repoOwner, repoName, baseBranch, baseSha, issueKey, options) {
        const { Octokit } = await import("@octokit/rest");
        const octokit = new Octokit({ auth: this.token });
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
  }
});

// src/core/self-healing/azure-provider.ts
var AzureDevOpsProvider;
var init_azure_provider = __esm({
  "src/core/self-healing/azure-provider.ts"() {
    "use strict";
    init_patch();
    AzureDevOpsProvider = class {
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
  }
});

// src/core/self-healing/engine.ts
function matchGlob(filePath, pattern) {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.replace(/\\/g, "/").toLowerCase();
  const regexStr = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regexStr}$`).test(normalizedPath) || new RegExp(`(^|/)${regexStr}($|/)`).test(normalizedPath);
}
var fs2, path2, import_node_child_process, SelfHealingEngine;
var init_engine = __esm({
  "src/core/self-healing/engine.ts"() {
    "use strict";
    fs2 = __toESM(require("fs"), 1);
    path2 = __toESM(require("path"), 1);
    import_node_child_process = require("child_process");
    init_fix_generator();
    init_github_provider();
    init_azure_provider();
    init_patch();
    SelfHealingEngine = class {
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
                  (0, import_node_child_process.execSync)("npm install", { cwd: root, stdio: "inherit" });
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
                    (0, import_node_child_process.execSync)(cmd, { cwd: root, stdio: "inherit" });
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
          const run2 = (s) => pm === "npm" ? `npm run ${s}` : `${pm} ${s}`;
          const cmds = [install];
          if (cat === "test") {
            if (has("build")) cmds.push(run2("build"));
            if (has("test")) cmds.push(run2("test"));
          } else if (cat === "lint") {
            if (has("lint")) cmds.push(run2("lint"));
            else if (has("lint:fix")) cmds.push(run2("lint:fix"));
          } else {
            if (has("build")) cmds.push(run2("build"));
            else if (has("compile")) cmds.push(run2("compile"));
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
  }
});

// src/core/self-healing/index.ts
var init_self_healing2 = __esm({
  "src/core/self-healing/index.ts"() {
    "use strict";
    init_engine();
    init_fix_generator();
    init_github_provider();
    init_azure_provider();
  }
});

// src/core/pipeline.ts
async function processFailureEvent(event, config, options = {}) {
  const logger = options.logger ?? (0, import_pino.pino)({ level: "info" });
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
var import_pino;
var init_pipeline = __esm({
  "src/core/pipeline.ts"() {
    "use strict";
    import_pino = require("pino");
    init_types();
    init_jira();
    init_history2();
    init_computed();
    init_deterministic();
    init_renderer();
    init_notifications();
    init_self_healing2();
  }
});

// src/core/ai/ai-engine.ts
var AIEngine;
var init_ai_engine = __esm({
  "src/core/ai/ai-engine.ts"() {
    "use strict";
    init_fallbacks();
    init_providers();
    init_gemini_provider();
    AIEngine = class _AIEngine {
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
  }
});

// src/core/enrichers/ai.ts
var aiEnricher;
var init_ai = __esm({
  "src/core/enrichers/ai.ts"() {
    "use strict";
    init_types2();
    init_ai_engine();
    aiEnricher = {
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
  }
});

// src/core/ai/types.ts
var import_zod8, AIProviderSchema, AIRequestSchema, AIResponseSchema, AIEngineConfigSchema;
var init_types3 = __esm({
  "src/core/ai/types.ts"() {
    "use strict";
    import_zod8 = require("zod");
    AIProviderSchema = import_zod8.z.enum(["openai", "anthropic", "azure-openai", "local", "gemini"]);
    AIRequestSchema = import_zod8.z.object({
      logs: import_zod8.z.string(),
      errorMessage: import_zod8.z.string().optional(),
      stackTrace: import_zod8.z.string().optional(),
      failedCommand: import_zod8.z.string().optional(),
      exitCode: import_zod8.z.number().int().optional(),
      pipelineName: import_zod8.z.string(),
      repositoryName: import_zod8.z.string(),
      branch: import_zod8.z.string(),
      environment: import_zod8.z.string().optional(),
      category: import_zod8.z.string().optional(),
      historicalContext: import_zod8.z.string().optional(),
      isRawPrompt: import_zod8.z.boolean().optional()
    });
    AIResponseSchema = import_zod8.z.object({
      summary: import_zod8.z.string().optional(),
      rootCause: import_zod8.z.string().optional(),
      remediation: import_zod8.z.array(import_zod8.z.string()).optional(),
      severity: import_zod8.z.enum(["Critical", "High", "Medium", "Low"]).optional(),
      assignee: import_zod8.z.string().nullable().optional(),
      tags: import_zod8.z.array(import_zod8.z.string()).optional(),
      confidence: import_zod8.z.number().min(0).max(1).optional(),
      postmortem: import_zod8.z.string().optional(),
      timeline: import_zod8.z.string().optional(),
      riskAssessment: import_zod8.z.string().optional(),
      classification: import_zod8.z.enum([
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
    AIEngineConfigSchema = import_zod8.z.object({
      provider: AIProviderSchema.optional(),
      apiKey: import_zod8.z.string().optional(),
      model: import_zod8.z.string().optional(),
      endpoint: import_zod8.z.string().optional(),
      deployment: import_zod8.z.string().optional(),
      apiVersion: import_zod8.z.string().optional(),
      modelPath: import_zod8.z.string().optional(),
      maxTokens: import_zod8.z.number().int().positive().default(1e3),
      temperature: import_zod8.z.number().min(0).max(2).default(0.1),
      timeout: import_zod8.z.number().int().positive().default(3e4),
      retryAttempts: import_zod8.z.number().int().positive().default(3),
      minConfidence: import_zod8.z.number().min(0).max(1).default(0.6),
      /** Enable extended thinking / reasoning for models that support it.
       *  Gemini 2.5+: uses thinkingConfig with thinkingBudget tokens.
       *  Anthropic: uses extended_thinking with budget_tokens. */
      enableThinking: import_zod8.z.boolean().default(false),
      /** Token budget for thinking (Gemini: thinkingBudget, Anthropic: budget_tokens).
       *  -1 = dynamic (model decides). Only used when enableThinking is true. */
      thinkingBudget: import_zod8.z.number().int().default(8e3)
    });
  }
});

// src/core/ai/index.ts
var init_ai2 = __esm({
  "src/core/ai/index.ts"() {
    "use strict";
    init_ai_engine();
    init_providers();
    init_fallbacks();
    init_types3();
  }
});

// src/core/log-parser/types.ts
var import_zod9, LogEntrySchema, ParsedLogSchema, LogFormatSchema, ParseOptionsSchema;
var init_types4 = __esm({
  "src/core/log-parser/types.ts"() {
    "use strict";
    import_zod9 = require("zod");
    LogEntrySchema = import_zod9.z.object({
      timestamp: import_zod9.z.string().datetime().optional(),
      level: import_zod9.z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
      message: import_zod9.z.string(),
      source: import_zod9.z.string().optional(),
      metadata: import_zod9.z.record(import_zod9.z.unknown()).optional()
    });
    ParsedLogSchema = import_zod9.z.object({
      entries: import_zod9.z.array(LogEntrySchema),
      errorMessages: import_zod9.z.array(import_zod9.z.string()),
      stackTraces: import_zod9.z.array(import_zod9.z.string()),
      exitCodes: import_zod9.z.array(import_zod9.z.number().int()),
      failedCommands: import_zod9.z.array(import_zod9.z.string()),
      relevantEntries: import_zod9.z.array(LogEntrySchema),
      summary: import_zod9.z.string().optional(),
      truncated: import_zod9.z.boolean().default(false)
    });
    LogFormatSchema = import_zod9.z.enum([
      "github-actions",
      "azure-devops",
      "terraform",
      "kubernetes",
      "docker",
      "junit",
      "generic"
    ]);
    ParseOptionsSchema = import_zod9.z.object({
      format: LogFormatSchema.default("generic"),
      maxEntries: import_zod9.z.number().int().positive().default(1e3),
      extractStackTraces: import_zod9.z.boolean().default(true),
      extractErrorMessages: import_zod9.z.boolean().default(true),
      extractExitCodes: import_zod9.z.boolean().default(true),
      extractCommands: import_zod9.z.boolean().default(true),
      relevantKeywords: import_zod9.z.array(import_zod9.z.string()).default([
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
  }
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
var init_parsers = __esm({
  "src/core/log-parser/parsers.ts"() {
    "use strict";
    init_types4();
    init_extractors();
  }
});

// src/core/log-parser/index.ts
var init_log_parser = __esm({
  "src/core/log-parser/index.ts"() {
    "use strict";
    init_parsers();
    init_extractors();
    init_types4();
    init_smart_excerpt();
  }
});

// src/core/index.ts
var core_exports = {};
__export(core_exports, {
  AIConfigSchema: () => AIConfigSchema,
  AIEngine: () => AIEngine,
  AIEngineConfigSchema: () => AIEngineConfigSchema,
  AIEnrichmentSchema: () => AIEnrichmentSchema,
  AIModeSchema: () => AIModeSchema,
  AIProviderSchema: () => AIProviderSchema,
  AIRequestSchema: () => AIRequestSchema,
  AIResponseSchema: () => AIResponseSchema,
  AnthropicProvider: () => AnthropicProvider,
  AzureOpenAIProvider: () => AzureOpenAIProvider,
  CodeFixSchema: () => CodeFixSchema,
  CommitSchema: () => CommitSchema,
  DedupConfigSchema: () => DedupConfigSchema,
  DeduplicationResultSchema: () => DeduplicationResultSchema,
  DeterministicFallbackEngine: () => DeterministicFallbackEngine,
  DeterministicFallbackSchema: () => DeterministicFallbackSchema,
  EnhancedJiraClient: () => EnhancedJiraClient,
  EnrichmentResultSchema: () => EnrichmentResultSchema,
  ExternalLinkSchema: () => ExternalLinkSchema,
  FailureCategorySchema: () => FailureCategorySchema,
  FailureDetailsSchema: () => FailureDetailsSchema,
  FailureEventSchema: () => FailureEventSchema,
  FailureSignatureSchema: () => FailureSignatureSchema,
  FailureSourceSchema: () => FailureSourceSchema,
  FieldProvenanceSchema: () => FieldProvenanceSchema,
  FileChangeSchema: () => FileChangeSchema,
  FixGenerator: () => FixGenerator,
  IncidentClusterSchema: () => IncidentClusterSchema,
  JiraApiError: () => JiraApiError,
  JiraAuthSchema: () => JiraAuthSchema,
  JiraConfigError: () => JiraConfigError,
  JiraCustomFieldMappingSchema: () => JiraCustomFieldMappingSchema,
  JiraTicketSpecSchema: () => JiraTicketSpecSchema,
  LocalAIProvider: () => LocalAIProvider,
  LogEntrySchema: () => LogEntrySchema,
  LogFormatSchema: () => LogFormatSchema,
  NotificationFieldsSchema: () => NotificationFieldsSchema,
  NotificationService: () => NotificationService,
  NotificationsConfigSchema: () => NotificationsConfigSchema,
  OpenAIProvider: () => OpenAIProvider,
  OperationalMetricsSchema: () => OperationalMetricsSchema,
  OwnershipRoutingSchema: () => OwnershipRoutingSchema,
  ParseOptionsSchema: () => ParseOptionsSchema,
  ParsedLogSchema: () => ParsedLogSchema,
  PipelineIQConfigSchema: () => PipelineIQConfigSchema,
  PipelineSchema: () => PipelineSchema,
  PrioritySchema: () => PrioritySchema,
  PullRequestSchema: () => PullRequestSchema,
  RepositorySchema: () => RepositorySchema,
  SIGNATURES: () => SIGNATURES,
  SelfHealingConfigSchema: () => SelfHealingConfigSchema,
  SelfHealingEngine: () => SelfHealingEngine,
  SelfHealingResultSchema: () => SelfHealingResultSchema,
  SeveritySchema: () => SeveritySchema,
  SlackConfigSchema: () => SlackConfigSchema,
  TeamsConfigSchema: () => TeamsConfigSchema,
  aiEnricher: () => aiEnricher,
  buildSmartExcerpt: () => buildSmartExcerpt,
  computeDedupSignature: () => computeDedupSignature,
  computeFailureFingerprint: () => computeFailureFingerprint,
  computedEnricher: () => computedEnricher,
  createEnhancedJiraClient: () => createEnhancedJiraClient,
  createJiraClient: () => createJiraClient,
  deterministicEnricher: () => deterministicEnricher,
  extractDeploymentTargets: () => extractDeploymentTargets,
  extractErrorMessages: () => extractErrorMessages,
  extractExitCodes: () => extractExitCodes,
  extractFailedCommands: () => extractFailedCommands,
  extractPerformanceIssues: () => extractPerformanceIssues,
  extractSecurityIssues: () => extractSecurityIssues,
  extractStackTraces: () => extractStackTraces,
  findErrorAnchors: () => findErrorAnchors,
  markdownToAdf: () => markdownToAdf,
  maskSecrets: () => maskSecrets,
  matchSignature: () => matchSignature,
  parseLogs: () => parseLogs,
  parseSteps: () => parseSteps,
  processFailureEvent: () => processFailureEvent,
  renderBreadcrumb: () => renderBreadcrumb,
  renderDescription: () => renderDescription,
  renderStepOutput: () => renderStepOutput,
  setField: () => setField
});
var init_core = __esm({
  "src/core/index.ts"() {
    "use strict";
    init_pipeline();
    init_types2();
    init_deterministic();
    init_computed();
    init_ai();
    init_renderer();
    init_dedup();
    init_signatures();
    init_secret_mask();
    init_types();
    init_ai2();
    init_log_parser();
    init_jira();
    init_notifications();
    init_self_healing2();
  }
});

// src/azure-devops/index.ts
var tl2 = __toESM(require("azure-pipelines-task-lib/task"), 1);

// src/azure-devops/map-event.ts
var tl = __toESM(require("azure-pipelines-task-lib/task"), 1);
var azdev = __toESM(require("azure-devops-node-api"), 1);
async function mapAzureDevOpsContext(environment) {
  const collectionUri = tl.getInput("teamFoundationCollectionUri") || required("System.CollectionUri");
  const teamProject = tl.getInput("teamProject") || required("System.TeamProject");
  const buildIdInput = tl.getInput("buildId");
  const buildId = Number.parseInt(buildIdInput || required("Build.BuildId"), 10);
  const buildNumber = tl.getInput("buildNumber") || required("Build.BuildNumber");
  const definitionName = tl.getInput("definitionName") || required("Build.DefinitionName");
  const sourceVersion = tl.getInput("sourceVersion") || required("Build.SourceVersion");
  const fullSourceBranch = tl.getInput("sourceBranch") || tl.getVariable("Build.SourceBranch") || "";
  const sourceBranch = fullSourceBranch.replace(/^refs\/heads\//, "");
  const repositoryName = tl.getInput("repositoryName") || required("Build.Repository.Name");
  const repositoryUri = tl.getInput("repositoryUri") || required("Build.Repository.Uri");
  const requestedFor = (tl.getInput("requestedFor") || tl.getVariable("Build.RequestedFor")) ?? "unknown";
  const accessToken = tl.getVariable("System.AccessToken") ?? "";
  const sourceVersionMessage = tl.getInput("sourceVersionMessage") || tl.getVariable("Build.SourceVersionMessage");
  const buildReason = tl.getInput("reason") || tl.getVariable("Build.Reason");
  const buildUri = tl.getVariable("Build.BuildUri");
  const repositoryId = tl.getInput("repositoryId") || tl.getVariable("Build.Repository.ID");
  const repositoryProvider = tl.getInput("repositoryProvider") || tl.getVariable("Build.Repository.Provider");
  const repositoryClean = tl.getInput("repositoryClean") || tl.getVariable("Build.Repository.Clean");
  const repositoryTfvcWorkspace = tl.getInput("repositoryTfvcWorkspace") || tl.getVariable("Build.Repository.Tfvc.Workspace");
  const repositoryGitSubmoduleCheckout = tl.getInput("repositoryGitSubmoduleCheckout") || tl.getVariable("Build.Repository.Git.SubmoduleCheckout");
  const sourceBranchName = tl.getInput("sourceBranchName") || tl.getVariable("Build.SourceBranchName");
  const cronScheduleDisplayName = tl.getInput("cronScheduleDisplayName") || tl.getVariable("Build.CronSchedule.DisplayName");
  const requestedForEmail = tl.getInput("requestedForEmail") || tl.getVariable("Build.RequestedForEmail");
  const requestedForId = tl.getInput("requestedForId") || tl.getVariable("Build.RequestedForId");
  const queuedBy = tl.getInput("queuedBy") || tl.getVariable("Build.QueuedBy");
  const queuedById = tl.getInput("queuedById") || tl.getVariable("Build.QueuedById");
  const stageRequestedBy = tl.getInput("stageRequestedBy") || tl.getVariable("Build.StageRequestedBy");
  const stageRequestedForId = tl.getInput("stageRequestedForId") || tl.getVariable("Build.StageRequestedForId");
  const testResultsDirectory = tl.getInput("testResultsDirectory") || tl.getVariable("Common.TestResultsDirectory");
  const sourceTfvcShelveset = tl.getInput("sourceTfvcShelveset") || tl.getVariable("Build.SourceTfvcShelveset");
  const systemCollectionId = tl.getInput("systemCollectionId") || tl.getVariable("System.CollectionId");
  const systemDefinitionId = tl.getInput("systemDefinitionId") || tl.getVariable("System.DefinitionId");
  const systemTeamProjectId = tl.getInput("systemTeamProjectId") || tl.getVariable("System.TeamProjectId");
  const systemTimelineId = tl.getInput("systemTimelineId") || tl.getVariable("System.TimelineId");
  const systemHostType = tl.getInput("systemHostType") || tl.getVariable("System.HostType");
  const systemJobDisplayName = tl.getInput("systemJobDisplayName") || tl.getVariable("System.JobDisplayName");
  const systemJobId = tl.getInput("systemJobId") || tl.getVariable("System.JobId");
  const systemJobName = tl.getInput("systemJobName") || tl.getVariable("System.JobName");
  const systemPhaseAttempt = tl.getInput("systemPhaseAttempt") || tl.getVariable("System.PhaseAttempt");
  const systemPhaseDisplayName = tl.getInput("systemPhaseDisplayName") || tl.getVariable("System.PhaseDisplayName");
  const systemPhaseName = tl.getInput("systemPhaseName") || tl.getVariable("System.PhaseName");
  const systemPlanId = tl.getInput("systemPlanId") || tl.getVariable("System.PlanId");
  const systemStageAttempt = tl.getInput("systemStageAttempt") || tl.getVariable("System.StageAttempt");
  const systemStageDisplayName = tl.getInput("systemStageDisplayName") || tl.getVariable("System.StageDisplayName");
  const systemStageName = tl.getInput("systemStageName") || tl.getVariable("System.StageName");
  const tfBuild = tl.getInput("tfBuild") || tl.getVariable("TF_BUILD");
  const agentOs = tl.getInput("agentOs") || tl.getVariable("Agent.OS");
  const agentOsArch = tl.getInput("agentOsArchitecture") || tl.getVariable("Agent.OSArchitecture");
  const jobAttempt = tl.getVariable("System.JobAttempt");
  const jobName = tl.getInput("agentJobName") || tl.getVariable("Agent.JobName");
  const agentName = tl.getInput("agentName") || tl.getVariable("Agent.Name");
  const agentMachineName = tl.getInput("agentMachineName") || tl.getVariable("Agent.MachineName");
  const agentId = tl.getInput("agentId") || tl.getVariable("Agent.Id");
  const agentJobStatus = tl.getInput("agentJobStatus") || tl.getVariable("Agent.JobStatus");
  const agentBuildDirectory = tl.getInput("agentBuildDirectory") || tl.getVariable("Agent.BuildDirectory");
  const agentHomeDirectory = tl.getInput("agentHomeDirectory") || tl.getVariable("Agent.HomeDirectory");
  const agentTempDirectory = tl.getInput("agentTempDirectory") || tl.getVariable("Agent.TempDirectory");
  const agentToolsDirectory = tl.getInput("agentToolsDirectory") || tl.getVariable("Agent.ToolsDirectory");
  const agentWorkFolder = tl.getInput("agentWorkFolder") || tl.getVariable("Agent.WorkFolder");
  const agentContainerMapping = tl.getVariable("Agent.ContainerMapping");
  const agentReleaseDirectory = tl.getVariable("Agent.ReleaseDirectory");
  const agentRootDirectory = tl.getVariable("Agent.RootDirectory");
  const definitionVersion = tl.getInput("definitionVersion") || tl.getVariable("Build.DefinitionVersion");
  const sourcesDirectory = tl.getInput("sourcesDirectory") || tl.getVariable("Build.SourcesDirectory");
  const binariesDirectory = tl.getInput("binariesDirectory") || tl.getVariable("Build.BinariesDirectory");
  const environmentName = tl.getInput("environmentName") || tl.getVariable("Environment.Name");
  const environmentId = tl.getInput("environmentId") || tl.getVariable("Environment.Id");
  const environmentResourceName = tl.getInput("environmentResourceName") || tl.getVariable("Environment.ResourceName");
  const environmentResourceId = tl.getInput("environmentResourceId") || tl.getVariable("Environment.ResourceId");
  const strategyName = tl.getInput("strategyName") || tl.getVariable("Strategy.Name");
  const strategyCycleName = tl.getInput("strategyCycleName") || tl.getVariable("Strategy.CycleName");
  const checksStageAttempt = tl.getVariable("Checks.StageAttempt");
  const releaseDeploymentRequestedFor = tl.getVariable("Release.Deployment.RequestedFor");
  const releaseDeploymentRequestedForEmail = tl.getVariable("Release.Deployment.RequestedForEmail");
  const releaseDeploymentId = tl.getVariable("Release.DeploymentID");
  const releaseDefinitionEnvironmentId = tl.getVariable("Release.DefinitionEnvironmentId");
  const releaseDefinitionId = tl.getVariable("Release.DefinitionId");
  const releaseDefinitionName = tl.getVariable("Release.DefinitionName");
  const releaseEnvironmentId = tl.getVariable("Release.EnvironmentId");
  const releaseEnvironmentName = tl.getVariable("Release.EnvironmentName");
  const releasePrimaryArtifactSourceAlias = tl.getVariable("Release.PrimaryArtifactSourceAlias");
  const releaseDescription = tl.getVariable("Release.ReleaseDescription");
  const releaseId = tl.getVariable("Release.ReleaseId");
  const releaseName = tl.getVariable("Release.ReleaseName");
  const releaseUri = tl.getVariable("Release.ReleaseUri");
  const systemDebug = tl.getVariable("System.Debug");
  const systemDefaultWorkingDirectory = tl.getVariable("System.DefaultWorkingDirectory");
  const systemCollectionUri = tl.getVariable("System.CollectionUri") || collectionUri;
  const systemTeamFoundationCollectionUri = tl.getVariable("System.TeamFoundationCollectionUri");
  const pipelineWorkspace = tl.getVariable("Pipeline.Workspace");
  const systemWorkFolder = tl.getVariable("System.WorkFolder");
  const releaseArtifacts = {};
  const allVars = tl.getVariables();
  for (const v of allVars) {
    if (v.name.startsWith("Release.Artifacts.")) {
      releaseArtifacts[v.name] = v.value;
    }
  }
  const prIsFork = tl.getInput("prIsFork") || tl.getVariable("System.PullRequest.IsFork");
  const prId = tl.getInput("prId") || tl.getVariable("System.PullRequest.PullRequestId");
  const prNumber = tl.getInput("prNumber") || tl.getVariable("System.PullRequest.PullRequestNumber");
  const prTargetBranchName = tl.getInput("prTargetBranchName") || tl.getVariable("System.PullRequest.targetBranchName");
  const prSourceBranch = tl.getInput("prSourceBranch") || tl.getVariable("System.PullRequest.SourceBranch");
  const prSourceCommit = tl.getInput("prSourceCommitId") || tl.getVariable("System.PullRequest.SourceCommitId");
  const prSourceRepoUri = tl.getInput("prSourceRepoUri") || tl.getVariable("System.PullRequest.SourceRepositoryUri");
  const prTargetBranch = tl.getInput("prTargetBranch") || tl.getVariable("System.PullRequest.TargetBranch");
  const artifactStagingDirectory = tl.getInput("artifactStagingDirectory") || tl.getVariable("Build.ArtifactStagingDirectory") || tl.getVariable("Build.StagingDirectory");
  const stagingDirectory = tl.getInput("stagingDirectory") || tl.getVariable("Build.StagingDirectory");
  const containerId = tl.getInput("containerId") || tl.getVariable("Build.ContainerId");
  const repositoryLocalPath = tl.getInput("repositoryLocalPath") || tl.getVariable("Build.Repository.LocalPath");
  const triggeredByBuildId = tl.getInput("triggeredByBuildId") || tl.getVariable("Build.TriggeredBy.BuildId");
  const triggeredByDefinitionId = tl.getInput("triggeredByDefinitionId") || tl.getVariable("Build.TriggeredBy.DefinitionId");
  const triggeredByDefinitionName = tl.getInput("triggeredByDefinitionName") || tl.getVariable("Build.TriggeredBy.DefinitionName");
  const triggeredByBuildNumber = tl.getInput("triggeredByBuildNumber") || tl.getVariable("Build.TriggeredBy.BuildNumber");
  const triggeredByProjectId = tl.getInput("triggeredByProjectId") || tl.getVariable("Build.TriggeredBy.ProjectID");
  const handler = azdev.getPersonalAccessTokenHandler(accessToken);
  const connection = new azdev.WebApi(collectionUri, handler);
  const buildApi = await connection.getBuildApi();
  const build = await buildApi.getBuild(teamProject, buildId);
  const timeline = await buildApi.getBuildTimeline(teamProject, buildId);
  const failedRecord = timeline?.records?.find(
    (r) => r.result === 2 && r.type === "Task"
  );
  const failedJob = timeline?.records?.find(
    (r) => r.type === "Job" && r.result === 2
  );
  let logs = "";
  let logsTruncated = false;
  if (failedRecord?.log?.id) {
    try {
      const lines = await buildApi.getBuildLogLines(
        teamProject,
        buildId,
        failedRecord.log.id
      );
      if (lines.length > 500) {
        logs = lines.slice(-500).join("\n");
        logsTruncated = true;
      } else {
        logs = lines.join("\n");
      }
    } catch {
      logs = "(failed to fetch task logs \u2014 check System.AccessToken permissions)";
    }
  }
  const definitionUrl = `${collectionUri}${teamProject}/_build?definitionId=${systemDefinitionId}`;
  const runUrl = buildUri || `${collectionUri}${teamProject}/_build/results?buildId=${buildId}`;
  const commitUrl = `${repositoryUri}/commit/${sourceVersion}`;
  const startedAt = (build.startTime ?? /* @__PURE__ */ new Date()).toISOString();
  const failedAt = (build.finishTime ?? /* @__PURE__ */ new Date()).toISOString();
  const durationMs = build.startTime && build.finishTime ? build.finishTime.getTime() - build.startTime.getTime() : void 0;
  const isPullRequest = prId || prNumber;
  const pullRequestNumber = prNumber || prId;
  const pullRequestBranch = prSourceBranch?.replace("refs/heads/", "");
  const finalBranch = pullRequestBranch || sourceBranch;
  const event = {
    source: "azure-devops",
    startedAt,
    failedAt,
    ...durationMs !== void 0 ? { durationMs } : {},
    pipeline: {
      name: definitionName,
      url: definitionUrl,
      runUrl,
      runId: String(buildId),
      runNumber: Number.parseInt(buildNumber, 10) || 0,
      ...failedJob?.name ? { stage: failedJob.name } : {},
      ...failedRecord?.name ? { task: failedRecord.name, step: failedRecord.name } : {},
      ...failedJob?.workerName ? { runnerType: failedJob.workerName } : {},
      ...agentOs ? { runnerOs: agentOs } : {},
      ...agentOsArch ? { runnerArch: agentOsArch } : {},
      ...jobAttempt ? { runAttempt: parseInt(jobAttempt, 10), retryCount: Math.max(0, parseInt(jobAttempt, 10) - 1) } : {},
      ...jobName ? { job: jobName, jobName } : {},
      ...agentName ? { runnerName: agentName } : {},
      ...agentMachineName ? { agentMachineName } : {},
      ...definitionVersion ? { definitionVersion } : {},
      ...systemDefinitionId ? { definitionId: systemDefinitionId } : {},
      ...systemTeamProjectId ? { teamProjectId: systemTeamProjectId } : {},
      ...sourcesDirectory ? { sourcesDirectory } : {},
      ...binariesDirectory ? { binariesDirectory } : {},
      ...artifactStagingDirectory ? { artifactStagingDirectory } : {},
      ...containerId ? { containerId } : {},
      ...repositoryLocalPath ? { repositoryLocalPath } : {},
      ...build.queue?.name ? { agentPool: build.queue.name } : {},
      ...agentId ? { agentId } : {},
      ...agentJobStatus ? { agentJobStatus } : {},
      ...agentBuildDirectory ? { agentBuildDirectory } : {},
      ...agentHomeDirectory ? { agentHomeDirectory } : {},
      ...agentTempDirectory ? { agentTempDirectory } : {},
      ...agentToolsDirectory ? { agentToolsDirectory } : {},
      ...agentWorkFolder ? { agentWorkFolder } : {},
      ...stagingDirectory ? { stagingDirectory } : {},
      ...testResultsDirectory ? { testResultsDirectory } : {},
      ...checksStageAttempt ? { checksStageAttempt } : {},
      ...cronScheduleDisplayName ? { cronScheduleDisplayName } : {},
      ...stageRequestedBy ? { stageRequestedBy } : {},
      ...stageRequestedForId ? { stageRequestedForId } : {},
      ...sourceTfvcShelveset ? { sourceTfvcShelveset } : {},
      ...triggeredByBuildId ? { triggeredByBuildId } : {},
      ...triggeredByDefinitionId ? { triggeredByDefinitionId } : {},
      ...triggeredByDefinitionName ? { triggeredByDefinitionName } : {},
      ...triggeredByBuildNumber ? { triggeredByBuildNumber } : {},
      ...triggeredByProjectId ? { triggeredByProjectId } : {},
      ...environmentId ? { environmentId } : {},
      ...environmentResourceName ? { environmentResourceName } : {},
      ...environmentResourceId ? { environmentResourceId } : {},
      ...strategyName ? { strategyName } : {},
      ...strategyCycleName ? { strategyCycleName } : {},
      ...systemWorkFolder ? { systemWorkFolder } : {},
      ...sourceBranchName ? { sourceBranchName } : {},
      ...fullSourceBranch ? { fullSourceBranch } : {},
      ...systemCollectionId ? { systemCollectionId } : {},
      ...systemHostType ? { systemHostType } : {},
      ...systemJobDisplayName ? { systemJobDisplayName } : {},
      ...systemJobId ? { systemJobId } : {},
      ...systemJobName ? { systemJobName } : {},
      ...systemPhaseAttempt ? { systemPhaseAttempt } : {},
      ...systemPhaseDisplayName ? { systemPhaseDisplayName } : {},
      ...systemPhaseName ? { systemPhaseName } : {},
      ...systemPlanId ? { systemPlanId } : {},
      ...systemTimelineId ? { systemTimelineId } : {},
      ...systemStageAttempt ? { systemStageAttempt } : {},
      ...systemStageDisplayName ? { systemStageDisplayName } : {},
      ...systemStageName ? { systemStageName } : {},
      ...systemCollectionUri ? { systemCollectionUri } : {},
      ...systemTeamFoundationCollectionUri ? { systemTeamFoundationCollectionUri } : {},
      ...systemDebug ? { systemDebug } : {},
      ...systemDefaultWorkingDirectory ? { systemDefaultWorkingDirectory } : {},
      ...pipelineWorkspace ? { pipelineWorkspace } : {},
      ...tfBuild ? { tfBuild } : {},
      ...agentContainerMapping ? { agentContainerMapping } : {},
      ...agentReleaseDirectory ? { agentReleaseDirectory } : {},
      ...agentRootDirectory ? { agentRootDirectory } : {},
      ...releaseDeploymentRequestedFor ? { releaseDeploymentRequestedFor } : {},
      ...releaseDeploymentRequestedForEmail ? { releaseDeploymentRequestedForEmail } : {},
      ...releaseDeploymentId ? { releaseDeploymentId } : {},
      ...releaseDefinitionEnvironmentId ? { releaseDefinitionEnvironmentId } : {},
      ...releaseDefinitionId ? { releaseDefinitionId } : {},
      ...releaseDefinitionName ? { releaseDefinitionName } : {},
      ...releaseEnvironmentId ? { releaseEnvironmentId } : {},
      ...releaseEnvironmentName ? { releaseEnvironmentName } : {},
      ...releasePrimaryArtifactSourceAlias ? { releasePrimaryArtifactSourceAlias } : {},
      ...releaseDescription ? { releaseDescription } : {},
      ...releaseId ? { releaseId } : {},
      ...releaseName ? { releaseName } : {},
      ...releaseUri ? { releaseUri } : {},
      releaseArtifacts,
      ...buildNumber ? { buildNumber } : {},
      ...buildUri ? { buildUri } : {},
      ...repositoryClean ? { repositoryClean } : {},
      ...repositoryGitSubmoduleCheckout ? { repositoryGitSubmoduleCheckout } : {},
      ...containerId ? { containerId } : {},
      ...prIsFork ? { prIsFork } : {},
      ...prId ? { prId } : {},
      ...prNumber ? { prNumber } : {},
      ...prTargetBranchName ? { prTargetBranchName } : {},
      ...prSourceBranch ? { prSourceBranch } : {},
      ...prSourceCommit ? { prSourceCommitId: prSourceCommit } : {},
      ...prSourceRepoUri ? { prSourceRepoUri } : {},
      ...prTargetBranch ? { prTargetBranch } : {},
      ...requestedFor ? { requestedFor } : {},
      ...requestedForEmail ? { requestedForEmail } : {},
      ...requestedForId ? { requestedForId } : {},
      ...queuedBy ? { queuedBy } : {},
      ...queuedById ? { queuedById } : {},
      ...sourceBranchName ? { sourceBranchName } : {},
      ...sourceVersionMessage ? { sourceVersionMessage } : {},
      ...repositoryId ? { repositoryId } : {},
      ...repositoryProvider ? { repositoryProvider } : {},
      ...repositoryUri ? { repositoryUri } : {},
      ...testResultsDirectory ? { testResultsDirectory } : {}
    },
    repository: {
      owner: teamProject,
      name: repositoryName,
      url: repositoryUri,
      ...repositoryId ? { id: repositoryId } : {},
      ...repositoryProvider ? { provider: repositoryProvider } : {},
      ...repositoryClean ? { clean: repositoryClean } : {},
      ...repositoryTfvcWorkspace ? { tfvcWorkspace: repositoryTfvcWorkspace } : {},
      ...repositoryGitSubmoduleCheckout ? { gitSubmoduleCheckout: repositoryGitSubmoduleCheckout } : {}
    },
    commit: {
      sha: sourceVersion,
      url: commitUrl,
      ...sourceVersionMessage ? { message: sourceVersionMessage } : {},
      ...build.requestedFor?.displayName ? { author: build.requestedFor.displayName } : {},
      ...requestedForEmail ? { authorEmail: requestedForEmail } : {},
      ...requestedForId ? { requestedForId } : {},
      ...queuedBy ? { author: requestedFor || queuedBy, queuedBy } : {},
      ...queuedById ? { queuedById } : {}
    },
    branch: finalBranch,
    ...environment || environmentName ? { environment: environment || environmentName } : {},
    triggeredBy: queuedBy || requestedFor,
    eventName: buildReason || void 0,
    metadata: {},
    explicitFields: [],
    failure: {
      ...failedRecord?.name ? { failedStep: failedRecord.name } : {},
      ...failedRecord?.errorCount !== void 0 ? { errorMessage: `Task '${failedRecord.name}' reported ${failedRecord.errorCount} error(s).` } : {},
      logs,
      logsTruncated
    }
  };
  if (isPullRequest && pullRequestNumber) {
    event.pullRequest = {
      number: parseInt(pullRequestNumber),
      url: prSourceRepoUri || `${collectionUri}${teamProject}/_git/${repositoryName}/pullrequest/${pullRequestNumber}`
    };
  }
  return event;
}
function required(name) {
  const value = tl.getVariable(name);
  if (!value) throw new Error(`Required ADO variable missing: ${name}`);
  return value;
}

// src/azure-devops/index.ts
async function run() {
  try {
    const { processFailureEvent: processFailureEvent2, PipelineIQConfigSchema: PipelineIQConfigSchema2, aiEnricher: aiEnricher2 } = await Promise.resolve().then(() => (init_core(), core_exports));
    const config = readConfig(PipelineIQConfigSchema2);
    const environment = tl2.getInput("environment") || void 0;
    const event = await mapAzureDevOpsContext(environment);
    const result = await processFailureEvent2(event, config, {
      extraEnrichers: [aiEnricher2]
    });
    const issueKey = result.action === "skipped" ? "" : result.issueKey;
    tl2.setVariable("PipelineIQ.IssueKey", issueKey);
    tl2.setVariable("PipelineIQ.Action", result.action);
    if (result.selfHealing) {
      tl2.setVariable("PipelineIQ.SelfHealingPRUrl", result.selfHealing.prUrl ?? "");
      const status = result.selfHealing.dryRun ? "dry-run" : result.selfHealing.success ? "success" : result.selfHealing.attempted ? "failed" : "skipped";
      tl2.setVariable("PipelineIQ.SelfHealingStatus", status);
      const filesChanged = result.selfHealing.fix?.changes?.map((c) => c.filePath) ?? [];
      tl2.setVariable("PipelineIQ.SelfHealingFilesChanged", filesChanged.join(","));
      if (result.selfHealing.prUrl) {
        console.log(`PipelineIQ Self-Healing: PR created at ${result.selfHealing.prUrl}`);
      }
      if (result.selfHealing.fix) {
        const fix = result.selfHealing.fix;
        console.log(`PipelineIQ Proposed Changes:`);
        for (const change of fix.changes) {
          console.log(`  - [${change.action.toUpperCase()}] ${change.filePath}: ${change.changeDescription}`);
        }
      }
    }
    tl2.setResult(
      tl2.TaskResult.Succeeded,
      `PipelineIQ: ${result.action} ${issueKey || "(no issue)"}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tl2.setResult(tl2.TaskResult.Failed, `PipelineIQ failed: ${message}`);
  }
}
function readConfig(PipelineIQConfigSchema2) {
  const aiMode = tl2.getInput("aiMode") || "disabled";
  const raw = {
    jira: {
      type: tl2.getInput("jiraType") === "server" ? "server" : "cloud",
      baseUrl: tl2.getInput("jiraUrl"),
      email: tl2.getInput("jiraEmail") || "",
      apiToken: tl2.getInput("jiraToken") || "",
      username: tl2.getInput("jiraUsername") || void 0,
      password: tl2.getInput("jiraPassword") || void 0,
      accessToken: tl2.getInput("jiraAccessToken") || void 0,
      strictGDPR: tl2.getBoolInput("jiraStrictGDPR")
    },
    jiraProject: tl2.getInput("jiraProject", true),
    issueType: tl2.getInput("issueType") || "Bug",
    defaultAssignee: tl2.getInput("defaultAssignee") || void 0,
    ai: {
      mode: aiMode,
      ...tl2.getInput("aiProvider") ? { provider: tl2.getInput("aiProvider") } : {},
      ...tl2.getInput("aiApiKey") ? { apiKey: tl2.getInput("aiApiKey") } : {},
      ...tl2.getInput("aiModel") ? { model: tl2.getInput("aiModel") } : {},
      ...tl2.getInput("aiTemperature") ? { temperature: Number.parseFloat(tl2.getInput("aiTemperature")) } : {},
      ...tl2.getInput("aiMaxTokens") ? { maxLogTokens: Number.parseInt(tl2.getInput("aiMaxTokens"), 10) } : {},
      ...tl2.getInput("aiConfidence") ? { minConfidence: Number.parseFloat(tl2.getInput("aiConfidence")) } : {}
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(tl2.getInput("dedupWindowHours") || "24", 10)
    },
    // Self-healing configuration
    ...tl2.getBoolInput("selfHealing") ? {
      selfHealing: {
        enabled: true,
        dryRun: tl2.getBoolInput("selfHealingDryRun"),
        minConfidence: Number.parseFloat(tl2.getInput("selfHealingConfidence") || "0.8"),
        maxFilesChanged: Number.parseInt(tl2.getInput("selfHealingMaxFiles") || "10", 10),
        maxLinesChanged: Number.parseInt(tl2.getInput("selfHealingMaxLines") || "200", 10),
        enableGuardrails: tl2.getBoolInput("selfHealingGuardrails"),
        draftPr: tl2.getBoolInput("selfHealingDraft"),
        // ADO PR creation authenticates with the build service identity. The engine
        // resolves the token from SYSTEM_ACCESSTOKEN — do NOT pass the Jira API token
        // here (it cannot authenticate the Azure DevOps Git API).
        platform: "azure-devops",
        ...tl2.getInput("selfHealingReviewers") ? {
          reviewers: tl2.getInput("selfHealingReviewers").split(",").map((s) => s.trim())
        } : {},
        ...tl2.getInput("selfHealingLabels") ? {
          prLabels: tl2.getInput("selfHealingLabels").split(",").map((s) => s.trim())
        } : {},
        ...tl2.getInput("selfHealingCategories") ? {
          allowedCategories: tl2.getInput("selfHealingCategories").split(",").map((s) => s.trim())
        } : {}
      }
    } : {}
  };
  return PipelineIQConfigSchema2.parse(raw);
}
void run();
