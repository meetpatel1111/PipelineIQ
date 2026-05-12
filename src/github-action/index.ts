import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { 
  processFailureEvent,
  PipelineIQConfigSchema,
  type PipelineIQConfig,
} from "../core/index.js";
import { mapGithubContext, type GhContext } from "./map-event.js";

async function run(): Promise<void> {
  try {
    const config = readConfig();
    const ghToken = core.getInput("github-token", { required: true });
    const environment = core.getInput("environment") || undefined;

    const octokit = new Octokit({ auth: ghToken });

    const ghCtx: GhContext = {
      repo: github.context.repo,
      workflow: github.context.workflow,
      runId: github.context.runId,
      runNumber: github.context.runNumber,
      sha: github.context.sha,
      ref: github.context.ref,
      actor: github.context.actor,
      eventName: github.context.eventName,
      serverUrl: github.context.serverUrl ?? "https://github.com",
      payload: github.context.payload as GhContext["payload"],
      // Additional GitHub Actions context fields
      actorId: process.env.GITHUB_ACTOR_ID,
      apiUrl: process.env.GITHUB_API_URL,
      baseRef: process.env.GITHUB_BASE_REF,
      headRef: process.env.GITHUB_HEAD_REF,
      job: process.env.GITHUB_JOB,
      refName: process.env.GITHUB_REF_NAME,
      refProtected: process.env.GITHUB_REF_PROTECTED,
      refType: process.env.GITHUB_REF_TYPE,
      repositoryId: process.env.GITHUB_REPOSITORY_ID,
      repositoryOwner: process.env.GITHUB_REPOSITORY_OWNER,
      repositoryOwnerId: process.env.GITHUB_REPOSITORY_OWNER_ID,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ? Number.parseInt(process.env.GITHUB_RUN_ATTEMPT, 10) : undefined,
      triggeringActor: process.env.GITHUB_TRIGGERING_ACTOR,
      workflowRef: process.env.GITHUB_WORKFLOW_REF,
      workflowSha: process.env.GITHUB_WORKFLOW_SHA,
      workspace: process.env.GITHUB_WORKSPACE,
      // Runner information
      runnerArch: process.env.RUNNER_ARCH,
      runnerDebug: process.env.RUNNER_DEBUG,
      runnerEnvironment: process.env.RUNNER_ENVIRONMENT,
      runnerName: process.env.RUNNER_NAME,
      runnerOs: process.env.RUNNER_OS,
      runnerTemp: process.env.RUNNER_TEMP,
      runnerToolCache: process.env.RUNNER_TOOL_CACHE,
    };

    const event = await mapGithubContext(ghCtx, octokit, environment);
    const result = await processFailureEvent(event, config);

    const issueKey = result.action === "skipped" ? "" : result.issueKey;
    core.setOutput("jira-issue-key", issueKey);
    core.setOutput("action-taken", result.action);
    core.info(`PipelineIQ: ${result.action} ${issueKey || "(no issue)"}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(`PipelineIQ failed: ${message}`);
  }
}

function readConfig(): PipelineIQConfig {
  const aiMode = (core.getInput("ai-mode") || "disabled") as
    | "disabled"
    | "assist"
    | "full";

  const raw = {
    jira: {
      baseUrl: core.getInput("jira-url", { required: true }),
      email: core.getInput("jira-email", { required: true }),
      apiToken: core.getInput("jira-token", { required: true }),
    },
    jiraProject: core.getInput("jira-project", { required: true }),
    issueType: core.getInput("issue-type") || "Bug",
    ...(core.getInput("default-assignee")
      ? { defaultAssignee: core.getInput("default-assignee") }
      : {}),
    ai: {
      mode: aiMode,
      ...(core.getInput("ai-provider")
        ? { provider: core.getInput("ai-provider") as "openai" }
        : {}),
      ...(core.getInput("ai-api-key") ? { apiKey: core.getInput("ai-api-key") } : {}),
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(core.getInput("dedup-window-hours") || "24", 10),
    },
  };

  return PipelineIQConfigSchema.parse(raw);
}

void run();
