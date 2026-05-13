import type { FailureEvent } from "../core/index.js";
import * as tl from "azure-pipelines-task-lib/task";
import * as azdev from "azure-devops-node-api";

/**
 * Translate the Azure DevOps task runtime context into a normalized FailureEvent.
 *
 * The task runs *inside* the failing pipeline (with `condition: failed()`), so
 * we have access to all the predefined Build.* / System.* variables. We use the
 * azure-devops-node-api client to fetch the build timeline and identify the
 * failed task, then pull its logs.
 */
export async function mapAzureDevOpsContext(
  environment: string | undefined,
): Promise<FailureEvent> {
  const collectionUri = tl.getInput("teamFoundationCollectionUri") || required("System.CollectionUri");
  const teamProject = tl.getInput("teamProject") || required("System.TeamProject");
  const buildIdInput = tl.getInput("buildId");
  const buildId = Number.parseInt(buildIdInput || required("Build.BuildId"), 10);
  const buildNumber = tl.getInput("buildNumber") || required("Build.BuildNumber");
  const definitionName = tl.getInput("definitionName") || required("Build.DefinitionName");
  const sourceVersion = tl.getInput("sourceVersion") || required("Build.SourceVersion");
  const sourceBranch = (tl.getInput("sourceBranch") || required("Build.SourceBranch")).replace(/^refs\/heads\//, "");
  const repositoryName = tl.getInput("repositoryName") || required("Build.Repository.Name");
  const repositoryUri = tl.getInput("repositoryUri") || required("Build.Repository.Uri");
  const requestedFor = (tl.getInput("requestedFor") || tl.getVariable("Build.RequestedFor")) ?? "unknown";
  const accessToken = tl.getVariable("System.AccessToken") ?? "";
  
  // Additional Azure DevOps variables
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
  const systemCollectionId = tl.getInput("systemCollectionId") || tl.getVariable("System.CollectionId");
  const systemDefinitionId = tl.getInput("systemDefinitionId") || tl.getVariable("System.DefinitionId");
  const systemTeamProjectId = tl.getInput("systemTeamProjectId") || tl.getVariable("System.TeamProjectId");
  const systemTimelineId = tl.getInput("systemTimelineId") || tl.getVariable("System.TimelineId");
  const systemHostType = tl.getInput("systemHostType") || tl.getVariable("System.HostType");
  const systemJobDisplayName = tl.getInput("systemJobDisplayName") || tl.getVariable("System.JobDisplayName");
  const systemJobId = tl.getInput("systemJobId") || tl.getVariable("System.JobId");
  const systemPhaseAttempt = tl.getInput("systemPhaseAttempt") || tl.getVariable("System.PhaseAttempt");
  const systemPhaseDisplayName = tl.getInput("systemPhaseDisplayName") || tl.getVariable("System.PhaseDisplayName");
  const systemPhaseName = tl.getInput("systemPhaseName") || tl.getVariable("System.PhaseName");
  const systemPlanId = tl.getInput("systemPlanId") || tl.getVariable("System.PlanId");
  const systemStageAttempt = tl.getInput("systemStageAttempt") || tl.getVariable("System.StageAttempt");
  const systemStageDisplayName = tl.getInput("systemStageDisplayName") || tl.getVariable("System.StageDisplayName");
  const systemStageName = tl.getInput("systemStageName") || tl.getVariable("System.StageName");
  const tfBuild = tl.getInput("tfBuild") || tl.getVariable("TF_BUILD");
  
  // Environment variables (deployment jobs)
  const environmentName = tl.getInput("environmentName") || tl.getVariable("Environment.Name");
  const environmentId = tl.getInput("environmentId") || tl.getVariable("Environment.Id");
  const environmentResourceName = tl.getInput("environmentResourceName") || tl.getVariable("Environment.ResourceName");
  const environmentResourceId = tl.getInput("environmentResourceId") || tl.getVariable("Environment.ResourceId");
  const strategyName = tl.getInput("strategyName") || tl.getVariable("Strategy.Name");
  const strategyCycleName = tl.getInput("strategyCycleName") || tl.getVariable("Strategy.CycleName");
  
  // Pull Request variables
  const prIsFork = tl.getInput("prIsFork") || tl.getVariable("System.PullRequest.IsFork");
  const prId = tl.getInput("prId") || tl.getVariable("System.PullRequest.PullRequestId");
  const prNumber = tl.getInput("prNumber") || tl.getVariable("System.PullRequest.PullRequestNumber");
  const prTargetBranchName = tl.getInput("prTargetBranchName") || tl.getVariable("System.PullRequest.targetBranchName");
  const prSourceBranch = tl.getInput("prSourceBranch") || tl.getVariable("System.PullRequest.SourceBranch");
  const prSourceCommit = tl.getInput("prSourceCommitId") || tl.getVariable("System.PullRequest.SourceCommitId");
  const prSourceRepoUri = tl.getInput("prSourceRepoUri") || tl.getVariable("System.PullRequest.SourceRepositoryUri");
  const prTargetBranch = tl.getInput("prTargetBranch") || tl.getVariable("System.PullRequest.TargetBranch");

  // Diagnostic variables
  const agentOs = tl.getInput("agentOs") || tl.getVariable("Agent.OS");
  const agentArch = tl.getInput("agentOsArchitecture") || tl.getVariable("Agent.OSArchitecture");
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
  const definitionVersion = tl.getInput("definitionVersion") || tl.getVariable("Build.DefinitionVersion");
  const sourcesDirectory = tl.getInput("sourcesDirectory") || tl.getVariable("Build.SourcesDirectory");
  const binariesDirectory = tl.getInput("binariesDirectory") || tl.getVariable("Build.BinariesDirectory");
  const artifactStagingDirectory = tl.getInput("artifactStagingDirectory") || tl.getVariable("Build.ArtifactStagingDirectory") || tl.getVariable("Build.StagingDirectory");
  const stagingDirectory = tl.getInput("stagingDirectory") || tl.getVariable("Build.StagingDirectory");
  const containerId = tl.getInput("containerId") || tl.getVariable("Build.ContainerId");
  const repositoryLocalPath = tl.getInput("repositoryLocalPath") || tl.getVariable("Build.Repository.LocalPath");
  const requestedForEmail = tl.getInput("requestedForEmail") || tl.getVariable("Build.RequestedForEmail");
  const requestedForId = tl.getInput("requestedForId") || tl.getVariable("Build.RequestedForId");
  const queuedBy = tl.getInput("queuedBy") || tl.getVariable("Build.QueuedBy");
  const queuedById = tl.getInput("queuedById") || tl.getVariable("Build.QueuedById");
  const stageRequestedBy = tl.getInput("stageRequestedBy") || tl.getVariable("Build.StageRequestedBy");
  const stageRequestedForId = tl.getInput("stageRequestedForId") || tl.getVariable("Build.StageRequestedForId");
  const testResultsDirectory = tl.getInput("testResultsDirectory") || tl.getVariable("Common.TestResultsDirectory");
  const sourceTfvcShelveset = tl.getInput("sourceTfvcShelveset") || tl.getVariable("Build.SourceTfvcShelveset");

  // Triggering information
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
    (r) => r.result === 2 /* TaskResult.Failed */ && r.type === "Task",
  );
  const failedJob = timeline?.records?.find(
    (r) => r.type === "Job" && r.result === 2,
  );

  let logs = "";
  let logsTruncated = false;
  if (failedRecord?.log?.id) {
    try {
      const lines = await buildApi.getBuildLogLines(
        teamProject,
        buildId,
        failedRecord.log.id,
      );
      if (lines.length > 500) {
        logs = lines.slice(-500).join("\n");
        logsTruncated = true;
      } else {
        logs = lines.join("\n");
      }
    } catch {
      logs = "(failed to fetch task logs — check System.AccessToken permissions)";
    }
  }

  const pipelineUrl = buildUri || `${collectionUri}${teamProject}/_build/results?buildId=${buildId}`;
  const commitUrl = `${repositoryUri}/commit/${sourceVersion}`;

  const startedAt = (build.startTime ?? new Date()).toISOString();
  const failedAt = (build.finishTime ?? new Date()).toISOString();
  const durationMs =
    build.startTime && build.finishTime
      ? build.finishTime.getTime() - build.startTime.getTime()
      : undefined;

  // Pull request information
  const isPullRequest = prId || prNumber;
  const pullRequestNumber = prNumber || prId;
  const pullRequestBranch = prSourceBranch?.replace('refs/heads/', '');
  const finalBranch = pullRequestBranch || sourceBranch;

  const event: FailureEvent = {
    source: "azure-devops",
    startedAt,
    failedAt,
    ...(durationMs !== undefined ? { durationMs } : {}),
    pipeline: {
      name: definitionName,
      url: pipelineUrl,
      runId: String(buildId),
      runNumber: Number.parseInt(buildNumber, 10) || 0,
      ...(failedJob?.name ? { stage: failedJob.name } : {}),
      ...(failedRecord?.name ? { task: failedRecord.name, step: failedRecord.name } : {}),
      ...(failedJob?.workerName ? { runnerType: failedJob.workerName } : {}),
      ...(agentOs ? { runnerOs: agentOs } : {}),
      ...(agentArch ? { runnerArch: agentArch } : {}),
      ...(jobAttempt ? { runAttempt: parseInt(jobAttempt, 10), retryCount: Math.max(0, parseInt(jobAttempt, 10) - 1) } : {}),
      ...(jobName ? { job: jobName, jobName: jobName } : {}),
      ...(agentName ? { runnerName: agentName } : {}),
      ...(agentMachineName ? { agentMachineName: agentMachineName } : {}),
      ...(definitionVersion ? { definitionVersion } : {}),
      ...(systemDefinitionId ? { definitionId: systemDefinitionId } : {}),
      ...(systemTeamProjectId ? { teamProjectId: systemTeamProjectId } : {}),
      ...(sourcesDirectory ? { sourcesDirectory } : {}),
      ...(binariesDirectory ? { binariesDirectory } : {}),
      ...(artifactStagingDirectory ? { artifactStagingDirectory } : {}),
      ...(containerId ? { containerId } : {}),
      ...(repositoryLocalPath ? { repositoryLocalPath } : {}),
      ...(build.queue?.name ? { agentPool: build.queue.name } : {}),
      ...(agentId ? { agentId } : {}),
      ...(agentJobStatus ? { agentJobStatus } : {}),
      ...(agentBuildDirectory ? { agentBuildDirectory } : {}),
      ...(agentHomeDirectory ? { agentHomeDirectory } : {}),
      ...(agentTempDirectory ? { agentTempDirectory } : {}),
      ...(agentToolsDirectory ? { agentToolsDirectory } : {}),
      ...(agentWorkFolder ? { agentWorkFolder } : {}),
      ...(stagingDirectory ? { stagingDirectory } : {}),
      ...(testResultsDirectory ? { testResultsDirectory } : {}),
      ...(cronScheduleDisplayName ? { cronScheduleDisplayName } : {}),
      ...(stageRequestedBy ? { stageRequestedBy } : {}),
      ...(stageRequestedForId ? { stageRequestedForId } : {}),
      ...(triggeredByBuildId ? { triggeredByBuildId } : {}),
      ...(triggeredByDefinitionId ? { triggeredByDefinitionId } : {}),
      ...(triggeredByDefinitionName ? { triggeredByDefinitionName } : {}),
      ...(triggeredByBuildNumber ? { triggeredByBuildNumber } : {}),
      ...(triggeredByProjectId ? { triggeredByProjectId } : {}),
      ...(environmentId ? { environmentId } : {}),
      ...(environmentResourceName ? { environmentResourceName } : {}),
      ...(environmentResourceId ? { environmentResourceId } : {}),
      ...(strategyName ? { strategyName } : {}),
      ...(strategyCycleName ? { strategyCycleName } : {}),
      ...(systemCollectionId ? { systemCollectionId } : {}),
      ...(systemHostType ? { systemHostType } : {}),
      ...(systemJobDisplayName ? { systemJobDisplayName } : {}),
      ...(systemJobId ? { systemJobId } : {}),
      ...(systemPhaseAttempt ? { systemPhaseAttempt } : {}),
      ...(systemPhaseDisplayName ? { systemPhaseDisplayName } : {}),
      ...(systemPhaseName ? { systemPhaseName } : {}),
      ...(systemPlanId ? { systemPlanId } : {}),
      ...(systemStageAttempt ? { systemStageAttempt } : {}),
      ...(systemStageDisplayName ? { systemStageDisplayName } : {}),
      ...(systemStageName ? { systemStageName } : {}),
      ...(systemTimelineId ? { systemTimelineId } : {}),
      ...(tfBuild ? { tfBuild } : {}),
      ...(prIsFork ? { prIsFork } : {}),
      ...(prId ? { prId } : {}),
      ...(prNumber ? { prNumber } : {}),
      ...(prTargetBranchName ? { prTargetBranchName } : {}),
      ...(prSourceBranch ? { prSourceBranch } : {}),
      ...(prSourceCommit ? { prSourceCommitId: prSourceCommit } : {}),
      ...(prSourceRepoUri ? { prSourceRepoUri } : {}),
      ...(prTargetBranch ? { prTargetBranch } : {}),
    },
    repository: {
      owner: teamProject,
      name: repositoryName,
      url: repositoryUri,
      ...(repositoryId ? { id: repositoryId } : {}),
      ...(repositoryProvider ? { provider: repositoryProvider } : {}),
      ...(repositoryClean ? { clean: repositoryClean } : {}),
      ...(repositoryTfvcWorkspace ? { tfvcWorkspace: repositoryTfvcWorkspace } : {}),
      ...(repositoryGitSubmoduleCheckout ? { gitSubmoduleCheckout: repositoryGitSubmoduleCheckout } : {}),
    },
    commit: {
      sha: sourceVersion,
      url: commitUrl,
      ...(sourceVersionMessage ? { message: sourceVersionMessage } : {}),
      ...(build.requestedFor?.displayName ? { author: build.requestedFor.displayName } : {}),
      ...(requestedForEmail ? { authorEmail: requestedForEmail } : {}),
      ...(requestedForId ? { requestedForId } : {}),
      ...(queuedById ? { queuedById } : {}),
    },
    branch: finalBranch,
    ...(environment || environmentName ? { environment: environment || environmentName } : {}),
    triggeredBy: queuedBy || requestedFor,
    eventName: buildReason || undefined,
    failure: {
      ...(failedRecord?.name ? { failedStep: failedRecord.name } : {}),
      ...(failedRecord?.errorCount !== undefined
        ? { errorMessage: `Task '${failedRecord.name}' reported ${failedRecord.errorCount} error(s).` }
        : {}),
      logs,
      logsTruncated,
    },
  };
  
  // Add pull request information if available
  if (isPullRequest && pullRequestNumber) {
    (event as any).pullRequest = {
      number: parseInt(pullRequestNumber),
      url: prSourceRepoUri || `${collectionUri}${teamProject}/_git/${repositoryName}/pullrequest/${pullRequestNumber}`,
    };
  }
  
  return event;
}

function required(name: string): string {
  const value = tl.getVariable(name);
  if (!value) throw new Error(`Required ADO variable missing: ${name}`);
  return value;
}
