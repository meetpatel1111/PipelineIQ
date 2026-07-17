import type { FailureEvent, JiraTicketSpec } from "./types/index.js";
import type { ComputedMetrics } from "./types/index.js";
import { maskSecrets } from "./secret-mask.js";
import { buildSmartExcerpt } from "./log-parser/smart-excerpt.js";

/**
 * Build the markdown ticket description from the event + already-populated fields.
 * Called late in the pipeline, after all enrichers have run.
 */
export function renderDescription(
  event: FailureEvent,
  fields: Partial<JiraTicketSpec>,
  logExcerptLines: number,
  maskLogs: boolean,
  displayMetadata?: string[],
  history?: {
    similarCount: number;
    isFlaky: boolean;
    previousIncidentKeys: string[];
    trend?: "improving" | "worsening" | "stable" | undefined;
    relatedKeys: string[];
  },
  metrics?: ComputedMetrics,
): string {
  const out: string[] = [];

  out.push("## PipelineIQ Failure Report");
  out.push("");

  // Failure summary section
  const rca = fields.rca;
  const remediation = fields.remediationSteps;

  out.push("### Failure Summary");
  let summary = fields.summary ?? "Pipeline failure detected.";
  if (fields.customFields?.["_matchConfidence"] !== undefined) {
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

  // Reliability Context (Historical)
  if (history) {
    out.push("### Reliability Context");
    
    let trendIcon = "➡️";
    if (history.trend === "worsening") trendIcon = "📈";
    if (history.trend === "improving") trendIcon = "📉";

    const flakyMsg = history.isFlaky ? " ⚠️ **Detected as Flaky**" : "";
    
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
      if (metrics.mttrHours !== undefined && metrics.sampleSize > 0) {
        out.push(`- **MTTR:** ${metrics.mttrHours}h avg (${metrics.sampleSize} incidents)`);
      }
      if (metrics.blastRadius !== undefined) {
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

  // Define all available fields for the metadata table
  const allFields = [
    { key: "source", label: "Source", value: event.source },
    {
      key: "pipeline",
      label: "Pipeline",
      value: `[${event.pipeline.name}](${event.pipeline.url})`,
    },
    {
      key: "runUrl",
      label: "Pipeline Run",
      value: event.pipeline.runUrl ? `[View Execution](${event.pipeline.runUrl})` : "",
    },
    {
      key: "repository",
      label: "Repository",
      value: `[${event.repository.owner}/${event.repository.name}](${event.repository.url})`,
    },
    {
      key: "pullRequest",
      label: "Pull Request",
      value: event.pullRequest
        ? `[#${event.pullRequest.number} ${event.pullRequest.title}](${event.pullRequest.url})`
        : "",
    },
    { key: "branch", label: "Branch", value: event.branch },
    {
      key: "commit",
      label: "Commit",
      value: `[\`${event.commit.sha.slice(0, 7)}\`](${event.commit.url})`,
    },
    {
      key: "commitMessage",
      label: "Commit Message",
      value: truncatedMsg,
    },
    { key: "environment", label: "Environment", value: event.environment ?? "" },
    { key: "step", label: "Failed Step", value: event.pipeline.step ?? "" },
    { key: "stage", label: "Failed Stage", value: event.pipeline.stage ?? "" },
    { key: "exitCode", label: "Exit Code", value: event.failure.exitCode?.toString() ?? "" },
    {
      key: "retryCount",
      label: "Retry Count",
      value: event.pipeline.retryCount?.toString() ?? "",
    },
    {
      key: "runAttempt",
      label: "Run Attempt",
      value: event.pipeline.runAttempt?.toString() ?? "",
    },
    { key: "job", label: "Job", value: event.pipeline.job ?? "" },
    { key: "jobName", label: "Job Name", value: event.pipeline.jobName ?? "" },
    { key: "eventName", label: "Event Name", value: event.eventName ?? "" },
    { key: "runnerOs", label: "Runner OS", value: event.pipeline.runnerOs ?? "" },
    { key: "runnerArch", label: "Runner Arch", value: event.pipeline.runnerArch ?? "" },
    { key: "runnerType", label: "Runner Type", value: event.pipeline.runnerType ?? "" },
    { key: "runnerEnvironment", label: "Runner Environment", value: event.pipeline.runnerEnvironment ?? "" },
    { key: "runnerDebug", label: "Runner Debug", value: event.pipeline.runnerDebug !== undefined ? String(event.pipeline.runnerDebug) : "" },
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
    { key: "refProtected", label: "Ref Protected", value: event.pipeline.refProtected !== undefined ? String(event.pipeline.refProtected) : "" },
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
      value: event.durationMs ? `${(event.durationMs / 1000).toFixed(1)}s` : "",
    },
    {
      key: "startedAt",
      label: "Started At",
      value: event.startedAt ? new Date(event.startedAt).toUTCString() : "",
    },
  ];

  // Define which fields are considered "Core" (Always show if non-empty)
  const CORE_FIELDS = new Set([
    "pipeline",
    "repository",
    "branch",
    "commit",
    "commitmessage",
    "step",
    "environment",
    "source",
    "triggeredby",
  ]);

  // Add custom user-provided metadata to the pool of available fields
  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, " ");
      allFields.push({ key, label: displayKey, value });
    }
  }

  // Add dynamic release artifacts if they exist
  if (event.pipeline.releaseArtifacts) {
    for (const [key, value] of Object.entries(event.pipeline.releaseArtifacts)) {
      const displayKey = key.replace(/^Release\.Artifacts\./, "Artifact: ");
      allFields.push({ key, label: displayKey, value: String(value) });
    }
  }

  // Determine which fields to display
  let fieldsToDisplay = [];

  if (displayMetadata && displayMetadata.length > 0) {
    // Whitelist mode: show ONLY what the user explicitly asked for in displayMetadata
    const whitelist = new Set(displayMetadata.map((k) => k.toLowerCase()));
    fieldsToDisplay = allFields.filter((f) => whitelist.has(f.key.toLowerCase()));
  } else {
    // Smart Default mode:
    // 1. Show Core fields (if they have a value)
    // 2. Show fields the user explicitly passed as CLI flags
    // 3. Show any custom metadata passed via --meta
    const explicitSet = new Set((event.explicitFields || []).map((f) => f.toLowerCase()));

    fieldsToDisplay = allFields.filter((f) => {
      if (f.value === "") return false;

      const isCore = CORE_FIELDS.has(f.key.toLowerCase());
      const isExplicit = explicitSet.has(f.key.toLowerCase());
      const isCustomMeta = event.metadata && event.metadata[f.key] !== undefined;

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

  // Log excerpt — step-aware smart excerpt + secret-masked
  if (event.failure.logs) {
    const cleaned = maskLogs ? maskSecrets(event.failure.logs) : event.failure.logs;
    const { text, failingStep } = buildSmartExcerpt(cleaned, event.source, logExcerptLines);
    const logHeader = failingStep ? `### Failing Step: ${failingStep}` : "### Relevant Logs";
    out.push(logHeader);
    if (event.failure.logsTruncated) {
      out.push("> Logs were truncated by the adapter — see attachment for full output.");
    }
    out.push("```log");
    out.push(text);
    out.push("```");
    out.push("");
  }

  // Links
  out.push("### Links");
  // Pipeline/Workflow URL
  out.push(`- [Pipeline](${event.pipeline.url})`);
  if (event.pipeline.runUrl) {
    out.push(`- [Pipeline Run](${event.pipeline.runUrl})`);
  }
  // Repository URL
  out.push(`- [Repository](${event.repository.url})`);
  // Commit URL
  out.push(`- [Commit](${event.commit.url})`);
  // Pull Request URL (if available)
  if ((event as any).pullRequest) {
    out.push(`- [Pull Request #${(event as any).pullRequest.number}](${(event as any).pullRequest.url})`);
  }
  // Additional external links from fields
  const externalLinks = fields.externalLinks as any[] || [];
  const renderedTitles = new Set(["Pipeline", "Pipeline Run", "Repository", "Commit"]);
  for (const link of externalLinks) {
    if (
      renderedTitles.has(link.title) ||
      link.title.startsWith("Commit ") ||
      link.title.startsWith("PR #") ||
      link.title.startsWith("Pull Request #")
    ) {
      continue;
    }
    out.push(`- [${link.title}](${link.url})`);
  }
  out.push("");

  // Provenance footer — small, builds trust about which stage produced what.
  if (fields.provenance && Object.keys(fields.provenance).length > 0) {
    out.push("---");
    out.push("");
    out.push(
      `<sub>Generated by PipelineIQ · signature \`${fields.dedupSignature ?? "?"}\`</sub>`,
    );
  }

  return out.join("\n");
}
