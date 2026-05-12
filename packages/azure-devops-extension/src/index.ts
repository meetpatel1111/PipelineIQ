import * as tl from "azure-pipelines-task-lib/task";
import { 
  processFailureEvent,
  PipelineIQConfigSchema,
  type PipelineIQConfig,
} from "@pipelineiq/core";
import { mapAzureDevOpsContext } from "./map-event.js";

async function run(): Promise<void> {
  try {
    const config = readConfig();
    const environment = tl.getInput("environment") || undefined;

    const event = await mapAzureDevOpsContext(environment);
    const result = await processFailureEvent(event, config);

    const issueKey = result.action === "skipped" ? "" : result.issueKey;
    tl.setVariable("PipelineIQ.IssueKey", issueKey);
    tl.setVariable("PipelineIQ.Action", result.action);
    tl.setResult(
      tl.TaskResult.Succeeded,
      `PipelineIQ: ${result.action} ${issueKey || "(no issue)"}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tl.setResult(tl.TaskResult.Failed, `PipelineIQ failed: ${message}`);
  }
}

function readConfig(): PipelineIQConfig {
  const aiMode = (tl.getInput("aiMode") || "disabled") as
    | "disabled"
    | "assist"
    | "full";

  const raw = {
    jira: {
      baseUrl: tl.getInput("jiraUrl", true) ?? "",
      email: tl.getInput("jiraEmail", true) ?? "",
      apiToken: tl.getInput("jiraToken", true) ?? "",
    },
    jiraProject: tl.getInput("jiraProject", true) ?? "",
    issueType: tl.getInput("issueType") || "Bug",
    ai: {
      mode: aiMode,
      ...(tl.getInput("aiApiKey") ? { apiKey: tl.getInput("aiApiKey") } : {}),
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(tl.getInput("dedupWindowHours") || "24", 10),
    },
  };

  return PipelineIQConfigSchema.parse(raw);
}

void run();
