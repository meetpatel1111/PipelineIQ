import type { FailureEvent } from "../core/index.js";
import { buildSmartExcerpt } from "../core/index.js";
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
  options?: any,
): Promise<FailureEvent> {
  const collectionUri = options?.apiUrl || tl.getInput("teamFoundationCollectionUri") || tl.getVariable("System.CollectionUri") || process.env.SYSTEM_COLLECTIONURI || "";
  const teamProject = options?.project || tl.getInput("teamProject") || tl.getVariable("System.TeamProject") || process.env.SYSTEM_TEAMPROJECT || "";
  const buildIdInput = options?.runId || tl.getInput("buildId");
  const buildId = Number.parseInt(buildIdInput || tl.getVariable("Build.BuildId") || process.env.BUILD_BUILDID || "0", 10);
  const buildNumber = options?.runNumber || tl.getInput("buildNumber") || tl.getVariable("Build.BuildNumber") || process.env.BUILD_BUILDNUMBER || "0";
  const definitionName = options?.pipeline || tl.getInput("definitionName") || tl.getVariable("Build.DefinitionName") || process.env.BUILD_DEFINITIONNAME || "";
  const sourceVersion = options?.commit || tl.getInput("sourceVersion") || tl.getVariable("Build.SourceVersion") || process.env.BUILD_SOURCEVERSION || "";
  const fullSourceBranch = options?.branch || tl.getInput("sourceBranch") || tl.getVariable("Build.SourceBranch") || process.env.BUILD_SOURCEBRANCH || "";
  const sourceBranch = fullSourceBranch.replace(/^refs\/heads\//, "");
  const repositoryName = options?.repository || tl.getInput("repositoryName") || tl.getVariable("Build.Repository.Name") || process.env.BUILD_REPOSITORY_NAME || "";
  const repositoryUri = tl.getInput("repositoryUri") || tl.getVariable("Build.Repository.Uri") || process.env.BUILD_REPOSITORY_URI || "";
  const requestedFor = options?.actor || tl.getInput("requestedFor") || tl.getVariable("Build.RequestedFor") || process.env.BUILD_REQUESTEDFOR || "";
  const accessToken = options?.azureToken || tl.getVariable("System.AccessToken") || process.env.SYSTEM_ACCESSTOKEN || process.env.AZURE_DEVOPS_EXT_PAT || "";
  
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
  
  // Diagnostic and Agent variables
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
  
  // Environment variables (deployment jobs)
  const environmentName = tl.getInput("environmentName") || tl.getVariable("Environment.Name");
  const environmentId = tl.getInput("environmentId") || tl.getVariable("Environment.Id");
  const environmentResourceName = tl.getInput("environmentResourceName") || tl.getVariable("Environment.ResourceName");
  const environmentResourceId = tl.getInput("environmentResourceId") || tl.getVariable("Environment.ResourceId");
  const strategyName = tl.getInput("strategyName") || tl.getVariable("Strategy.Name");
  const strategyCycleName = tl.getInput("strategyCycleName") || tl.getVariable("Strategy.CycleName");
  const checksStageAttempt = tl.getVariable("Checks.StageAttempt");
  
  // Release variables
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
  
  // System variables
  const systemDebug = tl.getVariable("System.Debug");
  const systemDefaultWorkingDirectory = tl.getVariable("System.DefaultWorkingDirectory");
  const systemCollectionUri = tl.getVariable("System.CollectionUri") || collectionUri;
  const systemTeamFoundationCollectionUri = tl.getVariable("System.TeamFoundationCollectionUri");
  const pipelineWorkspace = tl.getVariable("Pipeline.Workspace");
  const systemWorkFolder = tl.getVariable("System.WorkFolder");
  
  
  // Extract all Release.Artifacts variables
  const releaseArtifacts: Record<string, any> = {};
  const allVars = tl.getVariables();
  for (const v of allVars) {
    if (v.name.startsWith("Release.Artifacts.")) {
      releaseArtifacts[v.name] = v.value;
    }
  }
  
  // Pull Request variables
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

  const failedTasks = timeline?.records?.filter(
    (r) => r.result === 2 /* TaskResult.Failed */ && r.type === "Task",
  ) || [];
  const primaryFailedTask = failedTasks[0];
  const taskName = failedTasks.length > 1 ? failedTasks.map((t) => t.name).filter(Boolean).join(", ") : primaryFailedTask?.name;
  const failedJob = timeline?.records?.find(
    (r) => r.type === "Job" && r.result === 2,
  );

  let logs = "";
  let logsTruncated = false;
  if (primaryFailedTask?.log?.id) {
    try {
      const lines = await buildApi.getBuildLogLines(
        teamProject,
        buildId,
        primaryFailedTask.log.id,
      );
      const fullText = lines.join("\n");
      if (lines.length > 300) {
        // Use smart excerpt to ensure the failing step's output is preserved and not pushed out by cleanup lines
        const smart = buildSmartExcerpt(fullText, "azure-devops", 300);
        logs = smart.text || lines.slice(-300).join("\n");
        logsTruncated = true;
      } else {
        logs = fullText;
      }
    } catch {
      logs = "(failed to fetch task logs — check System.AccessToken permissions)";
    }
  }

  const definitionUrl = `${collectionUri}${teamProject}/_build?definitionId=${systemDefinitionId}`;
  const runUrl = buildUri || `${collectionUri}${teamProject}/_build/results?buildId=${buildId}`;
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
      url: definitionUrl,
      runUrl: runUrl,
      runId: String(buildId),
      runNumber: Number.parseInt(buildNumber, 10) || 0,
      ...(failedJob?.name ? { stage: failedJob.name } : {}),
      ...(taskName ? { task: taskName, step: taskName } : {}),
      ...(failedJob?.workerName ? { runnerType: failedJob.workerName } : {}),
      ...(agentOs ? { runnerOs: agentOs } : {}),
      ...(agentOsArch ? { runnerArch: agentOsArch } : {}),
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
      ...(checksStageAttempt ? { checksStageAttempt } : {}),
      ...(cronScheduleDisplayName ? { cronScheduleDisplayName } : {}),
      ...(stageRequestedBy ? { stageRequestedBy } : {}),
      ...(stageRequestedForId ? { stageRequestedForId } : {}),
      ...(sourceTfvcShelveset ? { sourceTfvcShelveset } : {}),
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
      ...(systemWorkFolder ? { systemWorkFolder } : {}),
      ...(sourceBranchName ? { sourceBranchName } : {}),
      ...(fullSourceBranch ? { fullSourceBranch } : {}),
      ...(systemCollectionId ? { systemCollectionId } : {}),
      ...(systemHostType ? { systemHostType } : {}),
      ...(systemJobDisplayName ? { systemJobDisplayName } : {}),
      ...(systemJobId ? { systemJobId } : {}),
      ...(systemJobName ? { systemJobName } : {}),
      ...(systemPhaseAttempt ? { systemPhaseAttempt } : {}),
      ...(systemPhaseDisplayName ? { systemPhaseDisplayName } : {}),
      ...(systemPhaseName ? { systemPhaseName } : {}),
      ...(systemPlanId ? { systemPlanId } : {}),
      ...(systemTimelineId ? { systemTimelineId } : {}),
      ...(systemStageAttempt ? { systemStageAttempt } : {}),
      ...(systemStageDisplayName ? { systemStageDisplayName } : {}),
      ...(systemStageName ? { systemStageName } : {}),
      ...(systemCollectionUri ? { systemCollectionUri } : {}),
      ...(systemTeamFoundationCollectionUri ? { systemTeamFoundationCollectionUri } : {}),
      ...(systemDebug ? { systemDebug } : {}),
      ...(systemDefaultWorkingDirectory ? { systemDefaultWorkingDirectory } : {}),
      ...(pipelineWorkspace ? { pipelineWorkspace } : {}),
      ...(tfBuild ? { tfBuild } : {}),
      ...(agentContainerMapping ? { agentContainerMapping } : {}),
      ...(agentReleaseDirectory ? { agentReleaseDirectory } : {}),
      ...(agentRootDirectory ? { agentRootDirectory } : {}),
      ...(releaseDeploymentRequestedFor ? { releaseDeploymentRequestedFor } : {}),
      ...(releaseDeploymentRequestedForEmail ? { releaseDeploymentRequestedForEmail } : {}),
      ...(releaseDeploymentId ? { releaseDeploymentId } : {}),
      ...(releaseDefinitionEnvironmentId ? { releaseDefinitionEnvironmentId } : {}),
      ...(releaseDefinitionId ? { releaseDefinitionId } : {}),
      ...(releaseDefinitionName ? { releaseDefinitionName } : {}),
      ...(releaseEnvironmentId ? { releaseEnvironmentId } : {}),
      ...(releaseEnvironmentName ? { releaseEnvironmentName } : {}),
      ...(releasePrimaryArtifactSourceAlias ? { releasePrimaryArtifactSourceAlias } : {}),
      ...(releaseDescription ? { releaseDescription } : {}),
      ...(releaseId ? { releaseId } : {}),
      ...(releaseName ? { releaseName } : {}),
      ...(releaseUri ? { releaseUri } : {}),
      releaseArtifacts,
      ...(buildNumber ? { buildNumber } : {}),
      ...(buildUri ? { buildUri } : {}),
      ...(repositoryClean ? { repositoryClean } : {}),
      ...(repositoryGitSubmoduleCheckout ? { repositoryGitSubmoduleCheckout } : {}),
      ...(containerId ? { containerId } : {}),
      ...(prIsFork ? { prIsFork } : {}),
      ...(prId ? { prId } : {}),
      ...(prNumber ? { prNumber } : {}),
      ...(prTargetBranchName ? { prTargetBranchName } : {}),
      ...(prSourceBranch ? { prSourceBranch } : {}),
      ...(prSourceCommit ? { prSourceCommitId: prSourceCommit } : {}),
      ...(prSourceRepoUri ? { prSourceRepoUri } : {}),
      ...(prTargetBranch ? { prTargetBranch } : {}),
      ...(requestedFor ? { requestedFor } : {}),
      ...(requestedForEmail ? { requestedForEmail } : {}),
      ...(requestedForId ? { requestedForId } : {}),
      ...(queuedBy ? { queuedBy } : {}),
      ...(queuedById ? { queuedById } : {}),
      ...(sourceBranchName ? { sourceBranchName } : {}),
      ...(sourceVersionMessage ? { sourceVersionMessage } : {}),
      ...(repositoryId ? { repositoryId } : {}),
      ...(repositoryProvider ? { repositoryProvider } : {}),
      ...(repositoryUri ? { repositoryUri } : {}),
      ...(testResultsDirectory ? { testResultsDirectory } : {}),
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
      ...(queuedBy ? { author: requestedFor || queuedBy, queuedBy } : {}),
      ...(queuedById ? { queuedById } : {}),
    },
    branch: finalBranch,
    ...(environment || environmentName ? { environment: environment || environmentName } : {}),
    triggeredBy: queuedBy || requestedFor,
    eventName: buildReason || undefined,
    metadata: {},
    explicitFields: [],
    failure: {
      ...(taskName ? { failedStep: taskName } : {}),
      ...(primaryFailedTask?.errorCount !== undefined
        ? { errorMessage: `Task '${taskName}' reported ${primaryFailedTask.errorCount} error(s).` }
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
