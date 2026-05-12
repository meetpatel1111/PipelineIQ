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
  // Runner information
  runnerArch?: string | undefined;
  runnerDebug?: string | undefined;
  runnerEnvironment?: string | undefined;
  runnerName?: string | undefined;
  runnerOs?: string | undefined;
  runnerTemp?: string | undefined;
  runnerToolCache?: string | undefined;
};

export async function mapGithubContext(
  ctx: GhContext,
  octokit: Octokit,
  environment: string | undefined,
): Promise<FailureEvent> {
  const { owner, repo } = ctx.repo;
  const repoUrl = `${ctx.serverUrl}/${owner}/${repo}`;
  const pipelineUrl = `${repoUrl}/actions/runs/${ctx.runId}`;
  const commitUrl = `${repoUrl}/commit/${ctx.sha}`;
  const branch = ctx.ref.replace(/^refs\/heads\//, "");
  
  // Use headRef for PR builds if available
  const finalBranch = ctx.headRef?.replace(/^refs\/heads\//, "") || branch;

  // Pull job/step info — find the failed step in the current run.
  const { data: runData } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: ctx.runId,
  });

  const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: ctx.runId,
  });

  const failedJob = jobsData.jobs.find((j) => j.conclusion === "failure");
  const failedStep = failedJob?.steps?.find((s) => s.conclusion === "failure");

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
      const fullText = String(logsResp.data ?? "");
      const lines = fullText.split("\n");
      if (lines.length > 500) {
        logs = lines.slice(-500).join("\n");
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

  const event: FailureEvent = {
    source: "github",
    startedAt,
    failedAt,
    ...(durationMs !== undefined ? { durationMs } : {}),
    pipeline: {
      name: ctx.workflow,
      url: pipelineUrl,
      runId: String(ctx.runId),
      runNumber: ctx.runNumber,
      ...(failedJob ? { job: failedJob.name } : {}),
      ...(failedStep ? { step: failedStep.name } : {}),
      ...(runData.run_attempt ? { retryCount: runData.run_attempt - 1 } : {}),
      runnerType: failedJob?.runner_name ?? "github-hosted",
    },
    repository: {
      owner,
      name: repo,
      url: repoUrl,
      ...(ctx.repositoryId ? { id: ctx.repositoryId } : {}),
    },
    commit: {
      sha: ctx.sha,
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
    branch: finalBranch,
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
    triggeredBy: ctx.triggeringActor || ctx.actor,
    failure: {
      ...(failedStep ? { failedStep: failedStep.name } : {}),
      logs,
      logsTruncated,
    },
  };
  
  return event;
}
