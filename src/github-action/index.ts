import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import {
  processFailureEvent,
  PipelineIQConfigSchema,
  aiEnricher,
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
      sha: core.getInput("github-sha") || github.context.sha,
      ref: core.getInput("github-ref") || github.context.ref,
      actor: core.getInput("github-actor") || github.context.actor,
      eventName: core.getInput("github-event-name") || github.context.eventName,
      serverUrl: core.getInput("github-server-url") || github.context.serverUrl || "https://github.com",
      payload: github.context.payload as GhContext["payload"],
      // Additional GitHub Actions context fields
      actorId: core.getInput("github-actor-id") || process.env.GITHUB_ACTOR_ID,
      apiUrl: core.getInput("github-api-url") || process.env.GITHUB_API_URL,
      graphqlUrl: core.getInput("github-graphql-url") || process.env.GITHUB_GRAPHQL_URL,
      baseRef: core.getInput("github-base-ref") || process.env.GITHUB_BASE_REF,
      headRef: core.getInput("github-head-ref") || process.env.GITHUB_HEAD_REF,
      job: core.getInput("github-job") || process.env.GITHUB_JOB,
      refName: core.getInput("github-ref-name") || process.env.GITHUB_REF_NAME,
      refProtected: core.getInput("github-ref-protected") || process.env.GITHUB_REF_PROTECTED,
      refType: core.getInput("github-ref-type") || process.env.GITHUB_REF_TYPE,
      repositoryId: core.getInput("github-repository-id") || process.env.GITHUB_REPOSITORY_ID,
      repositoryOwner: core.getInput("github-repository-owner") || process.env.GITHUB_REPOSITORY_OWNER,
      repositoryOwnerId: core.getInput("github-repository-owner-id") || process.env.GITHUB_REPOSITORY_OWNER_ID,
      runAttempt: (core.getInput("github-run-attempt") || process.env.GITHUB_RUN_ATTEMPT) ? Number.parseInt(core.getInput("github-run-attempt") || process.env.GITHUB_RUN_ATTEMPT!, 10) : undefined,
      triggeringActor: core.getInput("github-triggering-actor") || process.env.GITHUB_TRIGGERING_ACTOR,
      workflowRef: core.getInput("github-workflow-ref") || process.env.GITHUB_WORKFLOW_REF,
      workflowSha: core.getInput("github-workflow-sha") || process.env.GITHUB_WORKFLOW_SHA,
      workspace: core.getInput("github-workspace") || process.env.GITHUB_WORKSPACE,
      action: core.getInput("github-action") || process.env.GITHUB_ACTION,
      actionPath: core.getInput("github-action-path") || process.env.GITHUB_ACTION_PATH,
      actionRepository: core.getInput("github-action-repository") || process.env.GITHUB_ACTION_REPOSITORY,
      visibility: (github.context.payload as any).repository?.visibility,
      // Runner information
      runnerArch: core.getInput("runner-arch") || process.env.RUNNER_ARCH,
      runnerDebug: core.getInput("runner-debug") || process.env.RUNNER_DEBUG,
      runnerEnvironment: core.getInput("runner-environment") || process.env.RUNNER_ENVIRONMENT,
      runnerName: core.getInput("runner-name") || process.env.RUNNER_NAME,
      runnerOs: core.getInput("runner-os") || process.env.RUNNER_OS,
      runnerTemp: core.getInput("runner-temp") || process.env.RUNNER_TEMP,
      runnerToolCache: core.getInput("runner-tool-cache") || process.env.RUNNER_TOOL_CACHE,
      runnerWorkspace: core.getInput("runner-workspace") || process.env.RUNNER_WORKSPACE,
      jobStatus: core.getInput("job-status"),
      jobContainer: core.getInput("job-container"),
      jobServices: core.getInput("job-services"),
      strategyJobIndex: core.getInput("strategy-job-index") ? Number.parseInt(core.getInput("strategy-job-index"), 10) : undefined,
      strategyJobTotal: core.getInput("strategy-job-total") ? Number.parseInt(core.getInput("strategy-job-total"), 10) : undefined,
      actionRef: core.getInput("github-action-ref"),
      actionStatus: core.getInput("github-action-status"),
      repositoryGitUrl: core.getInput("github-repository-url"),
      secretSource: core.getInput("github-secret-source"),
      eventPayload: github.context.payload,
      retentionDays: (core.getInput("github-retention-days") || process.env.GITHUB_RETENTION_DAYS) ? Number.parseInt(core.getInput("github-retention-days") || process.env.GITHUB_RETENTION_DAYS!, 10) : undefined,
    };

    const event = await mapGithubContext(ghCtx, octokit, environment);
    const result = await processFailureEvent(event, config, {
      extraEnrichers: [aiEnricher],
    });

    const issueKey = result.action === "skipped" ? "" : result.issueKey;
    core.setOutput("jira-issue-key", issueKey);
    core.setOutput("action-taken", result.action);

    // Self-healing outputs
    if (result.selfHealing) {
      core.setOutput("self-healing-pr-url", result.selfHealing.prUrl ?? "");
      const status = result.selfHealing.dryRun
        ? "dry-run"
        : result.selfHealing.success
          ? "success"
          : result.selfHealing.attempted
            ? "failed"
            : "skipped";
      core.setOutput("self-healing-status", status);

      const filesChanged = result.selfHealing.fix?.changes?.map((c) => c.filePath) ?? [];
      core.setOutput("self-healing-files-changed", filesChanged.join(","));

      if (result.selfHealing.prUrl) {
        core.info(`PipelineIQ Self-Healing: PR created at ${result.selfHealing.prUrl}`);
      }

      if (result.selfHealing.fix) {
        const fix = result.selfHealing.fix;
        core.info(`PipelineIQ Proposed Changes:`);
        for (const change of fix.changes) {
          core.info(`  - [${change.action.toUpperCase()}] ${change.filePath}: ${change.changeDescription}`);
        }

        // Generate GitHub Step Summary for rich visual feedback
        try {
          let summary = core.summary.addHeading("🤖 PipelineIQ Self-Healing Fix Summary", 2);

          if (result.selfHealing.success && result.selfHealing.prUrl) {
            summary = summary.addRaw(`✅ **PR Created:** [${result.selfHealing.prUrl}](${result.selfHealing.prUrl})<br>`);
            summary = summary.addRaw(`🌿 **Branch:** \`${result.selfHealing.branchName}\`<br>`);
          } else if (result.selfHealing.dryRun) {
            summary = summary.addRaw(`🧪 **Dry Run Mode — No PR created**<br>`);
          } else {
            summary = summary.addRaw(`❌ **Self-Healing Failed:** ${result.selfHealing.reason}<br>`);
          }

          summary = summary.addRaw(`🎯 **Confidence:** ${Math.round(fix.confidence * 100)}% | ⚡ **Risk Level:** ${fix.riskLevel}<br><br>`)
            .addHeading("Proposed File Changes", 3);

          const tableHeaders = [
            { data: "File Path", header: true },
            { data: "Action", header: true },
            { data: "Description", header: true },
          ];
          const tableRows = fix.changes.map((c) => [
            `\`${c.filePath}\``,
            `**${c.action.toUpperCase()}**`,
            c.changeDescription,
          ]);

          await summary.addTable([tableHeaders, ...tableRows]).write();
        } catch (sumErr) {
          core.warning(`Failed to write step summary: ${sumErr}`);
        }
      }
    }

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
      type: (core.getInput("jira-type") || "cloud") as "cloud" | "server",
      baseUrl: core.getInput("jira-url", { required: true }),
      email: core.getInput("jira-email", { required: true }),
      apiToken: core.getInput("jira-token", { required: true }),
      username: core.getInput("jira-username") || undefined,
      password: core.getInput("jira-password") || undefined,
      strictGDPR: core.getInput("strict-gdpr") === "true",
    },
    jiraProject: core.getInput("jira-project", { required: true }),
    issueType: core.getInput("issue-type") || "Bug",
    ...(core.getInput("default-assignee")
      ? { defaultAssignee: core.getInput("default-assignee") }
      : {}),
    ai: {
      mode: aiMode,
      ...(core.getInput("ai-provider")
        ? { provider: core.getInput("ai-provider") as any }
        : {}),
      ...(core.getInput("ai-api-key") ? { apiKey: core.getInput("ai-api-key") } : {}),
      ...(core.getInput("ai-model") ? { model: core.getInput("ai-model") } : {}),
      ...(core.getInput("ai-temperature") ? { temperature: Number.parseFloat(core.getInput("ai-temperature")) } : {}),
      ...(core.getInput("ai-max-tokens") ? { maxLogTokens: Number.parseInt(core.getInput("ai-max-tokens"), 10) } : {}),
      ...(core.getInput("ai-confidence") ? { minConfidence: Number.parseFloat(core.getInput("ai-confidence")) } : {}),
    },
    dedup: {
      enabled: true,
      windowHours: Number.parseInt(core.getInput("dedup-window-hours") || "24", 10),
    },
    // Self-healing configuration
    ...(core.getInput("self-healing") === "true" ? {
      selfHealing: {
        enabled: true,
        dryRun: core.getInput("self-healing-dry-run") === "true",
        minConfidence: Number.parseFloat(core.getInput("self-healing-confidence") || "0.8"),
        maxFilesChanged: Number.parseInt(core.getInput("self-healing-max-files") || "10", 10),
        maxLinesChanged: Number.parseInt(core.getInput("self-healing-max-lines") || "200", 10),
        enableGuardrails: core.getInput("self-healing-guardrails") !== "false",
        draftPr: core.getInput("self-healing-draft") !== "false",
        githubToken: core.getInput("github-token"),
        platform: "github" as const,
        ...(core.getInput("self-healing-reviewers") ? {
          reviewers: core.getInput("self-healing-reviewers").split(",").map((s: string) => s.trim()),
        } : {}),
        ...(core.getInput("self-healing-labels") ? {
          prLabels: core.getInput("self-healing-labels").split(",").map((s: string) => s.trim()),
        } : {}),
        ...(core.getInput("self-healing-categories") ? {
          allowedCategories: core.getInput("self-healing-categories").split(",").map((s: string) => s.trim()),
        } : {}),
      },
    } : {}),
  };

  return PipelineIQConfigSchema.parse(raw);
}

void run();
