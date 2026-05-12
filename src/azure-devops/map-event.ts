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
  const collectionUri = required("System.CollectionUri");
  const teamProject = required("System.TeamProject");
  const buildId = Number.parseInt(required("Build.BuildId"), 10);
  const buildNumber = required("Build.BuildNumber");
  const definitionName = required("Build.DefinitionName");
  const sourceVersion = required("Build.SourceVersion");
  const sourceBranch = required("Build.SourceBranch").replace(/^refs\/heads\//, "");
  const repositoryName = required("Build.Repository.Name");
  const repositoryUri = required("Build.Repository.Uri");
  const requestedFor = tl.getVariable("Build.RequestedFor") ?? "unknown";
  const accessToken = tl.getVariable("System.AccessToken") ?? "";
  
  // Additional Azure DevOps variables
  const sourceVersionMessage = tl.getVariable("Build.SourceVersionMessage");
  const buildReason = tl.getVariable("Build.Reason");
  const buildUri = tl.getVariable("Build.BuildUri");
  const repositoryId = tl.getVariable("Build.Repository.ID");
  const repositoryProvider = tl.getVariable("Build.Repository.Provider");
  const sourceBranchName = tl.getVariable("Build.SourceBranchName");
  const systemCollectionId = tl.getVariable("System.CollectionId");
  const systemDefinitionId = tl.getVariable("System.DefinitionId");
  const systemTeamProjectId = tl.getVariable("System.TeamProjectId");
  const systemTimelineId = tl.getVariable("System.TimelineId");
  
  // Environment variables (deployment jobs)
  const environmentName = tl.getVariable("Environment.Name");
  const environmentId = tl.getVariable("Environment.Id");
  const environmentResourceName = tl.getVariable("Environment.ResourceName");
  const environmentResourceId = tl.getVariable("Environment.ResourceId");
  
  // Pull Request variables
  const prIsFork = tl.getVariable("System.PullRequest.IsFork");
  const prId = tl.getVariable("System.PullRequest.PullRequestId");
  const prNumber = tl.getVariable("System.PullRequest.PullRequestNumber");
  const prTargetBranch = tl.getVariable("System.PullRequest.targetBranchName");
  const prSourceBranch = tl.getVariable("System.PullRequest.SourceBranch");
  const prSourceCommit = tl.getVariable("System.PullRequest.SourceCommitId");
  const prSourceRepoUri = tl.getVariable("System.PullRequest.SourceRepositoryUri");

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
      ...(build.queue?.name ? { agentPool: build.queue.name } : {}),
    },
    repository: {
      owner: teamProject,
      name: repositoryName,
      url: repositoryUri,
      ...(repositoryId ? { id: repositoryId } : {}),
      ...(repositoryProvider ? { provider: repositoryProvider } : {}),
    },
    commit: {
      sha: sourceVersion,
      url: commitUrl,
      ...(sourceVersionMessage ? { message: sourceVersionMessage } : {}),
      ...(build.requestedFor?.displayName ? { author: build.requestedFor.displayName } : {}),
    },
    branch: finalBranch,
    ...(environment || environmentName ? { environment: environment || environmentName } : {}),
    triggeredBy: requestedFor,
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
