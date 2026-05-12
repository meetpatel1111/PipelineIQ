import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { 
  processFailureEvent,
  PipelineIQConfigSchema,
  type PipelineIQConfig,
} from "@pipelineiq/core";
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
