import * as tl from "azure-pipelines-task-lib/task";
import { mapAzureDevOpsContext } from "./map-event.js";
import type { PipelineIQConfig } from "@pipelineiq/core";

async function run(): Promise<void> {
  // Dynamic import for ES modules
  const { processFailureEvent, PipelineIQConfigSchema } = await import("@pipelineiq/core");
  try {
    const config = await readConfig();
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

async function readConfig(): Promise<PipelineIQConfig> {
  // Dynamic import for schema validation
  const { PipelineIQConfigSchema } = await import("@pipelineiq/core");
  
  const raw = {
    jira: {
      type: tl.getInput("jiraType") === "server" ? "server" : "cloud",
      baseUrl: tl.getInput("jiraUrl")!,
      email: tl.getInput("jiraEmail") || "",
      apiToken: tl.getInput("jiraToken") || "",
      username: tl.getInput("jiraUsername") || "",
      password: tl.getInput("jiraPassword") || "",
      accessToken: tl.getInput("jiraAccessToken") || "",
      strictGDPR: tl.getBoolInput("jiraStrictGDPR"),
    },
    ai: {
      mode: tl.getInput("aiMode") as any || "disabled",
      provider: tl.getInput("aiProvider") as any,
      apiKey: tl.getInput("aiApiKey") || "",
      model: tl.getInput("aiModel") || "",
      temperature: Number.parseFloat(tl.getInput("aiTemperature") || "0.7"),
      maxTokens: Number.parseInt(tl.getInput("aiMaxTokens") || "4000", 10),
      confidence: Number.parseFloat(tl.getInput("aiConfidence") || "0.7"),
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(tl.getInput("dedupWindowHours") || "24", 10),
    },
  };

  return PipelineIQConfigSchema.parse(raw);
}

void run();
