import type { FailureEvent } from "../core/index.js";
import type { Octokit } from "@octokit/rest";

/**
 * Translate the GitHub Actions runtime context into a normalized FailureEvent.
 *
 * The Action runs *inside* the failing workflow itself (with `if: failure()`),
 * so we have direct access to GITHUB_* env vars + the github context.
 * We additionally fetch the run's job/step status from the REST API to identify
 * the specific step that failed (the env doesn't tell us that directly).
 */
export type GhContext = {
  repo: { owner: string; repo: string };
  workflow: string;
  runId: number;
  runNumber: number;
  sha: string;
  ref: string;
  actor: string;
  eventName: string;
  serverUrl: string;
  payload: {
    pull_request?: {
      number: number;
      html_url: string;
      title: string;
      user: { login: string };
    };
    head_commit?: {
      message: string;
      author: { name: string; email: string };
    };
  };
  // Additional GitHub Actions context fields
  actorId?: string | undefined;
  apiUrl?: string | undefined;
  graphqlUrl?: string | undefined;
  baseRef?: string | undefined;
  headRef?: string | undefined;
  job?: string | undefined;
  refName?: string | undefined;
  refProtected?: string | undefined;
  refType?: string | undefined;
  repositoryId?: string | undefined;
  repositoryOwner?: string | undefined;
  repositoryOwnerId?: string | undefined;
  runAttempt?: number | undefined;
  triggeringActor?: string | undefined;
  workflowRef?: string | undefined;
  workflowSha?: string | undefined;
  workspace?: string | undefined;
  action?: string | undefined;
  actionPath?: string | undefined;
  actionRepository?: string | undefined;
  // Runner information
  runnerArch?: string | undefined;
  runnerDebug?: string | undefined;
  runnerEnvironment?: string | undefined;
  runnerName?: string | undefined;
  runnerOs?: string | undefined;
  runnerTemp?: string | undefined;
  runnerToolCache?: string | undefined;
  runnerWorkspace?: string | undefined;
  retentionDays?: number | undefined;
  visibility?: string | undefined;
  jobStatus?: string | undefined;
  jobContainer?: string | undefined;
  jobServices?: string | undefined;
  strategyJobIndex?: number | undefined;
  strategyJobTotal?: number | undefined;
  actionRef?: string | undefined;
  actionStatus?: string | undefined;
  repositoryGitUrl?: string | undefined;
  secretSource?: string | undefined;
  eventPayload?: any;
};

export async function mapGithubContext(
  ctx: GhContext,
  octokit: Octokit,
  environment: string | undefined,
): Promise<FailureEvent> {
  const { owner, repo } = ctx.repo;
  const repoUrl = `${ctx.serverUrl}/${owner}/${repo}`;
  const pipelineUrl = `${repoUrl}/actions/runs/${ctx.runId}`;

  // Fetch run data early to provide fallbacks for missing context
  const { data: runData } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: ctx.runId,
  });

  const branch = (ctx.ref || runData.head_branch || "").replace(/^refs\/heads\//, "");
  const sha = ctx.sha || runData.head_sha || "";
  const commitUrl = `${repoUrl}/commit/${sha}`;
  
  // Use headRef for PR builds if available
  const finalBranch = ctx.headRef?.replace(/^refs\/heads\//, "") || branch;

  const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: ctx.runId,
  });

  let failedJob = jobsData.jobs.find((j: any) => {
    const isTarget = ctx.job ? (j.name === ctx.job || j.id.toString() === ctx.job) : true;
    const isFailed = j.conclusion === "failure" || j.conclusion === "cancelled" || j.conclusion === "timed_out";
    return isTarget && isFailed;
  });
  
  if (!failedJob) {
    // Fallback: just find ANY failed job if specific one not found
    const anyFailed = jobsData.jobs.find((j: any) => j.conclusion === "failure" || j.conclusion === "cancelled");
    if (anyFailed) {
      failedJob = anyFailed;
    }
  }

  const failedStep = failedJob?.steps?.find((s: any) => s.conclusion === "failure" || s.conclusion === "cancelled");

  // Fetch the failed job's logs (truncated to last 200 lines for the event).
  let logs = "";
  let logsTruncated = false;
  if (failedJob) {
    try {
      const logsResp = await octokit.actions.downloadJobLogsForWorkflowRun({
        owner,
        repo,
        job_id: failedJob.id,
      });
      
      let fullText = "";
      if (logsResp.data instanceof ArrayBuffer) {
        fullText = Buffer.from(logsResp.data).toString("utf-8");
      } else if (typeof logsResp.data === "string") {
        fullText = logsResp.data;
      } else {
        fullText = String(logsResp.data ?? "");
      }

      const lines = fullText.split("\n");
      if (lines.length > 200) {
        logs = lines.slice(-200).join("\n");
        logsTruncated = true;
      } else {
        logs = fullText;
      }
    } catch {
      logs = "(failed to fetch job logs — check GITHUB_TOKEN permissions)";
    }
  }

  const startedAt = runData.run_started_at ?? runData.created_at;
  const failedAt = runData.updated_at;
  const durationMs =
    startedAt && failedAt ? Date.parse(failedAt) - Date.parse(startedAt) : undefined;

  // Build a more specific job URL if possible
  const definitionUrl = runData.path ? `${repoUrl}/actions/workflows/${runData.path.split("/").pop()}` : `${repoUrl}/actions/runs/${ctx.runId}`;
  const jobUrl = failedJob ? `${repoUrl}/actions/runs/${ctx.runId}/job/${failedJob.id}` : `${repoUrl}/actions/runs/${ctx.runId}`;

  const event: FailureEvent = {
    source: "github",
    startedAt,
    failedAt,
    ...(durationMs !== undefined ? { durationMs } : {}),
    pipeline: {
      name: ctx.workflow || runData.name || "unknown",
      url: definitionUrl,
      runUrl: jobUrl,
      runId: String(ctx.runId),
      runNumber: ctx.runNumber,
      ...(failedJob ? { job: failedJob.name } : {}),
      ...(failedStep ? { step: failedStep.name } : {}),
      ...(ctx.runAttempt ? { runAttempt: ctx.runAttempt, retryCount: Math.max(0, ctx.runAttempt - 1) } : 
         runData.run_attempt ? { runAttempt: runData.run_attempt, retryCount: Math.max(0, runData.run_attempt - 1) } : {}),
      runnerType: failedJob?.runner_name ?? "github-hosted",
      ...(ctx.runnerOs ? { runnerOs: ctx.runnerOs } : {}),
      ...(ctx.runnerArch ? { runnerArch: ctx.runnerArch } : {}),
      ...(ctx.runnerName ? { runnerName: ctx.runnerName } : {}),
      triggerId: ctx.runId.toString(),
      triggerName: ctx.eventName,
      ...(ctx.apiUrl ? { apiUrl: ctx.apiUrl } : {}),
      ...(ctx.graphqlUrl ? { graphqlUrl: ctx.graphqlUrl } : {}),
      ...(ctx.workflowRef ? { workflowRef: ctx.workflowRef } : {}),
      ...(ctx.workflow ? { workflow: ctx.workflow } : {}),
      ...(ctx.workflowSha ? { workflowSha: ctx.workflowSha } : {}),
      ...(ctx.runnerEnvironment ? { runnerEnvironment: ctx.runnerEnvironment } : {}),
      ...(ctx.runnerDebug ? { runnerDebug: ctx.runnerDebug === "1" } : {}),
      ...(ctx.retentionDays ? { retentionDays: ctx.retentionDays } : {}),
      ...(ctx.actorId ? { actorId: ctx.actorId } : {}),
      ...(ctx.triggeringActor ? { triggeringActor: ctx.triggeringActor } : {}),
      ...(ctx.refType ? { refType: ctx.refType } : {}),
      ...(ctx.refProtected ? { refProtected: ctx.refProtected === "true" } : {}),
      ...(ctx.action ? { action: ctx.action } : {}),
      ...(ctx.actionPath ? { actionPath: ctx.actionPath } : {}),
      ...(ctx.actionRepository ? { actionRepository: ctx.actionRepository } : {}),
      ...(ctx.baseRef ? { baseRef: ctx.baseRef } : {}),
      ...(ctx.headRef ? { headRef: ctx.headRef } : {}),
      ...(ctx.runnerTemp ? { runnerTemp: ctx.runnerTemp } : {}),
      ...(ctx.runnerToolCache ? { runnerToolCache: ctx.runnerToolCache } : {}),
      ...(ctx.runnerWorkspace ? { runnerWorkspace: ctx.runnerWorkspace } : {}),
      ...(ctx.workspace ? { workspace: ctx.workspace, sourcesDirectory: ctx.workspace } : {}),
      ...(ctx.jobStatus ? { jobStatus: ctx.jobStatus } : {}),
      ...(ctx.jobContainer ? { jobContainer: ctx.jobContainer } : {}),
      ...(ctx.jobServices ? { jobServices: ctx.jobServices } : {}),
      ...(ctx.strategyJobIndex !== undefined ? { strategyJobIndex: ctx.strategyJobIndex } : {}),
      ...(ctx.strategyJobTotal !== undefined ? { strategyJobTotal: ctx.strategyJobTotal } : {}),
      ...(ctx.actionRef ? { actionRef: ctx.actionRef } : {}),
      ...(ctx.actionStatus ? { actionStatus: ctx.actionStatus } : {}),
      ...(ctx.repositoryGitUrl ? { repositoryGitUrl: ctx.repositoryGitUrl } : {}),
      ...(ctx.secretSource ? { secretSource: ctx.secretSource } : {}),
    },
    repository: {
      owner,
      name: repo,
      url: repoUrl,
      ...(ctx.repositoryId ? { id: ctx.repositoryId } : {}),
      ...(ctx.repositoryOwnerId ? { ownerId: ctx.repositoryOwnerId } : {}),
      ...(ctx.visibility ? { visibility: ctx.visibility } : {}),
    },
    commit: {
      sha: sha,
      url: commitUrl,
      ...(ctx.payload.head_commit?.message
        ? { message: ctx.payload.head_commit.message }
        : {}),
      ...(ctx.payload.head_commit?.author?.name
        ? { author: ctx.payload.head_commit.author.name }
        : {}),
      ...(ctx.payload.head_commit?.author?.email
        ? { authorEmail: ctx.payload.head_commit.author.email }
        : {}),
    },
    branch: ctx.refName || finalBranch, // Use the short ref name if available
    ...(ctx.eventPayload ? { eventPayload: ctx.eventPayload } : {}),
    ...(ctx.payload.pull_request
      ? {
          pullRequest: {
            number: ctx.payload.pull_request.number,
            url: ctx.payload.pull_request.html_url,
            title: ctx.payload.pull_request.title,
            author: ctx.payload.pull_request.user.login,
          },
        }
      : {}),
    ...(environment ? { environment } : {}),
    triggeredBy: ctx.triggeringActor || ctx.actor || runData.actor?.login || "unknown",
    eventName: ctx.eventName,
    apiUrl: ctx.apiUrl,
    graphqlUrl: ctx.graphqlUrl,
    metadata: {},
    explicitFields: [],
    failure: {
      ...(failedStep ? { failedStep: failedStep.name } : {}),
      logs,
      logsTruncated,
    },
  };
  
  return event;
}
