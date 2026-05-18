import * as tl from "azure-pipelines-task-lib/task";
import { mapAzureDevOpsContext } from "./map-event.js";
import type { PipelineIQConfig } from "../core/index.js";

async function run(): Promise<void> {
  try {
    // Single dynamic import — required for CJS/ESM interop with azure-pipelines-task-lib
    const { processFailureEvent, PipelineIQConfigSchema, aiEnricher } = await import("../core/index.js");

    const config = readConfig(PipelineIQConfigSchema);
    const environment = tl.getInput("environment") || undefined;

    const event = await mapAzureDevOpsContext(environment);
    const result = await processFailureEvent(event, config, {
      extraEnrichers: [aiEnricher],
    });

    const issueKey = result.action === "skipped" ? "" : result.issueKey;
    tl.setVariable("PipelineIQ.IssueKey", issueKey);
    tl.setVariable("PipelineIQ.Action", result.action);

    // Self-healing outputs
    if (result.selfHealing) {
      tl.setVariable("PipelineIQ.SelfHealingPRUrl", result.selfHealing.prUrl ?? "");
      const status = result.selfHealing.dryRun
        ? "dry-run"
        : result.selfHealing.success
          ? "success"
          : result.selfHealing.attempted
            ? "failed"
            : "skipped";
      tl.setVariable("PipelineIQ.SelfHealingStatus", status);

      const filesChanged = result.selfHealing.fix?.changes?.map((c) => c.filePath) ?? [];
      tl.setVariable("PipelineIQ.SelfHealingFilesChanged", filesChanged.join(","));

      if (result.selfHealing.prUrl) {
        console.log(`PipelineIQ Self-Healing: PR created at ${result.selfHealing.prUrl}`);
      }

      if (result.selfHealing.fix) {
        const fix = result.selfHealing.fix;
        console.log(`PipelineIQ Proposed Changes:`);
        for (const change of fix.changes) {
          console.log(`  - [${change.action.toUpperCase()}] ${change.filePath}: ${change.changeDescription}`);
        }
      }
    }

    tl.setResult(
      tl.TaskResult.Succeeded,
      `PipelineIQ: ${result.action} ${issueKey || "(no issue)"}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tl.setResult(tl.TaskResult.Failed, `PipelineIQ failed: ${message}`);
  }
}

function readConfig(PipelineIQConfigSchema: { parse: (raw: unknown) => PipelineIQConfig }): PipelineIQConfig {
  const aiMode = (tl.getInput("aiMode") || "disabled") as "disabled" | "assist" | "full";

  const raw = {
    jira: {
      type: tl.getInput("jiraType") === "server" ? "server" : "cloud",
      baseUrl: tl.getInput("jiraUrl")!,
      email: tl.getInput("jiraEmail") || "",
      apiToken: tl.getInput("jiraToken") || "",
      username: tl.getInput("jiraUsername") || undefined,
      password: tl.getInput("jiraPassword") || undefined,
      accessToken: tl.getInput("jiraAccessToken") || undefined,
      strictGDPR: tl.getBoolInput("jiraStrictGDPR"),
    },
    jiraProject: tl.getInput("jiraProject", true)!,
    issueType: tl.getInput("issueType") || "Bug",
    defaultAssignee: tl.getInput("defaultAssignee") || undefined,
    ai: {
      mode: aiMode,
      ...(tl.getInput("aiProvider") ? { provider: tl.getInput("aiProvider") as any } : {}),
      ...(tl.getInput("aiApiKey") ? { apiKey: tl.getInput("aiApiKey") } : {}),
      ...(tl.getInput("aiModel") ? { model: tl.getInput("aiModel") } : {}),
      ...(tl.getInput("aiTemperature") ? { temperature: Number.parseFloat(tl.getInput("aiTemperature")!) } : {}),
      ...(tl.getInput("aiMaxTokens") ? { maxLogTokens: Number.parseInt(tl.getInput("aiMaxTokens")!, 10) } : {}),
      ...(tl.getInput("aiConfidence") ? { minConfidence: Number.parseFloat(tl.getInput("aiConfidence")!) } : {}),
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(tl.getInput("dedupWindowHours") || "24", 10),
    },
    // Self-healing configuration
    ...(tl.getBoolInput("selfHealing") ? {
      selfHealing: {
        enabled: true,
        dryRun: tl.getBoolInput("selfHealingDryRun"),
        minConfidence: Number.parseFloat(tl.getInput("selfHealingConfidence") || "0.8"),
        maxFilesChanged: Number.parseInt(tl.getInput("selfHealingMaxFiles") || "10", 10),
        maxLinesChanged: Number.parseInt(tl.getInput("selfHealingMaxLines") || "200", 10),
        draftPr: tl.getBoolInput("selfHealingDraft"),
        azureToken: tl.getInput("jiraToken"), // PAT for PR creation, fallback resolved by engine
        platform: "azure-devops" as const,
        ...(tl.getInput("selfHealingReviewers") ? {
          reviewers: tl.getInput("selfHealingReviewers")!.split(",").map(s => s.trim()),
        } : {}),
        ...(tl.getInput("selfHealingLabels") ? {
          prLabels: tl.getInput("selfHealingLabels")!.split(",").map(s => s.trim()),
        } : {}),
        ...(tl.getInput("selfHealingCategories") ? {
          allowedCategories: tl.getInput("selfHealingCategories")!.split(",").map(s => s.trim()),
        } : {}),
      },
    } : {}),
  };

  return PipelineIQConfigSchema.parse(raw);
}

void run();
