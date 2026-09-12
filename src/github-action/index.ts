import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import {
  processFailureEvent,
  resolvePipelineSuccess,
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

    // If job/workflow succeeded, auto-resolve any matching open incidents if enabled
    const jobStatus = core.getInput("job-status") || ghCtx.jobStatus;
    if (jobStatus === "success") {
      core.info("PipelineIQ: Pipeline execution succeeded — checking for open incident tickets to auto-resolve...");
      const resolveResult = await resolvePipelineSuccess(event, config);
      core.setOutput("action-taken", resolveResult.action);
      core.setOutput("jira-issue-key", resolveResult.resolvedKeys.join(",") || "");
      core.info(`PipelineIQ: ${resolveResult.message}`);

      try {
        let summary = core.summary.addHeading("✅ PipelineIQ: Pipeline Execution Succeeded", 2);
        if (resolveResult.action === "resolved" && resolveResult.resolvedKeys.length > 0) {
          const links = resolveResult.resolvedKeys
            .map((k) => `[${k}](${config.jira.baseUrl}/browse/${k})`)
            .join(", ");
          summary = summary.addRaw(`Successfully auto-resolved **${resolveResult.resolvedKeys.length}** open Jira incident(s): ${links}<br>`);
          summary = summary.addRaw(`🏷️ Tagged with \`piq-resolved-by-retry\` for flakiness tracking.<br>`);
        } else {
          summary = summary.addRaw(`Pipeline completed cleanly. No unresolved Jira incident tickets required auto-closure.<br>`);
        }
        await summary.write();
      } catch (sumErr) {
        core.warning(`Failed to write step summary: ${sumErr}`);
      }

      return;
    }

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
      }
    }

    // Generate comprehensive GitHub Step Summary for rich visual feedback on the run summary page
    try {
      let summary = core.summary.addHeading("🚨 PipelineIQ Incident Diagnostic", 2);

      const actionBadge = result.action === "created" ? "🆕 **Ticket Created**"
        : result.action === "updated" ? "🔄 **Existing Incident Updated (Dedup)**"
        : "⏸️ **Skipped**";
      const jiraLink = issueKey
        ? `[**${issueKey}**](${config.jira.baseUrl}/browse/${issueKey})`
        : "(No ticket)";

      summary = summary.addRaw(`**Status:** ${actionBadge} | **Jira Issue:** ${jiraLink}<br><br>`);

      const tableHeaders = [
        { data: "Property", header: true },
        { data: "Value", header: true },
      ];
      const tableRows: string[][] = [
        ["Pipeline", `\`${event.pipeline.name}\``],
        ["Branch", `\`${event.branch}\``],
        ["Commit", `\`${event.commit.sha.slice(0, 7)}\``],
      ];
      if (event.pipeline.step) tableRows.push(["Failed Step", `\`${event.pipeline.step}\``]);
      if (event.failure.exitCode !== undefined) tableRows.push(["Exit Code", `\`${event.failure.exitCode}\``]);
      if (result.spec?.category) tableRows.push(["Classification", `**${result.spec.category}**`]);
      if (result.spec?.priority) tableRows.push(["Severity / Priority", `**${result.spec.priority}**`]);
      if (result.spec?.assignee) tableRows.push(["Assignee", `\`${result.spec.assignee}\``]);

      summary = summary.addTable([tableHeaders, ...tableRows]);

      if (result.spec?.rca) {
        summary = summary.addHeading("Root Cause Analysis", 3)
          .addQuote(result.spec.rca);
      }

      if (result.spec?.remediationSteps && result.spec.remediationSteps.length > 0) {
        summary = summary.addHeading("Suggested Remediation", 3)
          .addList(result.spec.remediationSteps);
      }

      if (result.selfHealing) {
        summary = summary.addHeading("🤖 Autonomous Self-Healing", 3);
        if (result.selfHealing.success && result.selfHealing.prUrl) {
          summary = summary.addRaw(`✅ **Auto-Fix PR Created:** [${result.selfHealing.prUrl}](${result.selfHealing.prUrl}) (Branch: \`${result.selfHealing.branchName}\`)<br>`);
          if (result.selfHealing.verifiedCommand) {
            summary = summary.addRaw(`🔬 **Verification Proof:** Sandbox test passed with \`${result.selfHealing.verifiedCommand}\`<br>`);
          }
        } else if (result.selfHealing.dryRun) {
          summary = summary.addRaw(`🧪 **Dry Run:** Code patch generated without creating PR.<br>`);
        } else if (result.selfHealing.attempted) {
          summary = summary.addRaw(`⚠️ **Self-Healing Failed:** ${result.selfHealing.reason}<br>`);
        }

        if (result.selfHealing.fix?.changes && result.selfHealing.fix.changes.length > 0) {
          const changeHeaders = [
            { data: "File Path", header: true },
            { data: "Action", header: true },
            { data: "Description", header: true },
          ];
          const changeRows = result.selfHealing.fix.changes.map((c) => [
            `\`${c.filePath}\``,
            `**${c.action.toUpperCase()}**`,
            c.changeDescription,
          ]);
          summary = summary.addTable([changeHeaders, ...changeRows]);
        }
      }

      await summary.write();
    } catch (sumErr) {
      core.warning(`Failed to write step summary: ${sumErr}`);
    }

    // Post or update sticky comment on Pull Request if running in PR context
    if (core.getInput("comment-pr") !== "false") {
      await maybePostPRStickyComment(octokit, ghCtx, result, event, issueKey, config.jira.baseUrl);
    }

    core.info(`PipelineIQ: ${result.action} ${issueKey || "(no issue)"}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(`PipelineIQ failed: ${message}`);
  }
}

async function maybePostPRStickyComment(
  octokit: Octokit,
  ghCtx: GhContext,
  result: any,
  event: any,
  issueKey: string,
  jiraBaseUrl: string,
): Promise<void> {
  const prNumber =
    ghCtx.payload?.pull_request?.number ||
    (ghCtx.payload as any)?.issue?.number;
  if (!prNumber) return;

  const marker = "<!-- pipelineiq-sticky-comment -->";
  const step = event.pipeline.step || event.failure.failedStep || "Unknown step";
  const exitCode = event.failure.exitCode !== undefined ? `Exit code ${event.failure.exitCode}` : "";
  const category = result.spec?.category || "General Failure";
  const rca = result.spec?.rca;
  const remediation = result.spec?.remediationSteps;

  const jiraLink = issueKey
    ? `🎫 **Jira Issue:** [${issueKey}](${jiraBaseUrl}/browse/${issueKey}) (${result.action})`
    : "";

  let selfHealingSection = "";
  if (result.selfHealing) {
    if (result.selfHealing.prUrl) {
      selfHealingSection = `\n### 🤖 Autonomous Self-Healing PR\n✅ **Fix PR Opened:** [${result.selfHealing.prUrl}](${result.selfHealing.prUrl})\nBranch: \`${result.selfHealing.branchName}\`\n`;
    } else if (result.selfHealing.dryRun) {
      selfHealingSection = `\n### 🤖 Autonomous Self-Healing\n🧪 **Dry Run:** Proposed patch generated successfully without pushing a remote branch.\n`;
    } else if (result.selfHealing.attempted) {
      selfHealingSection = `\n### 🤖 Autonomous Self-Healing\n⚠️ **Self-Healing Note:** ${result.selfHealing.reason || "Autonomous remediation could not be generated"}\n`;
    }
    if (result.selfHealing.fix?.changes) {
      const changesList = result.selfHealing.fix.changes
        .map((c: any) => `- \`${c.filePath}\` (**${c.action.toUpperCase()}**): ${c.changeDescription}`)
        .join("\n");
      selfHealingSection += `\n**Proposed File Changes:**\n${changesList}\n`;
    }
  }

  const commentBody = [
    marker,
    `## 🚨 PipelineIQ Failure Intelligence`,
    `> **Pipeline:** \`${event.pipeline.name}\` | **Step:** \`${step}\`${exitCode ? ` (\`${exitCode}\`)` : ""} | **Classification:** \`${category}\``,
    "",
    jiraLink,
    "",
    `<details open>`,
    `<summary><b>🔍 Failure Analysis & Remediation</b></summary>`,
    "",
    rca ? `**Root Cause:**\n${rca}\n` : "",
    Array.isArray(remediation) && remediation.length > 0
      ? `**Suggested Remediation:**\n${remediation.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n`
      : "",
    `</details>`,
    selfHealingSection,
    "",
    `---`,
    `*Automated operational intelligence by [PipelineIQ](https://github.com/meetpatel1111/PipelineIQ)*`,
  ].filter(Boolean).join("\n");

  try {
    const { data: comments } = await octokit.issues.listComments({
      owner: ghCtx.repo.owner,
      repo: ghCtx.repo.repo,
      issue_number: prNumber,
      per_page: 50,
    });

    const existing = comments.find((c) => c.body && c.body.includes(marker));
    if (existing) {
      await octokit.issues.updateComment({
        owner: ghCtx.repo.owner,
        repo: ghCtx.repo.repo,
        comment_id: existing.id,
        body: commentBody,
      });
      core.info(`PipelineIQ: Updated sticky comment on Pull Request #${prNumber}`);
    } else {
      await octokit.issues.createComment({
        owner: ghCtx.repo.owner,
        repo: ghCtx.repo.repo,
        issue_number: prNumber,
        body: commentBody,
      });
      core.info(`PipelineIQ: Created sticky comment on Pull Request #${prNumber}`);
    }
  } catch (commentErr) {
    core.debug(`PipelineIQ: Could not post PR sticky comment (likely missing pull-requests:write permission): ${commentErr}`);
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
    ...(core.getInput("user-mapping")
      ? {
          userMapping: (() => {
            try {
              return JSON.parse(core.getInput("user-mapping"));
            } catch {
              return undefined;
            }
          })(),
        }
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
