#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { spawn, execSync } from "child_process";
import { 
  processFailureEvent, 
  resolvePipelineSuccess,
  parseLogs, 
  AIEngine, 
  createJiraClient,
  PipelineIQConfigSchema,
  aiEnricher
} from "../core/index.js";
const pkg = JSON.parse(await fs.readFile(new URL("../../package.json", import.meta.url), "utf-8"));
import type {
  FailureEvent,
  PipelineIQConfig,
  FailureSource,
  LogFormat,
} from "../core/index.js";
import { Octokit } from "@octokit/rest";

const program = new Command();

program
  .name("pipelineiq")
  .description("CLI for PipelineIQ CI/CD failure intelligence")
  .version(pkg.version);

// Analyze command
program
  .command("analyze")
  .description("Analyze failure logs and create Jira tickets")
  .argument("[extraArgs...]", "Optional extra trailing arguments")
  .allowExcessArguments(true)
  .option("-p, --preset <preset>", "CI/CD platform preset to auto-populate environment and runner metadata (github, azure-devops, gitlab, bitbucket, circleci, jenkins, auto, none)", "auto")
  .option("-l, --logs <path>", "Path to log file or directory")
  .option("--stdin", "Read failure logs from standard input", false)
  .option("-f, --format <format>", "Log format (github-actions, azure-devops, gitlab, bitbucket, circleci, jenkins, terraform, kubernetes, docker, junit, generic)", "generic")
  .option("-s, --source <source>", "Failure source (github, azure-devops, gitlab, bitbucket, circleci, jenkins, generic)", "github")
  .option("-c, --config <path>", "Path to config file", "./pipelineiq.json")
  .option("--dry-run", "Show what would be done without creating Jira issues", false)
  .option("--github-token <token>", "GitHub token for API access")
  .option("--azure-token <token>", "Azure DevOps PAT for API access")
  .option("--environment <env>", "Deployment environment (dev/staging/production)")
  .option("--repository <repo>", "Repository name (owner/repo)")
  .option("--branch <branch>", "Branch name")
  .option("--commit <sha>", "Commit SHA")
  .option("--pipeline <name>", "Pipeline/workflow name")
  .option("--run-id <id>", "Run ID or build number")
  .option("--run-number <number>", "Run number")
  .option("--run-url <url>", "Run URL or pipeline URL")
  .option("--event-name <name>", "Event name (push, pull_request, etc.)")
  .option("--step <name>", "Failed step name override")
  .option("--stage <name>", "Failed stage name override")
  .option("--exit-code <code>", "Process exit code override")
  .option("--error-message <msg>", "Error message override")
  .option("--pr-number <number>", "Pull request or merge request number")
  .option("--pr-id <id>", "Pull request or merge request ID")
  .option("--pr-title <title>", "Pull request title")
  .option("--pr-source-branch <branch>", "Pull request source branch")
  .option("--pr-target-branch <branch>", "Pull request target branch")
  .option("--pr-source-commit <sha>", "Pull request source commit SHA")
  .option("--pr-destination-commit <sha>", "Pull request destination commit SHA")
  .option("--step-uuid <uuid>", "Step UUID override")
  .option("--pipeline-uuid <uuid>", "Pipeline UUID override")
  .option("--step-run-number <number>", "Step run attempt number")
  .option("--parallel-step <index>", "Parallel step index")
  .option("--parallel-step-count <count>", "Total parallel steps count")
  .option("--circleci-build-num <num>", "CircleCI build number")
  .option("--circleci-build-url <url>", "CircleCI build URL")
  .option("--circleci-job <job>", "CircleCI job name")
  .option("--circleci-branch <branch>", "CircleCI branch name")
  .option("--circleci-tag <tag>", "CircleCI tag name")
  .option("--circleci-sha1 <sha>", "CircleCI commit SHA")
  .option("--circleci-repository-url <url>", "CircleCI repository URL")
  .option("--circleci-project-username <user>", "CircleCI project username")
  .option("--circleci-project-reponame <repo>", "CircleCI project repo name")
  .option("--circleci-project-id <id>", "CircleCI project ID")
  .option("--circleci-organization-id <id>", "CircleCI organization ID")
  .option("--circleci-pipeline-id <id>", "CircleCI pipeline ID")
  .option("--circleci-pipeline-number <num>", "CircleCI pipeline number")
  .option("--circleci-workflow-id <id>", "CircleCI workflow ID")
  .option("--circleci-workflow-job-id <id>", "CircleCI workflow job ID")
  .option("--circleci-workflow-workspace-id <id>", "CircleCI workflow workspace ID")
  .option("--circleci-working-directory <path>", "CircleCI working directory")
  .option("--circleci-node-index <index>", "CircleCI node index")
  .option("--circleci-node-total <total>", "CircleCI node total")
  .option("--circleci-pr-number <num>", "CircleCI pull request number")
  .option("--circleci-pr-reponame <repo>", "CircleCI pull request repo name")
  .option("--circleci-pr-username <user>", "CircleCI pull request username")
  .option("--circleci-pull-request <url>", "CircleCI pull request URL")
  .option("--circleci-pull-requests <urls>", "CircleCI pull request URLs")
  .option("--circleci-username <user>", "CircleCI username")
  .option("--environment-id <id>", "Deployment environment ID")
  .option("--environment-tier <tier>", "Deployment environment tier (dev/staging/production)")
  .option("--environment-url <url>", "Deployment environment URL")
  .option("--environment-action <action>", "Deployment environment action")
  .option("--runner-id <id>", "Runner unique ID")
  .option("--runner-tags <tags>", "Runner tags (comma-separated)")
  .option("--runner-version <version>", "Runner version")
  .option("--actor-id <id>", "Triggering actor user ID")
  .option("--actor-email <email>", "Triggering actor email")
  .option("--project <key>", "Project key or namespace")
  .option("--tag <tag>", "Git tag name")
  .option("--run-attempt <count>", "Run attempt count")
  .option("--runner-os <os>", "Runner operating system")
  .option("--runner-arch <arch>", "Runner architecture")
  .option("--api-url <url>", "GitHub/Azure API URL")
  .option("--actor <name>", "Triggered by user")
  .option("--job-name <name>", "Specific job name")
  .option("--repository-owner <owner>", "Repository owner")
  .option("--action <name>", "Name of current action")
  .option("--action-path <path>", "Path to current action")
  .option("--action-repository <repo>", "Repository of current action")
  .option("--base-ref <ref>", "Target branch of PR")
  .option("--head-ref <ref>", "Source branch of PR")
  .option("--runner-temp <path>", "Runner temporary directory")
  .option("--runner-tool-cache <path>", "Runner tool cache path")
  .option("--runner-workspace <path>", "Runner workspace path")
  .option("--ref <ref>", "Full git ref")
  .option("--ref-protected <bool>", "Whether branch protections exist")
  .option("--retention-days <days>", "Log retention days")
  .option("--workflow-ref <ref>", "Workflow ref")
  .option("--workflow-sha <sha>", "Workflow SHA")
  .option("--graphql-url <url>", "GitHub GraphQL URL")
  .option("--workspace <path>", "Default workspace directory")
  .option("--job-status <status>", "Current job status")
  .option("--job-container <json>", "Job container details")
  .option("--job-services <json>", "Service container details")
  .option("--strategy-job-index <number>", "Current matrix job index")
  .option("--strategy-job-total <number>", "Total matrix jobs")
  .option("--action-ref <ref>", "Action git reference")
  .option("--action-status <status>", "Action execution status")
  .option("--repository-git-url <url>", "Git URL for the repository")
  .option("--secret-source <source>", "Secret source (Actions, etc)")
  .option("--agent-container-mapping <json>", "Mapping of container resource names to Docker IDs")
  .option("--agent-release-directory <path>", "Release artifacts directory")
  .option("--agent-root-directory <path>", "Working root directory of agent")
  .option("--pipeline-workspace <path>", "Pipeline workspace directory")
  .option("--system-debug <bool>", "Enables verbose logging")
  .option("--system-default-working-directory <path>", "Default working directory")
  .option("--system-team-foundation-collection-uri <url>", "Collection URI")
  .option("--release-deployment-requested-for <name>", "User requesting deployment")
  .option("--release-deployment-requested-for-email <email>", "Deployment requester email")
  .option("--release-deployment-id <id>", "Deployment ID")
  .option("--release-definition-environment-id <id>", "Release environment ID")
  .option("--release-definition-id <id>", "Release definition ID")
  .option("--release-definition-name <name>", "Release definition name")
  .option("--release-environment-id <id>", "Release environment ID")
  .option("--release-environment-name <name>", "Release environment name")
  .option("--release-primary-artifact-source-alias <alias>", "Primary artifact alias")
  .option("--release-description <text>", "Release description")
  .option("--release-id <id>", "Release ID")
  .option("--release-name <name>", "Release name")
  .option("--release-uri <url>", "Release URI")
  .option("--agent-id <id>", "Unique ID of agent")
  .option("--agent-name <name>", "Name of agent")
  .option("--agent-machine-name <name>", "Machine name of agent host")
  .option("--agent-build-directory <path>", "Local path on agent where build folders are created")
  .option("--agent-home-directory <path>", "Directory where agent is installed")
  .option("--agent-temp-directory <path>", "Temp directory used by agent")
  .option("--agent-tools-directory <path>", "Tool cache directory")
  .option("--agent-work-folder <path>", "Agent work directory")
  .option("--artifact-staging-directory <path>", "Directory where artifacts are copied before publishing")
  .option("--binaries-directory <path>", "Output directory for binaries")
  .option("--container-id <id>", "Artifact container ID")
  .option("--definition-version <version>", "Build definition version")
  .option("--repository-local-path <path>", "Local path of the repository")
  .option("--sources-directory <path>", "Directory where source code is downloaded")
  .option("--staging-directory <path>", "Staging directory for build artifacts")
  .option("--test-results-directory <path>", "Directory where test results are stored")
  .option("--event-payload <json>", "Full JSON event payload")
  .option("--stage-requested-by <name>", "User who manually triggered the stage (Build.StageRequestedBy)")
  .option("--stage-requested-for-id <id>", "GUID of user who triggered the stage (Build.StageRequestedForId)")
  .option("--source-tfvc-shelveset <name>", "TFVC shelveset name for gated/shelveset builds (Build.SourceTfvcShelveset)")
  .option("--issue-type <type>", "Jira issue type to create (default from config)")
  .option("--dedup-window <hours>", "Deduplication window in hours (default from config)")
  .option("--jira-url <url>", "Jira base URL")
  .option("--jira-email <email>", "Jira user email")
  .option("--jira-token <token>", "Jira API token")
  .option("--jira-project <key>", "Jira project key")
  .option("--ai-mode <mode>", "AI mode (disabled | assist | full)")
  .option("--ai-api-key <key>", "AI API key")
  .option("--ai-provider <provider>", "AI provider (openai | anthropic | azure-openai | gemini)")
  .option("-m, --ai-model <model>", "AI model to use (e.g. gpt-4, gemini-3.1-flash-lite)")
  .option("--ai-max-tokens <tokens>", "Maximum output tokens for AI response")
  .option("--ai-thinking", "Enable extended thinking/reasoning for models that support it (Gemini 2.5+, Claude 3.7+)")
  .option("--ai-thinking-budget <tokens>", "Token budget for thinking (default: 8000, -1 = dynamic)", parseInt)
  .option("--assignee <id>", "Jira account ID to assign the issue to (defaults to unassigned)")
  .option("--default-assignee <id>", "Alias for --assignee (defaults to unassigned)")
  .option("--display-meta <fields>", "Comma-separated list of metadata fields to display", (val) => val.split(","))
  .option("--meta <key=value>", "Custom metadata to include in the ticket (can be repeated)", (val, memo: string[]) => {
    memo.push(val);
    return memo;
  }, [])
  .option("--ai-endpoint <url>", "Base URL for local AI provider (e.g. http://localhost:11434/v1)")
  .option("--slack-webhook <url>", "Slack incoming webhook URL — enables Slack notifications")
  .option("--slack-channel <channel>", "Slack channel override (e.g. #incidents)")
  .option("--slack-notify-on <severities>", "Comma-separated severities that trigger Slack (e.g. Critical,High)", (val) => val.split(","))
  .option("--slack-username <name>", "Slack bot display name")
  .option("--no-slack-metrics", "Omit MTTR/blast-radius row from Slack messages")
  .option("--teams-webhook <url>", "Teams incoming webhook URL — enables Teams notifications")
  .option("--teams-notify-on <severities>", "Comma-separated severities that trigger Teams (e.g. Critical)", (val) => val.split(","))
  .option("--no-teams-metrics", "Omit MTTR/blast-radius facts from Teams messages")
  .option("--no-notifications", "Disable all notifications for this run (overrides config)")
  .option("--self-heal", "Enable self-healing (auto-fix + PR creation)")
  .option("--self-heal-dry-run", "Generate fix but don't create PR")
  .option("--self-heal-confidence <threshold>", "Minimum AI confidence for self-healing (0-1)")
  .option("--self-heal-max-files <count>", "Maximum files a fix can change")
  .option("--self-heal-max-lines <count>", "Maximum lines a fix can change")
  .option("--self-heal-draft", "Create draft PR (default: true)")
  .option("--self-heal-guardrails", "Enforce self-healing safety guardrails", true)
  .option("--no-self-heal-guardrails", "Disable self-healing safety guardrails (allow wider fixes)")
  .option("--self-heal-reviewers <users>", "Comma-separated PR reviewers", (val) => val.split(","))
  .option("--self-heal-labels <labels>", "Comma-separated PR labels", (val) => val.split(","))
  .option("--self-heal-categories <cats>", "Comma-separated allowed failure categories", (val) => val.split(","))
  .option("--self-heal-verify", "Enable local verification commands (compilation/testing/regeneration)")
  .option("--self-heal-verification-commands <commands>", "Comma-separated verification commands", (val) => val.split(","))
  .option("--self-heal-auto-lockfile", "Enable automatic package-lock.json regeneration (default: true)", true)
  .option("--no-self-heal-auto-lockfile", "Disable automatic package-lock.json regeneration")
  .action(async (...args: any[]) => {
    let options: any = {};
    let extra: string[] = [];

    if (args.length >= 2 && Array.isArray(args[0])) {
      extra = args[0];
      options = args[1] || {};
    } else if (args.length >= 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
      options = args[0];
    }

    if (extra.length > 0 && options.pipeline) {
      options.pipeline = [options.pipeline, ...extra].join(" ");
    }

    await handleAnalyze(options);
  });

// Config command
program
  .command("config")
  .description("Manage PipelineIQ configuration")
  .option("-i, --init", "Initialize configuration file", false)
  .option("-s, --show", "Show current configuration", false)
  .option("-v, --validate", "Validate configuration", false)
  .action(async (options) => {
    await handleConfig(options);
  });

// Init command
program
  .command("init")
  .description("Interactive setup wizard to initialize pipelineiq.json configuration")
  .action(async () => {
    await initConfig();
  });

// Parse command
program
  .command("parse")
  .description("Parse and analyze log files")
  .option("-l, --logs <path>", "Path to log file or directory", "")
  .option("-f, --format <format>", "Log format", "generic")
  .option("-o, --output <path>", "Output file for parsed results", "./parsed-logs.json")
  .action(async (options) => {
    await handleParse(options);
  });

// Test command
program
  .command("test")
  .description("Test PipelineIQ configuration and connectivity")
  .option("-c, --config <path>", "Path to config file", "./pipelineiq.json")
  .option("--jira", "Test Jira connectivity", false)
  .option("--ai", "Test AI provider", false)
  .option("--ai-provider <provider>", "AI provider to test")
  .option("--ai-model <model>", "AI model to test")
  .option("--ai-api-key <key>", "AI API key to test")
  .action(async (options) => {
    await handleTest(options);
  });

// Resolve command
program
  .command("resolve")
  .description("Auto-resolve open Jira incident tickets when a pipeline succeeds")
  .option("-c, --config <path>", "Path to config file", "./pipelineiq.json")
  .option("-p, --preset <preset>", "CI/CD platform preset (github, azure-devops, auto, none)", "auto")
  .option("-s, --source <source>", "Pipeline source (github, azure-devops)", "github")
  .option("--repository <repo>", "Repository name (owner/repo)")
  .option("--branch <branch>", "Branch name")
  .option("--commit <sha>", "Commit SHA")
  .option("--pipeline <name>", "Pipeline/workflow name")
  .option("--run-id <id>", "Run ID or build number")
  .option("--run-number <number>", "Run number")
  .option("--run-url <url>", "Run URL or pipeline URL")
  .option("--jira-url <url>", "Jira base URL")
  .option("--jira-email <email>", "Jira user email")
  .option("--jira-token <token>", "Jira API token")
  .option("--jira-project <key>", "Jira project key")
  .action(async (options) => {
    await handleResolve(options);
  });

// Exec command: wraps command execution, captures logs, and reports failures directly to Jira
program
  .command("exec <cmd...>")
  .description("Execute a command, capture its logs, and report failures directly to Jira")
  .allowUnknownOption(true)
  .option("-c, --config <path>", "Path to config file", "./pipelineiq.json")
  .option("-p, --preset <preset>", "CI/CD platform preset (github, azure-devops, gitlab, bitbucket, circleci, jenkins, auto, none)", "auto")
  .action(async (cmdArgs: string[], options: any) => {
    const exitCode = await handleExec(cmdArgs, options);
    process.exit(exitCode);
  });

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

export async function handleExec(cmdArgs: string[], cmdOptions: any = {}): Promise<number> {
  if (!cmdArgs || cmdArgs.length === 0) {
    console.error(chalk.red("Error: No command specified to execute. Usage: pipelineiq exec -- <command>"));
    return 1;
  }

  const fullCommand = cmdArgs.join(" ");
  const child = spawn(fullCommand, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  const chunks: string[] = [];

  child.stdout?.on("data", (data) => {
    process.stdout.write(data);
    chunks.push(data.toString());
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(data);
    chunks.push(data.toString());
  });

  const exitCode = await new Promise<number>((resolve) => {
    child.on("close", (code) => {
      resolve(code ?? 0);
    });
    child.on("error", (err) => {
      console.error(chalk.red(`Failed to run command "${fullCommand}": ${err.message}`));
      resolve(1);
    });
  });

  if (exitCode === 0) {
    try {
      const config = await loadConfig(cmdOptions.config || "./pipelineiq.json");
      if (config?.dedup?.autoResolveOnSuccess) {
        const resolveOpts = applyCIPreset({ ...cmdOptions });
        await handleResolve(resolveOpts);
      }
    } catch {
      // Ignore resolution errors on clean exit
    }
    return 0;
  }

  console.log(chalk.bold.yellow(`\n[PipelineIQ] Command failed with exit code ${exitCode}. Reporting failure to Jira...`));
  const fullLog = chunks.join("");
  const analyzeOpts = applyCIPreset({
    ...cmdOptions,
    rawLogContent: fullLog,
    format: "generic",
    noExit: true,
  });
  analyzeOpts.pipeline ??= `Run: ${fullCommand}`.trim();

  try {
    await handleAnalyze(analyzeOpts);
  } catch (err: any) {
    console.error(chalk.red(`[PipelineIQ] Error reporting failure to Jira: ${err.message}`));
  }

  return exitCode;
}

async function handleAnalyze(rawOptions: any) {
  const options = applyCIPreset(rawOptions);
  if (options.status === "success") {
    await handleResolve(rawOptions);
    return;
  }
  const spinner = ora("Analyzing failure...").start();

  try {
    // Load configuration (raw data)
    let configData = await loadConfig(options.config);
    
    // Override config with CLI options if provided
    if (options.jiraUrl) configData.jira.baseUrl = options.jiraUrl.trim();
    if (options.jiraEmail) configData.jira.email = options.jiraEmail.trim();
    if (options.jiraToken) configData.jira.apiToken = options.jiraToken.trim();
    if (options.jiraProject) configData.jiraProject = options.jiraProject.trim();
    if (options.issueType) configData.issueType = options.issueType.trim();
    if (options.assignee || options.defaultAssignee) {
      configData.defaultAssignee = (options.assignee || options.defaultAssignee).trim();
    }
    if (options.dedupWindow) configData.dedup.windowHours = parseInt(options.dedupWindow);
    if (options.aiMode) configData.ai.mode = options.aiMode.trim();
    if (options.aiApiKey) configData.ai.apiKey = options.aiApiKey.trim();
    if (options.aiProvider) configData.ai.provider = options.aiProvider.trim();
    if (options.aiModel) configData.ai.model = options.aiModel.trim();
    if (options.aiMaxTokens) configData.ai.maxLogTokens = Number.parseInt(options.aiMaxTokens, 10);
    if (options.aiEndpoint) configData.ai.endpoint = options.aiEndpoint.trim();
    if (options.aiThinking !== undefined) configData.ai.enableThinking = options.aiThinking;
    if (options.aiThinkingBudget !== undefined) configData.ai.thinkingBudget = options.aiThinkingBudget;
    if (options.displayMeta) configData.displayMetadata = options.displayMeta;

    // Notification flag overrides — build up notifications block from CLI flags
    if (options.notifications === false) {
      // --no-notifications: disable master switch (keeps any existing config)
      configData.notifications = { ...configData.notifications, enabled: false };
    } else {
      if (options.slackWebhook) {
        configData.notifications ??= {};
        configData.notifications.slack ??= { webhookUrl: options.slackWebhook };
        configData.notifications.slack.webhookUrl = options.slackWebhook.trim();
        if (options.slackChannel) configData.notifications.slack.channel = options.slackChannel.trim();
        if (options.slackNotifyOn) configData.notifications.slack.notifyOn = options.slackNotifyOn;
        if (options.slackUsername) configData.notifications.slack.username = options.slackUsername.trim();
        if (options.slackMetrics === false) configData.notifications.slack.includeMetrics = false;
      }
      if (options.teamsWebhook) {
        configData.notifications ??= {};
        configData.notifications.teams ??= { webhookUrl: options.teamsWebhook };
        configData.notifications.teams.webhookUrl = options.teamsWebhook.trim();
        if (options.teamsNotifyOn) configData.notifications.teams.notifyOn = options.teamsNotifyOn;
        if (options.teamsMetrics === false) configData.notifications.teams.includeMetrics = false;
      }
    }

    // Self-healing flag overrides
    if (options.selfHeal) {
      configData.selfHealing ??= { enabled: true };
      configData.selfHealing.enabled = true;
      if (options.selfHealDryRun) configData.selfHealing.dryRun = true;
      if (options.selfHealConfidence) configData.selfHealing.minConfidence = parseFloat(options.selfHealConfidence);
      if (options.selfHealMaxFiles) configData.selfHealing.maxFilesChanged = parseInt(options.selfHealMaxFiles);
      if (options.selfHealMaxLines) configData.selfHealing.maxLinesChanged = parseInt(options.selfHealMaxLines);
      if (options.selfHealDraft !== undefined) configData.selfHealing.draftPr = options.selfHealDraft;
      if (options.selfHealGuardrails !== undefined) configData.selfHealing.enableGuardrails = options.selfHealGuardrails;
      if (options.selfHealReviewers) configData.selfHealing.reviewers = options.selfHealReviewers;
      if (options.selfHealLabels) configData.selfHealing.prLabels = options.selfHealLabels;
      if (options.selfHealCategories) configData.selfHealing.allowedCategories = options.selfHealCategories;
      if (options.selfHealVerify !== undefined) configData.selfHealing.enableVerification = options.selfHealVerify;
      if (options.selfHealVerificationCommands !== undefined) configData.selfHealing.verificationCommands = options.selfHealVerificationCommands;
      if (options.selfHealAutoLockfile !== undefined) configData.selfHealing.autoRegenerateLockfile = options.selfHealAutoLockfile;
    }

    if (configData.selfHealing) {
      if (options.githubToken) configData.selfHealing.githubToken = options.githubToken.trim();
      if (options.azureToken) configData.selfHealing.azureToken = options.azureToken.trim();
    }

    // Now validate the fully merged configuration
    const config = PipelineIQConfigSchema.parse(configData);
    
    // Read and parse logs or fetch from platform API
    let event: FailureEvent;
    
    if (options.logs) {
      const logContent = await readLogs(options.logs);
      const parsedLogs = parseLogs(logContent, {
        format: (options.format || "generic") as LogFormat,
        extractStackTraces: true,
        extractErrorMessages: true,
        extractExitCodes: true,
        extractCommands: true,
      });
      event = await createFailureEvent(options.source as FailureSource, parsedLogs, options);
    } else if (options.rawLogContent) {
      const parsedLogs = parseLogs(options.rawLogContent, {
        format: (options.format || "generic") as LogFormat,
        extractStackTraces: true,
        extractErrorMessages: true,
        extractExitCodes: true,
        extractCommands: true,
      });
      event = await createFailureEvent(options.source as FailureSource, parsedLogs, options);
    } else if (options.stdin) {
      spinner.text = "Reading logs from stdin...";
      const logContent = await readStdin();
      const parsedLogs = parseLogs(logContent, {
        format: (options.format || "generic") as LogFormat,
        extractStackTraces: true,
        extractErrorMessages: true,
        extractExitCodes: true,
        extractCommands: true,
      });
      event = await createFailureEvent(options.source as FailureSource, parsedLogs, options);
    } else {
      spinner.text = "Fetching logs from platform API...";
      event = await fetchEventFromPlatform(options);
    }
    
    spinner.text = "Initializing Jira client...";
    const jira = createJiraClient(config.jira);
    const isConnected = await jira.checkConnection();
    if (!isConnected) {
      throw new Error(`Could not connect to Jira at ${config.jira.baseUrl}. Please check your email and API token.`);
    }

    spinner.text = "Analyzing failure with PipelineIQ...";
    
    // Identify which fields were explicitly provided via CLI
    const explicitFields: string[] = [];
    const flagMap: Record<string, string> = {
      pipeline: "pipeline",
      repository: "repository",
      branch: "branch",
      commit: "commit",
      environment: "environment",
      runId: "runNumber", // Map runId to runNumber for display
      runNumber: "runNumber",
      runUrl: "runUrl",
      runAttempt: "runAttempt",
      runnerOs: "runnerOs",
      runnerArch: "runnerArch",
      runnerName: "runnerName",
      jobName: "jobName",
      eventName: "eventName",
      actor: "triggeredBy",
      apiUrl: "apiUrl",
      graphqlUrl: "graphqlUrl",
      repositoryOwner: "repositoryOwner",
      action: "action",
      actionPath: "actionPath",
      actionRepository: "actionRepository",
      baseRef: "baseRef",
      headRef: "headRef",
      runnerTemp: "runnerTemp",
      runnerToolCache: "runnerToolCache",
      runnerWorkspace: "runnerWorkspace",
      ref: "ref",
      refProtected: "refProtected",
      retentionDays: "retentionDays",
      workflowRef: "workflowRef",
      workflowSha: "workflowSha",
      workspace: "workspace",
      jobStatus: "jobStatus",
      jobContainer: "jobContainer",
      jobServices: "jobServices",
      strategyJobIndex: "strategyJobIndex",
      strategyJobTotal: "strategyJobTotal",
      actionRef: "actionRef",
      actionStatus: "actionStatus",
      repositoryGitUrl: "repositoryGitUrl",
      secretSource: "secretSource",
      agentContainerMapping: "agentContainerMapping",
      agentReleaseDirectory: "agentReleaseDirectory",
      agentRootDirectory: "agentRootDirectory",
      pipelineWorkspace: "pipelineWorkspace",
      systemDebug: "systemDebug",
      systemDefaultWorkingDirectory: "systemDefaultWorkingDirectory",
      systemTeamFoundationCollectionUri: "systemTeamFoundationCollectionUri",
      releaseDeploymentRequestedFor: "releaseDeploymentRequestedFor",
      releaseDeploymentRequestedForEmail: "releaseDeploymentRequestedForEmail",
      releaseDeploymentId: "releaseDeploymentId",
      releaseDefinitionEnvironmentId: "releaseDefinitionEnvironmentId",
      releaseDefinitionId: "releaseDefinitionId",
      releaseDefinitionName: "releaseDefinitionName",
      releaseEnvironmentId: "releaseEnvironmentId",
      releaseEnvironmentName: "releaseEnvironmentName",
      releasePrimaryArtifactSourceAlias: "releasePrimaryArtifactSourceAlias",
      releaseDescription: "releaseDescription",
      releaseId: "releaseId",
      releaseName: "releaseName",
      releaseUri: "releaseUri",
      eventPayload: "eventPayload",
    };

    for (const [flag, metaKey] of Object.entries(flagMap)) {
      if (options[flag] !== undefined) {
        explicitFields.push(metaKey);
      }
    }

    // Process with PipelineIQ
    const result = await processFailureEvent({
      ...event,
      explicitFields: [...(event.explicitFields || []), ...explicitFields]
    }, config, {
      extraEnrichers: [aiEnricher],
    });

    spinner.succeed();

    if (options.dryRun) {
      console.log(chalk.blue("Dry run - would create/update Jira issue:"));
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.action === "skipped") {
        console.log(chalk.yellow(`⚠ ${result.action}: ${result.reason}`));
      } else {
        console.log(chalk.green(`✓ ${result.action}: ${result.issueKey}`));
      }

      // Display self-healing results
      if (result.selfHealing) {
        const sh = result.selfHealing;
        if (sh.success && sh.prUrl) {
          console.log(chalk.magenta(`\n🤖 Self-Healing PR Created:`));
          console.log(chalk.magenta(`   PR: ${sh.prUrl}`));
          console.log(chalk.magenta(`   Branch: ${sh.branchName}`));
          console.log(chalk.magenta(`   Confidence: ${Math.round((sh.fix?.confidence ?? 0) * 100)}%`));
          console.log(chalk.magenta(`   Risk: ${sh.fix?.riskLevel ?? "unknown"}`));
          if (sh.fix?.changes) {
            console.log(chalk.magenta(`   Changes Proposed:`));
            for (const change of sh.fix.changes) {
              console.log(chalk.magenta(`     - [${change.action.toUpperCase()}] ${change.filePath} (${change.changeDescription})`));
            }
          }
          console.log(chalk.dim(`   ⚠ Requires human review before merging`));
        } else if (sh.dryRun && sh.fix) {
          console.log(chalk.cyan(`\n🧪 Self-Healing Dry Run — Fix Generated:`));
          console.log(chalk.cyan(`   Title: ${sh.fix.title}`));
          console.log(chalk.cyan(`   Confidence: ${Math.round(sh.fix.confidence * 100)}%`));
          console.log(chalk.cyan(`   Risk: ${sh.fix.riskLevel}`));
          if (sh.fix.changes) {
            console.log(chalk.cyan(`   Changes Proposed:`));
            for (const change of sh.fix.changes) {
              console.log(chalk.cyan(`     - [${change.action.toUpperCase()}] ${change.filePath} (${change.changeDescription})`));
            }
          }
        } else if (sh.attempted && !sh.success) {
          console.log(chalk.yellow(`\n⚠ Self-Healing Failed: ${sh.reason}`));
        }
      }
    }
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    if (options.noExit) {
      throw error;
    }
    process.exit(1);
  }
}

async function handleConfig(options: any) {
  try {
    if (options.init) {
      await initConfig();
      return;
    }

    if (options.show) {
      const config = await loadConfig("./pipelineiq.json");
      console.log(chalk.blue("Current configuration:"));
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    if (options.validate) {
      const config = await loadConfig(options.config);
      const validation = PipelineIQConfigSchema.safeParse(config);
      
      if (validation.success) {
        console.log(chalk.green("✓ Configuration is valid"));
      } else {
        console.log(chalk.red("✗ Configuration validation failed:"));
        console.error(validation.error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

async function handleParse(options: any) {
  const spinner = ora("Parsing logs...").start();

  try {
    const logContent = await readLogs(options.logs);
    const parsedLogs = parseLogs(logContent, {
      format: options.format as LogFormat,
      extractStackTraces: true,
      extractErrorMessages: true,
      extractExitCodes: true,
      extractCommands: true,
    });

    spinner.succeed();
    
    await fs.writeJson(options.output, parsedLogs, { spaces: 2 });
    console.log(chalk.green(`✓ Parsed logs saved to ${options.output}`));
    
    // Show summary
    console.log(chalk.blue("\nParsing Summary:"));
    console.log(`- Total entries: ${parsedLogs.entries.length}`);
    console.log(`- Error messages: ${parsedLogs.errorMessages.length}`);
    console.log(`- Stack traces: ${parsedLogs.stackTraces.length}`);
    console.log(`- Exit codes: ${parsedLogs.exitCodes.length}`);
    console.log(`- Failed commands: ${parsedLogs.failedCommands.length}`);
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

async function handleTest(options: any) {
  try {
    const config = await loadConfig(options.config);
    
    // Override with CLI options
    if (options.aiProvider) config.ai.provider = options.aiProvider;
    if (options.aiModel) config.ai.model = options.aiModel;
    if (options.aiApiKey) config.ai.apiKey = options.aiApiKey;


    if (options.jira) {
      const spinner = ora("Testing Jira connectivity...").start();
      const jira = createJiraClient(config.jira);
      
      try {
        const connected = await jira.checkConnection();
        if (!connected) {
          throw new Error(`Failed to authenticate with Jira instance at ${config.jira.baseUrl}`);
        }
        const serverInfo = await jira.getServerInfo();
        spinner.succeed();
        const serverTitle = serverInfo?.serverTitle || "Jira";
        const versionStr = serverInfo?.version ? ` v${serverInfo.version}` : "";
        console.log(chalk.green(`✓ Jira connectivity test passed (${serverTitle}${versionStr})`));
      } catch (error) {
        spinner.fail();
        console.log(chalk.red("✗ Jira connectivity test failed:"));
        console.error(error instanceof Error ? error.message : String(error));
      }
    }

    if (options.ai && config.ai.mode !== "disabled") {
      const spinner = ora("Testing AI provider...").start();
      
      try {
        const aiEngine = AIEngine.create(config.ai.mode as any, config.ai);
        
        if (aiEngine.isAvailable()) {
          spinner.succeed();
          console.log(chalk.green(`✓ AI provider "${aiEngine.getProvider()}" is available`));
        } else {
          spinner.warn();
          console.log(chalk.yellow(`⚠ AI provider "${config.ai.provider}" is not available`));
        }
      } catch (error) {
        spinner.fail();
        console.log(chalk.red("✗ AI provider test failed:"));
        console.error(error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

async function handleResolve(rawOptions: any) {
  const options = applyCIPreset(rawOptions);
  const spinner = ora("Checking for open incidents to auto-resolve...").start();

  try {
    const configData = await loadConfig(options.config);
    if (options.jiraUrl) configData.jira.baseUrl = options.jiraUrl.trim();
    if (options.jiraEmail) configData.jira.email = options.jiraEmail.trim();
    if (options.jiraToken) configData.jira.apiToken = options.jiraToken.trim();
    if (options.jiraProject) configData.jiraProject = options.jiraProject.trim();

    const config = PipelineIQConfigSchema.parse(configData);

    const event: FailureEvent = {
      source: (options.source || "github") as FailureSource,
      startedAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      repository: {
        owner: options.repository?.split("/")[0] || process.env.GITHUB_REPOSITORY_OWNER || "unknown",
        name: options.repository?.split("/")[1] || options.repository || "unknown",
        url: options.repositoryGitUrl || `https://github.com/${options.repository || "unknown"}`,
        defaultBranch: "main",
      },
      branch: options.branch || process.env.GITHUB_REF_NAME || "main",
      commit: {
        sha: options.commit || process.env.GITHUB_SHA || "unknown",
        url: "",
        message: "",
      },
      pipeline: {
        name: options.pipeline || process.env.GITHUB_WORKFLOW || "pipeline",
        runId: String(options.runId || process.env.GITHUB_RUN_ID || "1"),
        runNumber: options.runNumber ? Number.parseInt(options.runNumber, 10) : undefined,
        url: options.runUrl || process.env.GITHUB_SERVER_URL || "",
        step: options.step || "Execution",
      },
      failure: {
        logs: "",
        logsTruncated: false,
      },
      environment: options.environment,
      metadata: {},
      explicitFields: [],
    };

    const result = await resolvePipelineSuccess(event, config);
    if (result.action === "resolved") {
      spinner.succeed(chalk.green(result.message));
    } else {
      spinner.info(chalk.blue(result.message));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Auto-resolve failed: ${error.message || error}`));
    process.exit(1);
  }
}

/**
 * Automatically applies CI/CD platform defaults (GitHub Actions, Azure DevOps)
 * to options while preserving any user-specified CLI flags.
 */
export function applyCIPreset(rawOptions: any = {}): any {
  const options = { ...rawOptions };
  const preset = options.preset || "auto";

  if (preset === "none") {
    return options;
  }

  const isGithub = preset === "github" || preset === "github-actions" || 
    (preset === "auto" && (Boolean(process.env.GITHUB_ACTIONS) || options.format === "github-actions" || options.source === "github"));

  const isAzure = preset === "azure-devops" || preset === "azure" ||
    (preset === "auto" && (Boolean(process.env.TF_BUILD) || options.format === "azure-devops" || options.source === "azure-devops" || Boolean(process.env.SYSTEM_COLLECTIONURI)));

  const isGitLab = preset === "gitlab" || preset === "gitlab-ci" ||
    (preset === "auto" && (Boolean(process.env.GITLAB_CI) || options.format === "gitlab" || options.source === "gitlab"));

  const isBitbucket = preset === "bitbucket" || preset === "bitbucket-pipelines" ||
    (preset === "auto" && (Boolean(process.env.BITBUCKET_BUILD_NUMBER) || options.format === "bitbucket" || options.source === "bitbucket"));

  const isCircleCI = preset === "circleci" ||
    (preset === "auto" && (Boolean(process.env.CIRCLECI) || options.format === "circleci" || options.source === "circleci"));

  const isJenkins = preset === "jenkins" ||
    (preset === "auto" && (Boolean(process.env.JENKINS_URL) || options.format === "jenkins" || options.source === "jenkins"));

  // Common environment variables for Jira & AI if not explicitly passed as CLI flags
  options.jiraUrl ??= process.env.JIRA_URL;
  options.jiraEmail ??= process.env.JIRA_EMAIL;
  options.jiraToken ??= process.env.JIRA_TOKEN;
  options.jiraProject ??= process.env.JIRA_PROJECT;
  options.aiApiKey ??= process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!options.aiProvider) {
    if (process.env.AI_PROVIDER) options.aiProvider = process.env.AI_PROVIDER;
    else if (process.env.GEMINI_API_KEY) options.aiProvider = "gemini";
    else if (process.env.ANTHROPIC_API_KEY) options.aiProvider = "anthropic";
    else if (process.env.OPENAI_API_KEY) options.aiProvider = "openai";
  }
  if (!options.aiModel && process.env.AI_MODEL) options.aiModel = process.env.AI_MODEL;
  if (!options.aiMode && (options.aiApiKey || process.env.AI_API_KEY)) {
    options.aiMode = process.env.AI_MODE || "assist";
  }

  if (isGithub) {
    options.source ??= "github";
    if (!options.format || options.format === "generic") {
      options.format = "github-actions";
    }
    options.githubToken ??= process.env.GITHUB_TOKEN;
    options.repository ??= process.env.GITHUB_REPOSITORY;
    options.branch ??= process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || process.env.GITHUB_REF;
    options.commit ??= process.env.GITHUB_SHA;
    options.pipeline ??= process.env.GITHUB_WORKFLOW;
    options.runId ??= process.env.GITHUB_RUN_ID;
    options.runNumber ??= process.env.GITHUB_RUN_NUMBER;
    options.actor ??= process.env.GITHUB_ACTOR;
    options.eventName ??= process.env.GITHUB_EVENT_NAME;
    options.runAttempt ??= process.env.GITHUB_RUN_ATTEMPT;
    options.runnerOs ??= process.env.RUNNER_OS;
    options.runnerArch ??= process.env.RUNNER_ARCH;
    options.apiUrl ??= process.env.GITHUB_API_URL || "https://api.github.com";
    options.jobName ??= process.env.GITHUB_JOB;
    options.repositoryOwner ??= process.env.GITHUB_REPOSITORY_OWNER;
    options.environment ??= process.env.GITHUB_REF_NAME;
    options.runUrl ??= (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID)
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  } else if (isAzure) {
    options.source ??= "azure-devops";
    if (!options.format || options.format === "generic") {
      options.format = "azure-devops";
    }
    options.azureToken ??= process.env.SYSTEM_ACCESSTOKEN || process.env.AZURE_DEVOPS_EXT_PAT;
    options.repository ??= process.env.BUILD_REPOSITORY_NAME;
    options.branch ??= process.env.BUILD_SOURCEBRANCHNAME || process.env.BUILD_SOURCEBRANCH;
    options.commit ??= process.env.BUILD_SOURCEVERSION;
    options.pipeline ??= process.env.BUILD_DEFINITIONNAME;
    options.runId ??= process.env.BUILD_BUILDID;
    options.runNumber ??= process.env.BUILD_BUILDNUMBER;
    options.actor ??= process.env.BUILD_REQUESTEDFOR || process.env.BUILD_QUEUEDBY;
    options.eventName ??= process.env.BUILD_REASON;
    options.runAttempt ??= process.env.SYSTEM_STAGEATTEMPT;
    options.runnerOs ??= process.env.AGENT_OS;
    options.runnerArch ??= process.env.AGENT_OSARCHITECTURE;
    options.jobName ??= process.env.AGENT_JOBNAME;
    options.environment ??= process.env.ENVIRONMENT_NAME || process.env.BUILD_SOURCEBRANCHNAME || process.env.BUILD_SOURCEBRANCH;
    options.apiUrl ??= process.env.SYSTEM_COLLECTIONURI;
    options.project ??= process.env.SYSTEM_TEAMPROJECT;
    options.runUrl ??= (process.env.SYSTEM_COLLECTIONURI && process.env.SYSTEM_TEAMPROJECT && process.env.BUILD_BUILDID)
      ? `${process.env.SYSTEM_COLLECTIONURI.replace(/\/$/, "")}/${process.env.SYSTEM_TEAMPROJECT}/_build/results?buildId=${process.env.BUILD_BUILDID}`
      : undefined;
  } else if (isGitLab) {
    options.source ??= "gitlab";
    if (!options.format || options.format === "generic") {
      options.format = "gitlab";
    }
    options.gitlabToken ??= process.env.GITLAB_TOKEN || process.env.CI_JOB_TOKEN;
    options.repository ??= process.env.CI_PROJECT_PATH;
    options.repositoryOwner ??= process.env.CI_PROJECT_ROOT_NAMESPACE || process.env.CI_PROJECT_NAMESPACE;
    options.repositoryGitUrl ??= process.env.CI_REPOSITORY_URL;
    options.branch ??= process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME || process.env.CI_COMMIT_BRANCH || process.env.CI_COMMIT_REF_NAME;
    options.commit ??= process.env.CI_COMMIT_SHA;
    options.pipeline ??= process.env.CI_PIPELINE_NAME || (process.env.CI_JOB_STAGE && process.env.CI_JOB_NAME ? `${process.env.CI_JOB_STAGE} / ${process.env.CI_JOB_NAME}` : undefined) || process.env.CI_JOB_NAME || process.env.CI_PIPELINE_ID;
    options.runId ??= process.env.CI_PIPELINE_ID;
    options.runNumber ??= process.env.CI_PIPELINE_IID || process.env.CI_PIPELINE_ID;
    options.actor ??= process.env.GITLAB_USER_LOGIN || process.env.GITLAB_USER_NAME || process.env.GITLAB_USER_EMAIL;
    options.actorId ??= process.env.GITLAB_USER_ID;
    options.jobName ??= process.env.CI_JOB_NAME;
    options.stage ??= process.env.CI_JOB_STAGE;
    options.jobStatus ??= process.env.CI_JOB_STATUS;
    options.eventName ??= process.env.CI_PIPELINE_SOURCE;
    options.runAttempt ??= process.env.CI_JOB_RETRY_COUNT ? String(parseInt(process.env.CI_JOB_RETRY_COUNT, 10) + 1) : undefined;
    options.environment ??= process.env.CI_ENVIRONMENT_NAME || process.env.CI_COMMIT_REF_NAME;
    options.environmentId ??= process.env.CI_ENVIRONMENT_ID;
    options.environmentTier ??= process.env.CI_ENVIRONMENT_TIER;
    options.environmentUrl ??= process.env.CI_ENVIRONMENT_URL;
    options.environmentAction ??= process.env.CI_ENVIRONMENT_ACTION;
    options.runUrl ??= process.env.CI_JOB_URL || process.env.CI_PIPELINE_URL;
    options.apiUrl ??= process.env.CI_API_V4_URL;
    options.graphqlUrl ??= process.env.CI_API_GRAPHQL_URL;
    options.workspace ??= process.env.CI_PROJECT_DIR;
    options.refProtected ??= process.env.CI_COMMIT_REF_PROTECTED === "true";
    if (process.env.CI_RUNNER_EXECUTABLE_ARCH) {
      const parts = process.env.CI_RUNNER_EXECUTABLE_ARCH.split("/");
      options.runnerOs ??= parts[0];
      options.runnerArch ??= parts[1];
    }
    options.runnerName ??= process.env.CI_RUNNER_DESCRIPTION;
    options.runnerId ??= process.env.CI_RUNNER_ID;
    options.runnerTags ??= process.env.CI_RUNNER_TAGS;
    options.runnerVersion ??= process.env.CI_RUNNER_VERSION;
    options.jobContainer ??= process.env.CI_JOB_IMAGE;

    // Merge Request specific predefined variables
    if (process.env.CI_MERGE_REQUEST_IID) {
      options.prNumber ??= process.env.CI_MERGE_REQUEST_IID;
      options.prId ??= process.env.CI_MERGE_REQUEST_ID;
      options.prTitle ??= process.env.CI_MERGE_REQUEST_TITLE;
      options.prSourceBranch ??= process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME;
      options.prTargetBranchName ??= process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME;
      options.prSourceCommitId ??= process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA;
      options.prSourceRepoUri ??= process.env.CI_MERGE_REQUEST_PROJECT_URL;
      options.headRef ??= process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME;
      options.baseRef ??= process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME;
    }
  } else if (isBitbucket) {
    options.source ??= "bitbucket";
    if (!options.format || options.format === "generic") {
      options.format = "bitbucket";
    }
    const repoFullName = process.env.BITBUCKET_REPO_FULL_NAME || (process.env.BITBUCKET_WORKSPACE && process.env.BITBUCKET_REPO_SLUG ? `${process.env.BITBUCKET_WORKSPACE}/${process.env.BITBUCKET_REPO_SLUG}` : undefined);
    options.repository ??= repoFullName;
    options.repositoryOwner ??= process.env.BITBUCKET_WORKSPACE || process.env.BITBUCKET_REPO_OWNER;
    options.repositoryGitUrl ??= process.env.BITBUCKET_GIT_HTTP_ORIGIN || process.env.BITBUCKET_GIT_SSH_ORIGIN;
    options.branch ??= process.env.BITBUCKET_BRANCH || process.env.BITBUCKET_TAG || process.env.BITBUCKET_BOOKMARK;
    options.commit ??= process.env.BITBUCKET_COMMIT;
    options.pipeline ??= process.env.BITBUCKET_STEP_TRIGGER || (process.env.BITBUCKET_REPO_SLUG && process.env.BITBUCKET_BUILD_NUMBER ? `${process.env.BITBUCKET_REPO_SLUG} #${process.env.BITBUCKET_BUILD_NUMBER}` : undefined) || "Bitbucket Pipeline";
    options.runId ??= process.env.BITBUCKET_BUILD_NUMBER || process.env.BITBUCKET_PIPELINE_UUID;
    options.runNumber ??= process.env.BITBUCKET_BUILD_NUMBER;
    options.actor ??= process.env.BITBUCKET_STEP_TRIGGERER_UUID;
    options.actorId ??= process.env.BITBUCKET_STEP_TRIGGERER_UUID;
    options.environment ??= process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT || process.env.BITBUCKET_BRANCH;
    options.environmentId ??= process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT_UUID;
    options.project ??= process.env.BITBUCKET_PROJECT_KEY;
    options.workspace ??= process.env.BITBUCKET_CLONE_DIR;
    options.stepRunNumber ??= process.env.BITBUCKET_STEP_RUN_NUMBER;
    options.stepUuid ??= process.env.BITBUCKET_STEP_UUID;
    options.pipelineUuid ??= process.env.BITBUCKET_PIPELINE_UUID;
    options.parallelStep ??= process.env.BITBUCKET_PARALLEL_STEP;
    options.parallelStepCount ??= process.env.BITBUCKET_PARALLEL_STEP_COUNT;

    // Pull request variables
    if (process.env.BITBUCKET_PR_ID) {
      options.prNumber ??= process.env.BITBUCKET_PR_ID;
      options.prTargetBranchName ??= process.env.BITBUCKET_PR_DESTINATION_BRANCH;
      options.prSourceBranch ??= process.env.BITBUCKET_BRANCH;
      options.prSourceCommitId ??= process.env.BITBUCKET_COMMIT;
      options.prDestinationCommit ??= process.env.BITBUCKET_PR_DESTINATION_COMMIT;
      options.headRef ??= process.env.BITBUCKET_BRANCH;
      options.baseRef ??= process.env.BITBUCKET_PR_DESTINATION_BRANCH;
    }

    if (repoFullName && process.env.BITBUCKET_BUILD_NUMBER) {
      if (process.env.BITBUCKET_GIT_HTTP_ORIGIN && !process.env.BITBUCKET_GIT_HTTP_ORIGIN.includes(".git") && !process.env.BITBUCKET_GIT_HTTP_ORIGIN.includes(repoFullName)) {
        options.runUrl ??= `${process.env.BITBUCKET_GIT_HTTP_ORIGIN.replace(/\/$/, "")}/${repoFullName}/addon/pipelines/home#!/results/${process.env.BITBUCKET_BUILD_NUMBER}`;
      } else {
        options.runUrl ??= `https://bitbucket.org/${repoFullName}/pipelines/results/${process.env.BITBUCKET_BUILD_NUMBER}`;
      }
    }
  } else if (isCircleCI) {
    options.source ??= "circleci";
    if (!options.format || options.format === "generic") {
      options.format = "circleci";
    }
    const repoFullName = (process.env.CIRCLE_PROJECT_USERNAME && process.env.CIRCLE_PROJECT_REPONAME)
      ? `${process.env.CIRCLE_PROJECT_USERNAME}/${process.env.CIRCLE_PROJECT_REPONAME}`
      : undefined;
    options.repository ??= repoFullName;
    options.repositoryOwner ??= process.env.CIRCLE_PROJECT_USERNAME;
    options.repositoryGitUrl ??= process.env.CIRCLE_REPOSITORY_URL;
    options.branch ??= process.env.CIRCLE_BRANCH || process.env.CIRCLE_TAG;
    options.tag ??= process.env.CIRCLE_TAG;
    options.commit ??= process.env.CIRCLE_SHA1;
    options.pipeline ??= (process.env.CIRCLE_JOB && process.env.CIRCLE_PIPELINE_NUMBER)
      ? `${process.env.CIRCLE_JOB} #${process.env.CIRCLE_PIPELINE_NUMBER}`
      : (process.env.CIRCLE_JOB || "CircleCI Job");
    options.runId ??= process.env.CIRCLE_BUILD_NUM || process.env.CIRCLE_PIPELINE_ID || process.env.CIRCLE_WORKFLOW_ID;
    options.runNumber ??= process.env.CIRCLE_PIPELINE_NUMBER || process.env.CIRCLE_BUILD_NUM;
    options.actor ??= process.env.CIRCLE_USERNAME;
    options.runUrl ??= process.env.CIRCLE_BUILD_URL;
    options.jobName ??= process.env.CIRCLE_JOB;
    options.workspace ??= process.env.CIRCLE_WORKING_DIRECTORY;
    options.project ??= process.env.CIRCLE_PROJECT_REPONAME;
    options.projectId ??= process.env.CIRCLE_PROJECT_ID;
    options.parallelStep ??= process.env.CIRCLE_NODE_INDEX;
    options.parallelStepCount ??= process.env.CIRCLE_NODE_TOTAL;
    options.environment ??= process.env.CIRCLE_BRANCH;

    // Pull request variables
    const prNumberMatch = process.env.CIRCLE_PR_NUMBER || 
      process.env.CIRCLE_PULL_REQUEST?.match(/\/pull(?:-requests)?\/(\d+)/)?.[1] ||
      process.env.CIRCLE_PULL_REQUESTS?.split(",")?.[0]?.match(/\/pull(?:-requests)?\/(\d+)/)?.[1];
    if (prNumberMatch) {
      options.prNumber ??= prNumberMatch;
      options.prUrl ??= process.env.CIRCLE_PULL_REQUEST || process.env.CIRCLE_PULL_REQUESTS?.split(",")?.[0];
      options.prRepoName ??= process.env.CIRCLE_PR_REPONAME;
      options.prUsername ??= process.env.CIRCLE_PR_USERNAME;
      options.prSourceBranch ??= process.env.CIRCLE_BRANCH;
    }
  } else if (isJenkins) {
    options.source ??= "jenkins";
    if (!options.format || options.format === "generic") {
      options.format = "jenkins";
    }
    options.pipeline ??= process.env.JOB_NAME;
    options.runId ??= process.env.BUILD_NUMBER;
    options.runNumber ??= process.env.BUILD_NUMBER;
    options.branch ??= process.env.GIT_BRANCH || process.env.BRANCH_NAME;
    options.commit ??= process.env.GIT_COMMIT;
    options.runUrl ??= process.env.BUILD_URL;
  }

  // Local Git Fallback for any core fields still missing
  if (!options.branch || !options.commit || !options.repository) {
    try {
      if (!options.branch) {
        options.branch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
      }
      if (!options.commit) {
        options.commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
      }
      if (!options.repository) {
        const remoteUrl = execSync("git config --get remote.origin.url", { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
        const match = remoteUrl.match(/[:/]([^/:]+\/[^/:]+?)(?:\.git)?$/);
        if (match) {
          options.repository = match[1];
        }
      }
    } catch {
      // not in a git repo or git not available, ignore
    }
  }

  return options;
}

async function fetchEventFromPlatform(options: any): Promise<FailureEvent> {
  const source = options.source || (process.env.GITHUB_ACTIONS ? "github" : process.env.SYSTEM_COLLECTIONURI ? "azure-devops" : "github");

  if (source === "github") {
    const { mapGithubContext } = await import("../github-action/map-event.js");
    const token = options.githubToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token is required to fetch logs from API. Use --github-token or set GITHUB_TOKEN environment variable.");
    }

    const octokit = new Octokit({ auth: token });
    const ghContext = {
      repo: {
        owner: (options.repository || process.env.GITHUB_REPOSITORY || "").split("/")[0] || "",
        repo: (options.repository || process.env.GITHUB_REPOSITORY || "").split("/")[1] || "",
      },
      workflow: options.pipeline || process.env.GITHUB_WORKFLOW || "",
      runId: parseInt(options.runId || process.env.GITHUB_RUN_ID || "0"),
      runNumber: parseInt(options.runNumber || process.env.GITHUB_RUN_NUMBER || "0"),
      sha: options.commit || process.env.GITHUB_SHA || "",
      ref: options.branch || process.env.GITHUB_REF || "",
      actor: process.env.GITHUB_ACTOR || "",
      serverUrl: process.env.GITHUB_SERVER_URL || "https://github.com",
      payload: {}, // Minimal payload for CLI
      headRef: options.headRef || process.env.GITHUB_HEAD_REF,
      job: options.jobName || process.env.GITHUB_JOB,
      runAttempt: parseInt(options.runAttempt || process.env.GITHUB_RUN_ATTEMPT || "1"),
      eventName: options.eventName || process.env.GITHUB_EVENT_NAME || "push",
      apiUrl: options.apiUrl || process.env.GITHUB_API_URL,
      runnerOs: options.runnerOs || process.env.RUNNER_OS,
      runnerArch: options.runnerArch || process.env.RUNNER_ARCH,
      runnerName: options.runnerName || process.env.RUNNER_NAME,
      metadata: parseMetadata(options.meta),
    };

    return await mapGithubContext(ghContext as any, octokit as any, options.environment);
  } else if (source === "azure-devops") {
    const { mapAzureDevOpsContext } = await import("../azure-devops/map-event.js");
    return await mapAzureDevOpsContext(options.environment, options);
  }

  throw new Error(`Unsupported failure source for automatic log fetching: ${source}. Please provide logs via --logs.`);
}

async function loadConfig(configPath?: string): Promise<any> {
  try {
    if (configPath && await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
    
    // If a specific config path was provided but doesn't exist, throw error
    if (configPath && configPath !== "./pipelineiq.json" && configPath !== "pipelineiq.json") {
      throw new Error(`Configuration file not found at: ${configPath}`);
    }
  } catch (error) {
    if ((error as any).code !== "ENOENT") {
      throw new Error(`Error reading configuration file ${configPath}: ${(error as Error).message}`);
    }
  }

  const aiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "").trim();
  const aiProvider = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai")).trim();
  const aiModel = (process.env.AI_MODEL || "").trim();
  const aiMode = (process.env.AI_MODE || (aiKey ? "assist" : "disabled")).trim();

  // No config file found, return environment variable structure for merging
  return {
    jira: {
      baseUrl: (process.env.JIRA_URL || "").trim(),
      email: (process.env.JIRA_EMAIL || "").trim(),
      apiToken: (process.env.JIRA_TOKEN || "").trim(),
    },
    jiraProject: (process.env.JIRA_PROJECT || "").trim(),
    ai: {
      mode: aiMode,
      ...(aiKey ? { apiKey: aiKey } : {}),
      provider: aiProvider,
      ...(aiModel ? { model: aiModel } : {}),
    },
    dedup: { enabled: true, windowHours: 24 },
  };
}

async function initConfig() {
  console.log(chalk.bold.blue("\n🚀 Welcome to PipelineIQ Setup Wizard\n"));

  const questions = [
    {
      type: "list",
      name: "jiraType",
      message: "Jira deployment type:",
      choices: [
        { name: "Jira Cloud (Atlassian Cloud)", value: "cloud" },
        { name: "Jira Server / Data Center (Self-hosted)", value: "server" },
      ],
      default: "cloud",
    },
    {
      type: "input",
      name: "jiraUrl",
      message: "Jira base URL (e.g. https://your-domain.atlassian.net):",
      validate: (input: string) => {
        if (!input) return "Jira URL is required";
        try {
          new URL(input);
          return true;
        } catch {
          return "Please enter a valid URL";
        }
      },
    },
    {
      type: "input",
      name: "jiraEmail",
      message: "Jira user email:",
      when: (answers: any) => answers.jiraType === "cloud",
      validate: (input: string) => input.length > 0 || "Email is required for Jira Cloud",
    },
    {
      type: "password",
      name: "jiraToken",
      message: "Jira API token:",
      when: (answers: any) => answers.jiraType === "cloud",
      validate: (input: string) => input.length > 0 || "API token is required for Jira Cloud",
    },
    {
      type: "password",
      name: "jiraAccessToken",
      message: "Jira Personal Access Token (PAT):",
      when: (answers: any) => answers.jiraType === "server",
      validate: (input: string) => input.length > 0 || "PAT is required for Jira Server / Data Center",
    },
    {
      type: "input",
      name: "jiraProject",
      message: "Jira project key:",
      default: "DEVOPS",
      validate: (input: string) => /^[A-Z][A-Z0-9_]{0,30}$/i.test(input.trim()) || "Invalid project key",
    },
    {
      type: "list",
      name: "aiMode",
      message: "AI Intelligence Mode:",
      choices: [
        { name: "Assist — AI failure classification, root cause analysis & remediation", value: "assist" },
        { name: "Full — AI analysis + Autonomous Self-Healing PRs", value: "full" },
        { name: "Disabled — Fast deterministic rule-based analysis only", value: "disabled" },
      ],
      default: "assist",
    },
    {
      type: "list",
      name: "aiProvider",
      message: "AI model provider:",
      when: (answers: any) => answers.aiMode !== "disabled",
      choices: [
        { name: "OpenAI (GPT-4o, o3-mini)", value: "openai" },
        { name: "Anthropic (Claude 3.7 Sonnet)", value: "anthropic" },
        { name: "Google Gemini (Gemini 2.5 Flash / Pro)", value: "gemini" },
        { name: "Azure OpenAI", value: "azure-openai" },
        { name: "Local LLM (Ollama / LocalAI)", value: "local" },
      ],
      default: "openai",
    },
    {
      type: "confirm",
      name: "autoResolveOnSuccess",
      message: "Automatically resolve incident tickets when a pipeline retry passes?",
      default: true,
    },
    {
      type: "confirm",
      name: "enableSelfHealing",
      message: "Enable autonomous self-healing (generate verified PRs for broken pipelines)?",
      default: true,
      when: (answers: any) => answers.aiMode === "full",
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  
  const config: Record<string, any> = {
    jira: {
      type: answers.jiraType || "cloud",
      baseUrl: answers.jiraUrl.trim().replace(/\/+$/, ""),
      ...(answers.jiraType === "server"
        ? { accessToken: answers.jiraAccessToken }
        : { email: answers.jiraEmail.trim(), apiToken: answers.jiraToken.trim() }),
    },
    jiraProject: answers.jiraProject.trim().toUpperCase(),
    ai: {
      mode: answers.aiMode,
      ...(answers.aiProvider ? { provider: answers.aiProvider } : {}),
    },
    dedup: {
      enabled: true,
      autoResolveOnSuccess: answers.autoResolveOnSuccess ?? true,
      resolveTransition: "Done",
    },
    maskSecrets: true,
  };

  if (answers.enableSelfHealing) {
    config.selfHealing = {
      enabled: true,
      dryRun: false,
      healOnRecurrence: true,
      allowedCategories: ["Build", "Test", "Dependency", "Lint"],
      enableVerification: true,
    };
  }

  await fs.writeJson("./pipelineiq.json", config, { spaces: 2 });
  console.log(chalk.bold.green("\n✓ Configuration successfully saved to ./pipelineiq.json"));
  console.log(chalk.gray("Run `pipelineiq test --jira` to verify your Jira connection.\n"));
}

async function readLogs(logPath: string): Promise<string> {
  const stats = await fs.stat(logPath);
  
  if (stats.isDirectory()) {
    // Read all log files in directory
    const files = await fs.readdir(logPath);
    const logFiles = files.filter(file => 
      file.endsWith(".log") || file.endsWith(".txt") || file.endsWith(".out")
    );
    
    let allLogs = "";
    for (const file of logFiles.slice(-10)) { // Last 10 files
      const content = await fs.readFile(path.join(logPath, file), "utf8");
      allLogs += `\n=== ${file} ===\n${content}\n`;
    }
    return allLogs;
  } else {
    // Read single file
    return await fs.readFile(logPath, "utf8");
  }
}

export async function createFailureEvent(
  source: FailureSource,
  parsedLogs: any,
  options: any
): Promise<FailureEvent> {
  // Check for built-in CI/CD environment variables
  const githubToken = options.githubToken || process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const environment = options.environment || process.env.ENVIRONMENT || process.env.DEPLOYMENT_ENVIRONMENT || process.env.ENVIRONMENT_NAME;
  
  // GitHub Actions built-in variables
  const githubRepo = options.repository || process.env.GITHUB_REPOSITORY;
  const githubRef = options.branch || process.env.GITHUB_REF;
  const githubSha = options.commit || process.env.GITHUB_SHA;
  const githubRunId = options.runId || process.env.GITHUB_RUN_ID;
  const githubRunNumber = options.runNumber || options.runId || process.env.GITHUB_RUN_NUMBER;
  const githubWorkflow = options.pipeline || process.env.GITHUB_WORKFLOW;
  const githubActor = options.actor || process.env.GITHUB_ACTOR;
  const githubServerUrl = process.env.GITHUB_SERVER_URL;
  const githubActorId = process.env.GITHUB_ACTOR_ID;
  const githubApiUrl = options.apiUrl || process.env.GITHUB_API_URL;
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const githubHeadRef = process.env.GITHUB_HEAD_REF;
  const githubJob = process.env.GITHUB_JOB;
  const githubRefName = process.env.GITHUB_REF_NAME;
  const githubRefProtected = process.env.GITHUB_REF_PROTECTED;
  const githubRefType = process.env.GITHUB_REF_TYPE;
  const githubRepositoryId = process.env.GITHUB_REPOSITORY_ID;
  const githubRepositoryOwner = options.repositoryOwner || process.env.GITHUB_REPOSITORY_OWNER;
  const githubRepositoryOwnerId = process.env.GITHUB_REPOSITORY_OWNER_ID;
  const githubRunAttempt = options.runAttempt || process.env.GITHUB_RUN_ATTEMPT;
  const githubTriggeringActor = process.env.GITHUB_TRIGGERING_ACTOR;
  const githubWorkflowRef = process.env.GITHUB_WORKFLOW_REF;
  const githubWorkflowSha = process.env.GITHUB_WORKFLOW_SHA;
  const githubWorkspace = process.env.GITHUB_WORKSPACE;
  const githubRetentionDays = process.env.GITHUB_RETENTION_DAYS;
  const githubEventName = options.eventName || process.env.GITHUB_EVENT_NAME;
  
  // GitHub Actions Runner variables
  const runnerArch = options.runnerArch || process.env.RUNNER_ARCH;
  const runnerDebug = process.env.RUNNER_DEBUG;
  const runnerEnvironment = process.env.RUNNER_ENVIRONMENT;
  const runnerName = process.env.RUNNER_NAME;
  const runnerOs = options.runnerOs || process.env.RUNNER_OS;
  const runnerTemp = process.env.RUNNER_TEMP;
  const runnerToolCache = process.env.RUNNER_TOOL_CACHE;
  
  // Azure DevOps Runner variables
  const adoAgentOs = process.env.AGENT_OS;
  const adoAgentArch = process.env.AGENT_OSARCHITECTURE;
  const adoAgentJobName = process.env.AGENT_JOBNAME;
  const adoAgentName = process.env.AGENT_NAME || options.agentName;
  const adoAgentMachineName = process.env.AGENT_MACHINENAME || options.agentMachineName;
  const adoAgentId = process.env.AGENT_ID || options.agentId;
  const adoAgentBuildDirectory = process.env.AGENT_BUILDDIRECTORY || options.agentBuildDirectory;
  const adoAgentHomeDirectory = process.env.AGENT_HOMEDIRECTORY || options.agentHomeDirectory;
  const adoAgentTempDirectory = process.env.AGENT_TEMPDIRECTORY || options.agentTempDirectory;
  const adoAgentToolsDirectory = process.env.AGENT_TOOLSDIRECTORY || options.agentToolsDirectory;
  const adoAgentWorkFolder = process.env.AGENT_WORKFOLDER || options.agentWorkFolder;
  const adoAgentJobStatus = process.env.AGENT_JOBSTATUS || options.jobStatus;
  
  // Azure DevOps built-in variables
  const adoRepo = options.repository || process.env.BUILD_REPOSITORY_NAME;
  const adoSourceBranch = options.branch || process.env.BUILD_SOURCEBRANCH;
  const adoSourceVersion = options.commit || process.env.BUILD_SOURCEVERSION;
  const adoBuildId = options.runId || process.env.BUILD_BUILDID;
  const adoBuildNumber = options.runNumber || options.runId || process.env.BUILD_BUILDNUMBER;
  const adoPipeline = options.pipeline || process.env.BUILD_DEFINITIONNAME;
  const adoRepositoryClean = process.env.BUILD_REPOSITORY_CLEAN;
  const adoRepositoryGitSubmoduleCheckout = process.env.BUILD_REPOSITORY_GIT_SUBMODULECHECKOUT;
  const adoCronScheduleDisplayName = process.env.BUILD_CRONSCHEDULE_DISPLAYNAME;
  const adoStageRequestedBy = options.stageRequestedBy || process.env.BUILD_STAGEREQUESTBY;
  const adoStageRequestedForId = options.stageRequestedForId || process.env.BUILD_STAGEREQUESTFORID;
  const adoSourceTfvcShelveset = options.sourceTfvcShelveset || process.env.BUILD_SOURCETFVCSHELVESET;
  
  const adoCollectionUri = process.env.SYSTEM_COLLECTIONURI;
  const adoTeamProject = process.env.SYSTEM_TEAMPROJECT;
  const adoRequestedFor = process.env.BUILD_REQUESTEDFOR;
  const adoRequestedForEmail = process.env.BUILD_REQUESTEDFOREMAIL;
  const adoRequestedForId = process.env.BUILD_REQUESTEDFORID;
  const adoSourceVersionMessage = process.env.BUILD_SOURCEVERSIONMESSAGE;
  const adoBuildReason = process.env.BUILD_REASON || options.eventName;
  const adoBuildUri = process.env.BUILD_BUILDURI || options.runUrl;
  const adoDefinitionVersion = process.env.BUILD_DEFINITIONVERSION || options.definitionVersion;
  const adoSourcesDirectory = process.env.BUILD_SOURCESDIRECTORY || options.sourcesDirectory;
  const adoBinariesDirectory = process.env.BUILD_BINARIESDIRECTORY || options.binariesDirectory;
  const adoArtifactStagingDirectory = process.env.BUILD_ARTIFACTSTAGINGDIRECTORY || process.env.BUILD_STAGINGDIRECTORY || options.artifactStagingDirectory;
  const adoStagingDirectory = process.env.BUILD_STAGINGDIRECTORY || options.stagingDirectory;
  const adoContainerId = process.env.BUILD_CONTAINERID || options.containerId;
  const adoRepositoryLocalPath = process.env.BUILD_REPOSITORY_LOCALPATH || options.repositoryLocalPath;
  const adoTestResultsDirectory = process.env.COMMON_TESTRESULTSDIRECTORY || options.testResultsDirectory;
  const adoRepositoryUri = process.env.BUILD_REPOSITORY_URI;
  const adoRepositoryId = process.env.BUILD_REPOSITORY_ID;
  const adoRepositoryProvider = process.env.BUILD_REPOSITORY_PROVIDER;
  const adoSourceBranchName = process.env.BUILD_SOURCEBRANCHNAME;
  const adoQueuedBy = process.env.BUILD_QUEUEDBY;
  const adoQueuedById = process.env.BUILD_QUEUEDBYID;
  
  // Azure DevOps Release variables
  const adoReleaseDeploymentRequestedFor = process.env.RELEASE_DEPLOYMENT_REQUESTEDFOR;
  const adoReleaseDeploymentRequestedForEmail = process.env.RELEASE_DEPLOYMENT_REQUESTEDFOREMAIL;
  const adoReleaseDeploymentId = process.env.RELEASE_DEPLOYMENTID;
  const adoReleaseDefinitionEnvironmentId = process.env.RELEASE_DEFINITIONENVIRONMENTID;
  const adoReleaseDefinitionId = process.env.RELEASE_DEFINITIONID;
  const adoReleaseDefinitionName = process.env.RELEASE_DEFINITIONNAME;
  const adoReleaseEnvironmentId = process.env.RELEASE_ENVIRONMENTID;
  const adoReleaseEnvironmentName = process.env.RELEASE_ENVIRONMENTNAME;
  const adoReleasePrimaryArtifactSourceAlias = process.env.RELEASE_PRIMARYARTIFACTSOURCEALIAS;
  const adoReleaseDescription = process.env.RELEASE_RELEASEDESCRIPTION;
  const adoReleaseId = process.env.RELEASE_RELEASEID;
  const adoReleaseName = process.env.RELEASE_RELEASENAME;
  const adoReleaseUri = process.env.RELEASE_RELEASEURI;
  
  // Azure DevOps Agent variables
  const adoAgentContainerMapping = process.env.AGENT_CONTAINERMAPPING;
  const adoAgentReleaseDirectory = process.env.AGENT_RELEASEDIRECTORY;
  const adoAgentRootDirectory = process.env.AGENT_ROOTDIRECTORY;
  
  // Azure DevOps System variables
  const adoSystemCollectionId = process.env.SYSTEM_COLLECTIONID;
  const adoSystemCollectionUri = process.env.SYSTEM_COLLECTIONURI;
  const adoSystemDefinitionId = process.env.SYSTEM_DEFINITIONID;
  const adoSystemTeamProjectId = process.env.SYSTEM_TEAMPROJECTID;
  const adoSystemTimelineId = process.env.SYSTEM_TIMELINEID;
  const adoSystemJobId = process.env.SYSTEM_JOBID;
  const adoSystemJobName = process.env.SYSTEM_JOBNAME;
  const adoSystemJobAttempt = process.env.SYSTEM_JOBATTEMPT;
  const adoSystemDebug = process.env.SYSTEM_DEBUG;
  const adoSystemDefaultWorkingDirectory = process.env.SYSTEM_DEFAULTWORKINGDIRECTORY;
  const adoSystemTeamFoundationCollectionUri = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
  const adoPipelineWorkspace = process.env.PIPELINE_WORKSPACE;
  const adoSystemStageAttempt = process.env.SYSTEM_STAGEATTEMPT;
  const adoSystemStageDisplayName = process.env.SYSTEM_STAGEDISPLAYNAME;
  const adoSystemStageName = process.env.SYSTEM_STAGENAME;
  const adoSystemWorkFolder = process.env.SYSTEM_WORKFOLDER;
  const adoSystemPhaseAttempt = process.env.SYSTEM_PHASEATTEMPT;
  const adoSystemPhaseDisplayName = process.env.SYSTEM_PHASEDISPLAYNAME;
  const adoSystemPhaseName = process.env.SYSTEM_PHASENAME;
  const adoSystemPlanId = process.env.SYSTEM_PLANID;
  const adoSystemHostType = process.env.SYSTEM_HOSTTYPE;
  const adoSystemJobDisplayName = process.env.SYSTEM_JOBDISPLAYNAME;
  const adoTfBuild = process.env.TF_BUILD;
  const adoChecksStageAttempt = process.env.CHECKS_STAGEATTEMPT;
  const adoStrategyName = process.env.STRATEGY_NAME;
  const adoStrategyCycleName = process.env.STRATEGY_CYCLENAME;
  
  // Azure DevOps Release Artifacts (dynamic capture)
  const adoReleaseArtifacts: Record<string, any> = {};
  for (const key in process.env) {
    if (key.startsWith("RELEASE_ARTIFACTS_")) {
      adoReleaseArtifacts[key] = process.env[key];
    }
  }
  
  // Azure DevOps Environment variables (deployment jobs)
  const adoEnvironmentName = process.env.ENVIRONMENT_NAME;
  const adoEnvironmentId = process.env.ENVIRONMENT_ID;
  const adoEnvironmentResourceName = process.env.ENVIRONMENT_RESOURCENAME;
  const adoEnvironmentResourceId = process.env.ENVIRONMENT_RESOURCEID;
  
  // Azure DevOps Pull Request variables
  const adoPrIsFork = process.env.SYSTEM_PULLREQUEST_ISFORK;
  const adoPrId = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
  const adoPrNumber = process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER;
  const adoPrTargetBranch = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH || process.env.SYSTEM_PULLREQUEST_TARGETBRANCHNAME;
  const adoPrSourceBranch = process.env.SYSTEM_PULLREQUEST_SOURCEBRANCH;
  const adoPrSourceCommit = process.env.SYSTEM_PULLREQUEST_SOURCECOMMITID;
  const adoPrSourceRepoUri = process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI;

  // GitLab CI built-in variables (CLI options override ambient env vars)
  const glServerUrl = options.gitlabServerUrl || process.env.CI_SERVER_URL;
  const glServerVersion = options.gitlabServerVersion || process.env.CI_SERVER_VERSION;
  const glProjectPath = options.gitlabProjectPath || options.repository || process.env.CI_PROJECT_PATH;
  const glProjectId = options.gitlabProjectId || options.projectId || process.env.CI_PROJECT_ID;
  const glProjectUrl = options.gitlabProjectUrl || options.projectUrl || process.env.CI_PROJECT_URL;
  const glProjectTitle = options.gitlabProjectTitle || process.env.CI_PROJECT_TITLE;
  const glProjectDescription = options.gitlabProjectDescription || process.env.CI_PROJECT_DESCRIPTION;
  const glProjectVisibility = options.gitlabProjectVisibility || process.env.CI_PROJECT_VISIBILITY;
  const glProjectNamespace = options.gitlabProjectNamespace || process.env.CI_PROJECT_NAMESPACE;
  const glProjectRootNamespace = options.gitlabProjectRootNamespace || process.env.CI_PROJECT_ROOT_NAMESPACE;
  const glPipelineId = options.gitlabPipelineId || options.pipelineId || options.runId || process.env.CI_PIPELINE_ID;
  const glPipelineIid = options.gitlabPipelineIid || options.runNumber || process.env.CI_PIPELINE_IID;
  const glPipelineUrl = options.gitlabPipelineUrl || options.runUrl || process.env.CI_PIPELINE_URL;
  const glPipelineSource = options.gitlabPipelineSource || options.eventName || process.env.CI_PIPELINE_SOURCE;
  const glPipelineName = options.gitlabPipelineName || options.pipeline || process.env.CI_PIPELINE_NAME;
  const glPipelineCreatedAt = options.gitlabPipelineCreatedAt || process.env.CI_PIPELINE_CREATED_AT;
  const glJobId = options.gitlabJobId || options.jobId || options.runId || process.env.CI_JOB_ID;
  const glJobName = options.gitlabJobName || options.jobName || process.env.CI_JOB_NAME;
  const glJobStage = options.gitlabJobStage || options.stage || process.env.CI_JOB_STAGE;
  const glJobStatus = options.gitlabJobStatus || options.jobStatus || process.env.CI_JOB_STATUS;
  const glJobStartedAt = options.gitlabJobStartedAt || process.env.CI_JOB_STARTED_AT;
  const glJobImage = options.gitlabJobImage || options.jobContainer || process.env.CI_JOB_IMAGE;
  const glJobTimeout = options.gitlabJobTimeout || process.env.CI_JOB_TIMEOUT;
  const glJobTags = options.gitlabJobTags || options.runnerTags || process.env.CI_JOB_TAGS;
  const glJobUrl = options.gitlabJobUrl || options.runUrl || process.env.CI_JOB_URL;
  const glCommitSha = options.commit || process.env.CI_COMMIT_SHA;
  const glCommitBeforeSha = options.gitlabCommitBeforeSha || process.env.CI_COMMIT_BEFORE_SHA;
  const glCommitRefName = options.branch || process.env.CI_COMMIT_REF_NAME;
  const glCommitBranch = options.branch || process.env.CI_COMMIT_BRANCH;
  const glCommitMessage = options.commitMessage || process.env.CI_COMMIT_MESSAGE;
  const glCommitTitle = options.commitTitle || process.env.CI_COMMIT_TITLE;
  const glCommitDescription = options.commitDescription || process.env.CI_COMMIT_DESCRIPTION;
  const glCommitAuthor = options.actor || process.env.CI_COMMIT_AUTHOR;
  const glCommitTimestamp = options.gitlabCommitTimestamp || process.env.CI_COMMIT_TIMESTAMP;
  const glEnvironmentTier = options.environmentTier || process.env.CI_ENVIRONMENT_TIER;
  const glEnvironmentUrl = options.environmentUrl || process.env.CI_ENVIRONMENT_URL;
  const glEnvironmentAction = options.environmentAction || process.env.CI_ENVIRONMENT_ACTION;
  const glMrIid = options.prNumber || process.env.CI_MERGE_REQUEST_IID;
  const glMrId = options.prId || process.env.CI_MERGE_REQUEST_ID;
  const glMrTitle = options.prTitle || process.env.CI_MERGE_REQUEST_TITLE;
  const glMrEvent = options.prEventType || process.env.CI_MERGE_REQUEST_EVENT_TYPE;
  const glMrSourceBranch = options.prSourceBranch || options.headRef || process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME;
  const glMrTargetBranch = options.prTargetBranchName || options.baseRef || process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME;
  const glMrAssignees = options.prAssignees || process.env.CI_MERGE_REQUEST_ASSIGNEES;
  const glMrLabels = options.prLabels || process.env.CI_MERGE_REQUEST_LABELS;
  const glMrMilestone = options.prMilestone || process.env.CI_MERGE_REQUEST_MILESTONE;
  const glRunnerId = options.runnerId || process.env.CI_RUNNER_ID;
  const glRunnerDesc = options.runnerName || process.env.CI_RUNNER_DESCRIPTION;
  const glRunnerTags = options.runnerTags || process.env.CI_RUNNER_TAGS;
  const glRunnerVersion = options.runnerVersion || process.env.CI_RUNNER_VERSION;
  const glUserLogin = options.actor || process.env.GITLAB_USER_LOGIN;
  const glUserName = options.actorName || process.env.GITLAB_USER_NAME;
  const glUserEmail = options.actorEmail || process.env.GITLAB_USER_EMAIL;
  const glUserId = options.actorId || process.env.GITLAB_USER_ID;

  // Bitbucket Pipelines built-in variables (CLI options override ambient env vars)
  const bbBuildNumber = options.bitbucketBuildNumber || options.runNumber || options.runId || process.env.BITBUCKET_BUILD_NUMBER;
  const bbCloneDir = options.bitbucketCloneDir || options.workspace || process.env.BITBUCKET_CLONE_DIR;
  const bbCommit = options.bitbucketCommit || options.commit || process.env.BITBUCKET_COMMIT;
  const bbWorkspace = options.bitbucketWorkspace || options.workspace || process.env.BITBUCKET_WORKSPACE;
  const bbWorkspaceUuid = options.bitbucketWorkspaceUuid || process.env.BITBUCKET_WORKSPACE_UUID;
  const bbRepoOwner = options.bitbucketRepoOwner || options.repositoryOwner || process.env.BITBUCKET_REPO_OWNER;
  const bbRepoOwnerUuid = options.bitbucketRepoOwnerUuid || process.env.BITBUCKET_REPO_OWNER_UUID;
  const bbRepoSlug = options.bitbucketRepoSlug || process.env.BITBUCKET_REPO_SLUG;
  const bbRepoUuid = options.bitbucketRepoUuid || process.env.BITBUCKET_REPO_UUID;
  const bbRepoFullName = options.bitbucketRepoFullName || options.repository || (bbWorkspace && bbRepoSlug ? `${bbWorkspace}/${bbRepoSlug}` : undefined) || process.env.BITBUCKET_REPO_FULL_NAME;
  const bbRepoIsPrivate = options.bitbucketRepoIsPrivate !== undefined ? options.bitbucketRepoIsPrivate : (process.env.BITBUCKET_REPO_IS_PRIVATE !== undefined ? process.env.BITBUCKET_REPO_IS_PRIVATE === "true" : undefined);
  const bbBranch = options.bitbucketBranch || options.branch || process.env.BITBUCKET_BRANCH;
  const bbTag = options.bitbucketTag || options.tag || process.env.BITBUCKET_TAG;
  const bbBookmark = options.bitbucketBookmark || process.env.BITBUCKET_BOOKMARK;
  const bbParallelStep = options.bitbucketParallelStep !== undefined ? parseInt(options.bitbucketParallelStep, 10) : (options.parallelStep !== undefined ? parseInt(options.parallelStep, 10) : (process.env.BITBUCKET_PARALLEL_STEP !== undefined ? parseInt(process.env.BITBUCKET_PARALLEL_STEP, 10) : undefined));
  const bbParallelStepCount = options.bitbucketParallelStepCount !== undefined ? parseInt(options.bitbucketParallelStepCount, 10) : (options.parallelStepCount !== undefined ? parseInt(options.parallelStepCount, 10) : (process.env.BITBUCKET_PARALLEL_STEP_COUNT !== undefined ? parseInt(process.env.BITBUCKET_PARALLEL_STEP_COUNT, 10) : undefined));
  const bbPrId = options.bitbucketPrId || options.prNumber || options.prId || process.env.BITBUCKET_PR_ID;
  const bbPrDestinationBranch = options.bitbucketPrDestinationBranch || options.prTargetBranchName || options.baseRef || process.env.BITBUCKET_PR_DESTINATION_BRANCH;
  const bbPrDestinationCommit = options.bitbucketPrDestinationCommit || options.prDestinationCommit || process.env.BITBUCKET_PR_DESTINATION_COMMIT;
  const bbMergeQueuePrIds = options.bitbucketMergeQueuePrIds || process.env.BITBUCKET_MERGE_QUEUE_PR_IDS;
  const bbGitHttpOrigin = options.bitbucketGitHttpOrigin || options.repositoryGitUrl || process.env.BITBUCKET_GIT_HTTP_ORIGIN;
  const bbGitSshOrigin = options.bitbucketGitSshOrigin || process.env.BITBUCKET_GIT_SSH_ORIGIN;
  const bbExitCode = options.bitbucketExitCode !== undefined ? parseInt(options.bitbucketExitCode, 10) : (options.exitCode !== undefined ? parseInt(options.exitCode, 10) : (process.env.BITBUCKET_EXIT_CODE !== undefined ? parseInt(process.env.BITBUCKET_EXIT_CODE, 10) : undefined));
  const bbStepUuid = options.bitbucketStepUuid || options.stepUuid || process.env.BITBUCKET_STEP_UUID;
  const bbPipelineUuid = options.bitbucketPipelineUuid || options.pipelineUuid || process.env.BITBUCKET_PIPELINE_UUID;
  const bbDeploymentEnvironment = options.bitbucketDeploymentEnvironment || options.environment || process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT;
  const bbDeploymentEnvironmentUuid = options.bitbucketDeploymentEnvironmentUuid || options.environmentId || process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT_UUID;
  const bbProjectKey = options.bitbucketProjectKey || options.project || process.env.BITBUCKET_PROJECT_KEY;
  const bbProjectUuid = options.bitbucketProjectUuid || process.env.BITBUCKET_PROJECT_UUID;
  const bbStepTriggererUuid = options.bitbucketStepTriggererUuid || options.actor || options.actorId || process.env.BITBUCKET_STEP_TRIGGERER_UUID;
  const bbStepRunNumber = options.bitbucketStepRunNumber !== undefined ? parseInt(options.bitbucketStepRunNumber, 10) : (options.stepRunNumber !== undefined ? parseInt(options.stepRunNumber, 10) : (process.env.BITBUCKET_STEP_RUN_NUMBER !== undefined ? parseInt(process.env.BITBUCKET_STEP_RUN_NUMBER, 10) : undefined));
  const bbPackagesUsername = options.bitbucketPackagesUsername || process.env.BITBUCKET_PACKAGES_USERNAME;
  const bbDockerHost = options.bitbucketDockerHost || process.env.DOCKER_HOST;
  const bbTriggerPipelineUuid = options.bitbucketTriggerPipelineUuid || process.env.BITBUCKET_TRIGGER_PIPELINE_UUID;
  const bbTriggerPipelineRunUuid = options.bitbucketTriggerPipelineRunUuid || process.env.BITBUCKET_TRIGGER_PIPELINE_RUN_UUID;
  const bbTriggerStepUuid = options.bitbucketTriggerStepUuid || process.env.BITBUCKET_TRIGGER_STEP_UUID;
  const bbTriggerPipelineSelectorType = options.bitbucketTriggerPipelineSelectorType || process.env.BITBUCKET_TRIGGER_PIPELINE_SELECTOR_TYPE;
  const bbTriggerPipelineSelectorPattern = options.bitbucketTriggerPipelineSelectorPattern || process.env.BITBUCKET_TRIGGER_PIPELINE_SELECTOR_PATTERN;
  const bbTriggerPipelineStatus = options.bitbucketTriggerPipelineStatus || process.env.BITBUCKET_TRIGGER_PIPELINE_STATUS;
  const bbTriggerDeploymentUuid = options.bitbucketTriggerDeploymentUuid || process.env.BITBUCKET_TRIGGER_DEPLOYMENT_UUID;
  const bbTriggerDeploymentStatus = options.bitbucketTriggerDeploymentStatus || process.env.BITBUCKET_TRIGGER_DEPLOYMENT_STATUS;
  const bbTriggerDeploymentEnvironmentName = options.bitbucketTriggerDeploymentEnvironmentName || process.env.BITBUCKET_TRIGGER_DEPLOYMENT_ENVIRONMENT_NAME;
  const bbTriggerPackagesPackageType = options.bitbucketTriggerPackagesPackageType || process.env.BITBUCKET_TRIGGER_PACKAGES_PACKAGE_TYPE;
  const bbTriggerPackagesPackageName = options.bitbucketTriggerPackagesPackageName || process.env.BITBUCKET_TRIGGER_PACKAGES_PACKAGE_NAME;
  const bbTriggerPackagesArtifactName = options.bitbucketTriggerPackagesArtifactName || process.env.BITBUCKET_TRIGGER_PACKAGES_ARTIFACT_NAME;
  const bbTriggerFixFlakyTestTargetBranch = options.bitbucketTriggerFixFlakyTestTargetBranch || process.env.BITBUCKET_TRIGGER_FIX_FLAKY_TEST_TARGET_BRANCH;
  const bbTriggerFixFlakyTestSourceBranch = options.bitbucketTriggerFixFlakyTestSourceBranch || process.env.BITBUCKET_TRIGGER_FIX_FLAKY_TEST_SOURCE_BRANCH;
  const bbTriggerTestCaseFqdn = options.bitbucketTriggerTestCaseFqdn || process.env.BITBUCKET_TRIGGER_TEST_CASE_FQDN;
  const bbTriggerTestCaseUuid = options.bitbucketTriggerTestCaseUuid || process.env.BITBUCKET_TRIGGER_TEST_CASE_UUID;
  
  // CircleCI built-in variables (CLI options override ambient env vars)
  const ccBuildNum = options.circleciBuildNum || options.runNumber || options.runId || process.env.CIRCLE_BUILD_NUM;
  const ccBuildUrl = options.circleciBuildUrl || options.runUrl || process.env.CIRCLE_BUILD_URL;
  const ccJob = options.circleciJob || options.jobName || process.env.CIRCLE_JOB;
  const ccBranch = options.circleciBranch || options.branch || process.env.CIRCLE_BRANCH;
  const ccTag = options.circleciTag || options.tag || process.env.CIRCLE_TAG;
  const ccSha1 = options.circleciSha1 || options.commit || process.env.CIRCLE_SHA1;
  const ccRepositoryUrl = options.circleciRepositoryUrl || options.repositoryGitUrl || process.env.CIRCLE_REPOSITORY_URL;
  const ccProjectUsername = options.circleciProjectUsername || options.repositoryOwner || process.env.CIRCLE_PROJECT_USERNAME;
  const ccProjectReponame = options.circleciProjectReponame || process.env.CIRCLE_PROJECT_REPONAME;
  const ccProjectId = options.circleciProjectId || options.projectId || process.env.CIRCLE_PROJECT_ID;
  const ccOrganizationId = options.circleciOrganizationId || options.organizationId || process.env.CIRCLE_ORGANIZATION_ID;
  const ccPipelineId = options.circleciPipelineId || options.pipelineId || process.env.CIRCLE_PIPELINE_ID;
  const ccPipelineNumber = options.circleciPipelineNumber !== undefined ? (typeof options.circleciPipelineNumber === 'number' ? options.circleciPipelineNumber : parseInt(options.circleciPipelineNumber, 10)) : (process.env.CIRCLE_PIPELINE_NUMBER !== undefined ? parseInt(process.env.CIRCLE_PIPELINE_NUMBER, 10) : undefined);
  const ccWorkflowId = options.circleciWorkflowId || options.workflowId || process.env.CIRCLE_WORKFLOW_ID;
  const ccWorkflowJobId = options.circleciWorkflowJobId || options.workflowJobId || process.env.CIRCLE_WORKFLOW_JOB_ID;
  const ccWorkflowWorkspaceId = options.circleciWorkflowWorkspaceId || options.workflowWorkspaceId || process.env.CIRCLE_WORKFLOW_WORKSPACE_ID;
  const ccWorkingDirectory = options.circleciWorkingDirectory || options.workspace || process.env.CIRCLE_WORKING_DIRECTORY;
  const ccNodeIndex = options.circleciNodeIndex !== undefined ? (typeof options.circleciNodeIndex === 'number' ? options.circleciNodeIndex : parseInt(options.circleciNodeIndex, 10)) : (options.parallelStep !== undefined ? parseInt(options.parallelStep, 10) : (process.env.CIRCLE_NODE_INDEX !== undefined ? parseInt(process.env.CIRCLE_NODE_INDEX, 10) : undefined));
  const ccNodeTotal = options.circleciNodeTotal !== undefined ? (typeof options.circleciNodeTotal === 'number' ? options.circleciNodeTotal : parseInt(options.circleciNodeTotal, 10)) : (options.parallelStepCount !== undefined ? parseInt(options.parallelStepCount, 10) : (process.env.CIRCLE_NODE_TOTAL !== undefined ? parseInt(process.env.CIRCLE_NODE_TOTAL, 10) : undefined));
  const ccPrNumberRaw = options.circleciPrNumber || options.prNumber || process.env.CIRCLE_PR_NUMBER || process.env.CIRCLE_PULL_REQUEST?.match(/\/pull(?:-requests)?\/(\d+)/)?.[1] || process.env.CIRCLE_PULL_REQUESTS?.split(",")?.[0]?.match(/\/pull(?:-requests)?\/(\d+)/)?.[1];
  const ccPrNumber = ccPrNumberRaw !== undefined ? String(ccPrNumberRaw) : undefined;
  const ccPrReponame = options.circleciPrReponame || options.prRepoName || process.env.CIRCLE_PR_REPONAME;
  const ccPrUsername = options.circleciPrUsername || options.prUsername || process.env.CIRCLE_PR_USERNAME;
  const ccPullRequest = options.circleciPullRequest || options.prUrl || process.env.CIRCLE_PULL_REQUEST;
  const ccPullRequests = options.circleciPullRequests || process.env.CIRCLE_PULL_REQUESTS;
  const ccUsername = options.circleciUsername || options.actor || process.env.CIRCLE_USERNAME;
  const ccOidcToken = options.circleciOidcToken || process.env.CIRCLE_OIDC_TOKEN;
  const ccOidcTokenV2 = options.circleciOidcTokenV2 || process.env.CIRCLE_OIDC_TOKEN_V2;
  const ccRepoFullName = (ccProjectUsername && ccProjectReponame) ? `${ccProjectUsername}/${ccProjectReponame}` : undefined;

  // CLI options take highest priority over ambient CI environment variables
  const repository = options.repository || githubRepo || adoRepo || glProjectPath || bbRepoFullName || ccRepoFullName;
  const branch = options.branch || githubRef?.replace('refs/heads/', '') || adoSourceBranch?.replace('refs/heads/', '') || adoSourceBranchName || glMrSourceBranch || glCommitBranch || glCommitRefName || bbBranch || bbTag || bbBookmark || ccBranch || ccTag;
  const commit = options.commit || githubSha || adoSourceVersion || glCommitSha || bbCommit || ccSha1;
  const pipeline = options.pipeline || githubWorkflow || adoPipeline || glPipelineName || (glJobStage && glJobName ? `${glJobStage} / ${glJobName}` : undefined) || glJobName || (bbRepoSlug && bbBuildNumber ? `${bbRepoSlug} #${bbBuildNumber}` : undefined) || (ccJob && ccBuildNum ? `${ccJob} #${ccBuildNum}` : undefined) || ccJob;
  const runId = options.runId || githubRunId || adoBuildId || glJobId || glPipelineId || bbBuildNumber || ccBuildNum || ccPipelineId;
  const runNumber = options.runNumber || options.runId || githubRunNumber || adoBuildNumber || glPipelineIid || glJobId || glPipelineId || bbBuildNumber || (ccPipelineNumber !== undefined ? String(ccPipelineNumber) : undefined) || ccBuildNum;
  const triggeredBy = options.actor || githubActor || adoRequestedFor || adoRequestedForEmail || adoQueuedBy || adoRequestedForId || adoQueuedById || glUserLogin || glUserName || glUserEmail || glUserId || bbStepTriggererUuid || ccUsername || process.env.BUILD_QUEUEDBY || "cli-user";
  
  // Pull request information
  const pullRequestNumber = options.prNumber || options.prId || githubRef?.match(/refs\/pull\/(\d+)\//)?.[1] || adoPrNumber || adoPrId || glMrIid || bbPrId || (ccPrNumber !== undefined ? String(ccPrNumber) : undefined);
  const isPullRequest = !!(options.prNumber || options.prId || githubRef?.includes('refs/pull/') || adoPrId || adoPrNumber || glMrIid || bbPrId || ccPrNumber || ccPullRequest);
  const pullRequestBranch = options.prSourceBranch || adoPrSourceBranch?.replace('refs/heads/', '') || glMrSourceBranch || bbBranch || (ccPullRequest ? ccBranch : undefined);
  
  // Rich data mapping for Azure DevOps and GitLab CI
  const adoJobName = process.env.SYSTEM_JOBNAME || process.env.SYSTEM_PHASENAME || process.env.SYSTEM_STAGENAME || adoAgentJobName;
  const adoJobAttempt = process.env.SYSTEM_JOBATTEMPT;
  const adoPhaseAttempt = process.env.SYSTEM_PHASEATTEMPT;
  const adoRunAttempt = adoJobAttempt || adoPhaseAttempt || process.env.SYSTEM_STAGEATTEMPT;
  const adoApiUrl = process.env.SYSTEM_COLLECTIONURI;
  const glRunAttempt = process.env.CI_JOB_RETRY_COUNT ? String(parseInt(process.env.CI_JOB_RETRY_COUNT, 10) + 1) : undefined;
  
  const finalJobName = options.jobName || githubJob || adoJobName || glJobName || ccJob;
  const finalRunAttempt = options.runAttempt || githubRunAttempt || adoRunAttempt || glRunAttempt;
  const finalEventName = options.eventName || githubEventName || adoBuildReason || glPipelineSource;
  const finalApiUrl = options.apiUrl || githubApiUrl || adoCollectionUri || process.env.CI_API_V4_URL;
  const finalDefinitionId = adoSystemDefinitionId;
  const finalDefinitionVersion = adoDefinitionVersion;
  const finalSourcesDirectory = adoSourcesDirectory || githubWorkspace || process.env.CI_PROJECT_DIR || bbCloneDir || ccWorkingDirectory;
  const finalBinariesDirectory = adoBinariesDirectory;
  const finalArtifactStagingDirectory = adoArtifactStagingDirectory;
  const finalContainerId = adoContainerId;
  const finalRepositoryLocalPath = adoRepositoryLocalPath || process.env.CI_PROJECT_DIR || bbCloneDir || ccWorkingDirectory;
  const finalRetentionDays = githubRetentionDays ? parseInt(githubRetentionDays) : undefined;
  const finalRunnerEnvironment = runnerEnvironment;
  const finalRunnerDebug = runnerDebug === "1";
  const finalWorkflowRef = githubWorkflowRef;
  const finalWorkflowSha = githubWorkflowSha;
  const finalActorId = githubActorId || glUserId;
  const finalTriggeringActor = githubTriggeringActor || glUserLogin || glUserName || bbStepTriggererUuid || ccUsername;
  const finalRefType = githubRefType || (process.env.CI_COMMIT_TAG || bbTag || ccTag ? "tag" : (process.env.CI_COMMIT_BRANCH || bbBranch || ccBranch ? "branch" : undefined));
  const finalRefProtected = githubRefProtected === "true" || process.env.CI_COMMIT_REF_PROTECTED === "true";
  const finalPrNumber = pullRequestNumber;
  const finalRepoOwner = githubRepositoryOwner || glProjectRootNamespace || glProjectNamespace || bbWorkspace || bbRepoOwner || ccProjectUsername;
  const glRunnerOs = process.env.CI_RUNNER_EXECUTABLE_ARCH ? process.env.CI_RUNNER_EXECUTABLE_ARCH.split("/")[0] : undefined;
  const glRunnerArch = process.env.CI_RUNNER_EXECUTABLE_ARCH ? process.env.CI_RUNNER_EXECUTABLE_ARCH.split("/")[1] : undefined;
  const finalRunnerOs = options.runnerOs || runnerOs || adoAgentOs || glRunnerOs;
  const finalRunnerArch = options.runnerArch || runnerArch || adoAgentArch || glRunnerArch;
  const finalRunnerName = options.runnerName || runnerName || adoAgentName || glRunnerDesc;
  const finalAgentMachineName = adoAgentMachineName || options.agentMachineName;
  const finalAgentId = adoAgentId || options.agentId;
  const finalAgentBuildDirectory = adoAgentBuildDirectory || options.agentBuildDirectory;
  const finalAgentHomeDirectory = adoAgentHomeDirectory || options.agentHomeDirectory;
  const finalAgentTempDirectory = adoAgentTempDirectory || options.agentTempDirectory;
  const finalAgentToolsDirectory = adoAgentToolsDirectory || options.agentToolsDirectory;
  const finalAgentWorkFolder = adoAgentWorkFolder || options.agentWorkFolder;
  const finalStagingDirectory = adoStagingDirectory || options.stagingDirectory;
  const finalTestResultsDirectory = adoTestResultsDirectory || options.testResultsDirectory;
  
  // Final ADO mappings
  const finalAgentContainerMapping = options.agentContainerMapping || adoAgentContainerMapping;
  const finalAgentReleaseDirectory = options.agentReleaseDirectory || adoAgentReleaseDirectory;
  const finalAgentRootDirectory = options.agentRootDirectory || adoAgentRootDirectory;
  const finalPipelineWorkspace = options.pipelineWorkspace || adoPipelineWorkspace;
  const finalSystemJobName = adoSystemJobName;
  const finalSystemDebug = options.systemDebug || adoSystemDebug;
  const finalSystemDefaultWorkingDirectory = options.systemDefaultWorkingDirectory || adoSystemDefaultWorkingDirectory;
  const finalSystemTeamFoundationCollectionUri = options.systemTeamFoundationCollectionUri || adoSystemTeamFoundationCollectionUri;
  const finalReleaseDeploymentRequestedFor = options.releaseDeploymentRequestedFor || adoReleaseDeploymentRequestedFor;
  const finalReleaseDeploymentRequestedForEmail = options.releaseDeploymentRequestedForEmail || adoReleaseDeploymentRequestedForEmail;
  const finalReleaseDeploymentId = options.releaseDeploymentId || adoReleaseDeploymentId;
  const finalReleaseDefinitionEnvironmentId = options.releaseDefinitionEnvironmentId || adoReleaseDefinitionEnvironmentId;
  const finalReleaseDefinitionId = options.releaseDefinitionId || adoReleaseDefinitionId;
  const finalReleaseDefinitionName = options.releaseDefinitionName || adoReleaseDefinitionName;
  const finalReleaseEnvironmentId = options.releaseEnvironmentId || adoReleaseEnvironmentId;
  const finalReleaseEnvironmentName = options.releaseEnvironmentName || adoReleaseEnvironmentName;
  const finalReleasePrimaryArtifactSourceAlias = options.releasePrimaryArtifactSourceAlias || adoReleasePrimaryArtifactSourceAlias;
  const finalReleaseDescription = options.releaseDescription || adoReleaseDescription;
  const finalReleaseId = options.releaseId || adoReleaseId;
  const finalReleaseName = options.releaseName || adoReleaseName;
  const finalReleaseUri = options.releaseUri || adoReleaseUri;
  
  const metadata = parseMetadata(options.meta);
  
  // Track which fields were explicitly provided via CLI flags
  const explicitFields: string[] = [];
  if (options.pipeline) explicitFields.push("pipeline");
  if (options.repository) explicitFields.push("repository");
  if (options.branch) explicitFields.push("branch");
  if (options.commit) explicitFields.push("commit");
  if (options.environment) explicitFields.push("environment");
  if (options.eventName) explicitFields.push("eventName");
  if (options.jobName) explicitFields.push("jobName");
  if (options.runAttempt) explicitFields.push("runAttempt");
  if (options.runNumber) explicitFields.push("runNumber");
  if (options.runId) explicitFields.push("runNumber"); // Map runId to runNumber
  if (options.apiUrl) explicitFields.push("apiUrl");
  if (options.runnerOs) explicitFields.push("runnerOs");
  if (options.runnerArch) explicitFields.push("runnerArch");
  if (options.runnerName) explicitFields.push("runnerName");
  if (options.actor) explicitFields.push("triggeredBy");
  if (options.repositoryOwner) explicitFields.push("repositoryOwner");
  if (options.action) explicitFields.push("action");
  if (options.actionPath) explicitFields.push("actionPath");
  if (options.actionRepository) explicitFields.push("actionRepository");
  if (options.baseRef) explicitFields.push("baseRef");
  if (options.headRef) explicitFields.push("headRef");
  if (options.runnerTemp) explicitFields.push("runnerTemp");
  if (options.runnerToolCache) explicitFields.push("runnerToolCache");
  if (options.runnerWorkspace) explicitFields.push("runnerWorkspace");
  if (options.ref) explicitFields.push("ref");
  if (options.refProtected) explicitFields.push("refProtected");
  if (options.retentionDays) explicitFields.push("retentionDays");
  if (options.workflowRef) explicitFields.push("workflowRef");
  if (options.workflowSha) explicitFields.push("workflowSha");
  if (options.graphqlUrl) explicitFields.push("graphqlUrl");
  if (options.workspace) explicitFields.push("workspace");
  if (options.jobStatus) explicitFields.push("jobStatus");
  if (options.jobContainer) explicitFields.push("jobContainer");
  if (options.jobServices) explicitFields.push("jobServices");
  if (options.strategyJobIndex) explicitFields.push("strategyJobIndex");
  if (options.strategyJobTotal) explicitFields.push("strategyJobTotal");
  if (options.actionRef) explicitFields.push("actionRef");
  if (options.actionStatus) explicitFields.push("actionStatus");
  if (options.repositoryGitUrl) explicitFields.push("repositoryGitUrl");
  if (options.secretSource) explicitFields.push("secretSource");
  if (options.eventPayload) explicitFields.push("eventPayload");
  if (options.agentId) explicitFields.push("agentId");
  if (options.agentName) explicitFields.push("runnerName");
  if (options.agentMachineName) explicitFields.push("agentMachineName");
  if (options.agentBuildDirectory) explicitFields.push("agentBuildDirectory");
  if (options.agentHomeDirectory) explicitFields.push("agentHomeDirectory");
  if (options.agentTempDirectory) explicitFields.push("agentTempDirectory");
  if (options.agentToolsDirectory) explicitFields.push("agentToolsDirectory");
  if (options.agentWorkFolder) explicitFields.push("agentWorkFolder");
  if (options.artifactStagingDirectory) explicitFields.push("artifactStagingDirectory");
  if (options.binariesDirectory) explicitFields.push("binariesDirectory");
  if (options.containerId) explicitFields.push("containerId");
  if (options.definitionVersion) explicitFields.push("definitionVersion");
  if (options.repositoryLocalPath) explicitFields.push("repositoryLocalPath");
  if (options.sourcesDirectory) explicitFields.push("sourcesDirectory");
  if (options.stagingDirectory) explicitFields.push("stagingDirectory");
  if (options.testResultsDirectory) explicitFields.push("testResultsDirectory");
  if (options.step) explicitFields.push("step");
  if (options.stage) explicitFields.push("stage");
  if (options.exitCode) explicitFields.push("exitCode");
  if (options.errorMessage) explicitFields.push("errorMessage");
  if (options.prNumber) explicitFields.push("prNumber");
  if (options.prId) explicitFields.push("prId");
  if (options.prTitle) explicitFields.push("prTitle");
  if (options.prSourceBranch) explicitFields.push("prSourceBranch");
  if (options.prTargetBranchName) explicitFields.push("prTargetBranchName");
  if (options.prSourceCommit) explicitFields.push("prSourceCommit");
  if (options.prDestinationCommit) explicitFields.push("prDestinationCommit");
  if (options.stepUuid) explicitFields.push("stepUuid");
  if (options.pipelineUuid) explicitFields.push("pipelineUuid");
  if (options.stepRunNumber) explicitFields.push("stepRunNumber");
  if (options.parallelStep) explicitFields.push("parallelStep");
  if (options.parallelStepCount) explicitFields.push("parallelStepCount");
  if (options.circleciBuildNum) explicitFields.push("circleciBuildNum");
  if (options.circleciBuildUrl) explicitFields.push("circleciBuildUrl");
  if (options.circleciJob) explicitFields.push("circleciJob");
  if (options.circleciBranch) explicitFields.push("circleciBranch");
  if (options.circleciTag) explicitFields.push("circleciTag");
  if (options.circleciSha1) explicitFields.push("circleciSha1");
  if (options.circleciRepositoryUrl) explicitFields.push("circleciRepositoryUrl");
  if (options.circleciProjectUsername) explicitFields.push("circleciProjectUsername");
  if (options.circleciProjectReponame) explicitFields.push("circleciProjectReponame");
  if (options.circleciProjectId) explicitFields.push("circleciProjectId");
  if (options.circleciOrganizationId) explicitFields.push("circleciOrganizationId");
  if (options.circleciPipelineId) explicitFields.push("circleciPipelineId");
  if (options.circleciPipelineNumber) explicitFields.push("circleciPipelineNumber");
  if (options.circleciWorkflowId) explicitFields.push("circleciWorkflowId");
  if (options.circleciWorkflowJobId) explicitFields.push("circleciWorkflowJobId");
  if (options.circleciWorkflowWorkspaceId) explicitFields.push("circleciWorkflowWorkspaceId");
  if (options.circleciWorkingDirectory) explicitFields.push("circleciWorkingDirectory");
  if (options.circleciNodeIndex !== undefined) explicitFields.push("circleciNodeIndex");
  if (options.circleciNodeTotal !== undefined) explicitFields.push("circleciNodeTotal");
  if (options.circleciPrNumber !== undefined) explicitFields.push("circleciPrNumber");
  if (options.circleciPrReponame) explicitFields.push("circleciPrReponame");
  if (options.circleciPrUsername) explicitFields.push("circleciPrUsername");
  if (options.circleciPullRequest) explicitFields.push("circleciPullRequest");
  if (options.circleciPullRequests) explicitFields.push("circleciPullRequests");
  if (options.circleciUsername) explicitFields.push("circleciUsername");
  if (options.environmentId) explicitFields.push("environmentId");
  if (options.environmentTier) explicitFields.push("environmentTier");
  if (options.environmentUrl) explicitFields.push("environmentUrl");
  if (options.environmentAction) explicitFields.push("environmentAction");
  if (options.runnerId) explicitFields.push("runnerId");
  if (options.runnerTags) explicitFields.push("runnerTags");
  if (options.runnerVersion) explicitFields.push("runnerVersion");
  if (options.actorId) explicitFields.push("actorId");
  if (options.actorEmail) explicitFields.push("actorEmail");
  if (options.project) explicitFields.push("project");
  if (options.tag) explicitFields.push("tag");

  // Use PR branch if available, otherwise use main branch
  const finalBranch = pullRequestBranch || branch;
  
  // Build proper URLs based on platform
  let executionUrl = options.runUrl;
  let definitionUrl = "https://example.com/pipeline";

  if (githubServerUrl && githubRepo) {
    // If we have a workflow name/path, try to construct definition URL
    let workflowPath = options.pipeline || githubWorkflow || "unknown";
    const ref = githubWorkflowRef;
    if (ref && typeof ref === "string") {
      const parts = ref.split("@")[0]!.split("/");
      const filename = parts[parts.length - 1];
      if (filename) {
        workflowPath = filename;
      }
    }
    definitionUrl = `${githubServerUrl}/${githubRepo}/actions/workflows/${workflowPath}`;
    
    if (runId) {
      executionUrl = executionUrl || `${githubServerUrl}/${githubRepo}/actions/runs/${runId}`;
    }
  } else if (adoCollectionUri && adoTeamProject) {
    const cleanUri = adoCollectionUri.endsWith("/") ? adoCollectionUri.slice(0, -1) : adoCollectionUri;
    if (finalDefinitionId) {
      definitionUrl = `${cleanUri}/${adoTeamProject}/_build?definitionId=${finalDefinitionId}`;
    }
    if (adoBuildId || runId) {
      executionUrl = executionUrl || `${cleanUri}/${adoTeamProject}/_build/results?buildId=${adoBuildId || runId}`;
    }
  } else if (glJobUrl || glPipelineUrl || glProjectUrl) {
    executionUrl = executionUrl || glJobUrl || glPipelineUrl || (glProjectUrl && glPipelineId ? `${glProjectUrl}/-/pipelines/${glPipelineId}` : undefined);
    definitionUrl = glPipelineUrl || (glProjectUrl ? `${glProjectUrl}/-/pipelines` : "https://gitlab.com");
  } else if (bbRepoFullName && bbBuildNumber) {
    executionUrl = executionUrl || `https://bitbucket.org/${bbRepoFullName}/pipelines/results/${bbBuildNumber}`;
    definitionUrl = `https://bitbucket.org/${bbRepoFullName}/pipelines`;
  } else if (ccBuildUrl) {
    executionUrl = executionUrl || ccBuildUrl;
    definitionUrl = ccBuildUrl.replace(/\/\d+$/, "") || "https://circleci.com";
  }

  // Repository URL logic
  let repositoryUrl = options.repository ? (githubServerUrl ? `${githubServerUrl}/${repository}` : `https://github.com/${repository}`) : "https://github.com/cli-user/unknown-repo";
  if (adoRepositoryUri && !githubServerUrl) {
    repositoryUrl = adoRepositoryUri;
  } else if (glProjectUrl) {
    repositoryUrl = glProjectUrl;
  } else if (bbRepoFullName) {
    repositoryUrl = `https://bitbucket.org/${bbRepoFullName}`;
  } else if (ccRepositoryUrl) {
    repositoryUrl = ccRepositoryUrl;
  } else if (options.repositoryGitUrl) {
    repositoryUrl = options.repositoryGitUrl;
  }

  // Use CLI options if provided, otherwise use environment variables
  const hasAllOptions = pipeline && repository && finalBranch && commit;
  
  if (hasAllOptions) {
    const event: FailureEvent = {
      source,
      startedAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      pipeline: {
        name: pipeline,
        url: definitionUrl,
        runUrl: executionUrl,
        runId: runId || "cli-run",
        runNumber: parseInt(runNumber) || 1,
        step: options.step || parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
        stage: options.stage || glJobStage,
        runAttempt: parseInt(finalRunAttempt as string) || 1,
        runnerOs: finalRunnerOs,
        runnerArch: finalRunnerArch,
        runnerName: finalRunnerName,
        agentMachineName: finalAgentMachineName,
        definitionId: finalDefinitionId,
        definitionVersion: finalDefinitionVersion,
        sourcesDirectory: finalSourcesDirectory,
        binariesDirectory: finalBinariesDirectory,
        artifactStagingDirectory: finalArtifactStagingDirectory,
        containerId: finalContainerId,
        repositoryLocalPath: finalRepositoryLocalPath,
        stagingDirectory: finalStagingDirectory,
        workflowRef: finalWorkflowRef,
        workflowSha: finalWorkflowSha,
        runnerEnvironment: finalRunnerEnvironment,
        runnerDebug: finalRunnerDebug,
        retentionDays: finalRetentionDays,
        actorId: finalActorId,
        triggeringActor: finalTriggeringActor,
        refType: finalRefType,
        refProtected: finalRefProtected,
        job: finalJobName,
        jobName: finalJobName,
        action: options.action,
        actionPath: options.actionPath,
        actionRepository: options.actionRepository,
        baseRef: options.baseRef,
        headRef: options.headRef,
        runnerTemp: options.runnerTemp,
        runnerToolCache: options.runnerToolCache,
        runnerWorkspace: options.runnerWorkspace,
        workspace: options.workspace,
        jobStatus: options.jobStatus || glJobStatus,
        jobContainer: options.jobContainer || glJobImage || bbDockerHost,
        jobServices: options.jobServices,
        strategyJobIndex: options.strategyJobIndex ? parseInt(options.strategyJobIndex as string, 10) : undefined,
        strategyJobTotal: options.strategyJobTotal ? parseInt(options.strategyJobTotal as string, 10) : undefined,
        actionRef: options.actionRef,
        actionStatus: options.actionStatus,
        repositoryGitUrl: options.repositoryGitUrl,
        repositoryClean: adoRepositoryClean,
        repositoryGitSubmoduleCheckout: adoRepositoryGitSubmoduleCheckout,
        secretSource: options.secretSource,
        agentContainerMapping: finalAgentContainerMapping,
        agentReleaseDirectory: finalAgentReleaseDirectory,
        agentRootDirectory: finalAgentRootDirectory,
        agentId: finalAgentId,
        agentBuildDirectory: finalAgentBuildDirectory,
        agentHomeDirectory: finalAgentHomeDirectory,
        agentTempDirectory: finalAgentTempDirectory,
        agentToolsDirectory: finalAgentToolsDirectory,
        agentWorkFolder: finalAgentWorkFolder,
        agentJobStatus: adoAgentJobStatus,
        testResultsDirectory: finalTestResultsDirectory,
        pipelineWorkspace: finalPipelineWorkspace,
        systemJobName: finalSystemJobName,
        systemCollectionId: adoSystemCollectionId,
        systemCollectionUri: adoSystemCollectionUri,
        systemJobId: adoSystemJobId,
        systemDebug: finalSystemDebug,
        systemDefaultWorkingDirectory: finalSystemDefaultWorkingDirectory,
        systemTeamFoundationCollectionUri: finalSystemTeamFoundationCollectionUri,
        systemStageAttempt: adoSystemStageAttempt,
        systemStageDisplayName: adoSystemStageDisplayName,
        systemStageName: adoSystemStageName,
        systemPhaseAttempt: adoSystemPhaseAttempt,
        systemPhaseDisplayName: adoSystemPhaseDisplayName,
        systemPhaseName: adoSystemPhaseName,
        systemPlanId: adoSystemPlanId,
        systemHostType: adoSystemHostType,
        systemJobDisplayName: adoSystemJobDisplayName,
        prIsFork: adoPrIsFork !== undefined ? String(adoPrIsFork === "True") : undefined,
        prId: adoPrId || glMrId || bbPrId || options.prId,
        systemWorkFolder: adoSystemWorkFolder,
        tfBuild: adoTfBuild,
        checksStageAttempt: adoChecksStageAttempt,
        strategyName: adoStrategyName,
        strategyCycleName: adoStrategyCycleName,
        cronScheduleDisplayName: adoCronScheduleDisplayName,
        requestedFor: adoRequestedFor || glUserName || glUserLogin || bbStepTriggererUuid,
        requestedForEmail: adoRequestedForEmail || glUserEmail,
        requestedForId: adoRequestedForId || glUserId || bbStepTriggererUuid,
        queuedBy: adoQueuedBy,
        queuedById: adoQueuedById,
        sourceBranchName: adoSourceBranchName || glMrSourceBranch || glCommitBranch || bbBranch,
        sourceVersionMessage: adoSourceVersionMessage || glCommitMessage || glCommitTitle,
        repositoryId: adoRepositoryId || glProjectId || bbRepoUuid,
        repositoryProvider: adoRepositoryProvider || (source === "gitlab" || Boolean(process.env.GITLAB_CI) ? "gitlab" : (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER) ? "bitbucket" : (githubServerUrl ? "github" : undefined))),
        repositoryUri: adoRepositoryUri || glProjectUrl || (bbRepoFullName ? `https://bitbucket.org/${bbRepoFullName}` : undefined),
        ...(adoStageRequestedBy ? { stageRequestedBy: adoStageRequestedBy } : {}),
        ...(adoStageRequestedForId ? { stageRequestedForId: adoStageRequestedForId } : {}),
        ...(adoSourceTfvcShelveset ? { sourceTfvcShelveset: adoSourceTfvcShelveset } : {}),
        ...(adoSourceBranch ? { fullSourceBranch: adoSourceBranch } : {}),
        releaseDeploymentRequestedFor: finalReleaseDeploymentRequestedFor,
        releaseDeploymentRequestedForEmail: finalReleaseDeploymentRequestedForEmail,
        releaseDeploymentId: finalReleaseDeploymentId,
        releaseDefinitionEnvironmentId: finalReleaseDefinitionEnvironmentId,
        releaseDefinitionId: finalReleaseDefinitionId,
        releaseDefinitionName: finalReleaseDefinitionName,
        releaseEnvironmentId: finalReleaseEnvironmentId,
        releaseEnvironmentName: finalReleaseEnvironmentName,
        releasePrimaryArtifactSourceAlias: finalReleasePrimaryArtifactSourceAlias,
        releaseDescription: finalReleaseDescription,
        releaseId: finalReleaseId,
        releaseName: finalReleaseName,
        releaseUri: finalReleaseUri,
        releaseArtifacts: Object.keys(adoReleaseArtifacts).length > 0 ? adoReleaseArtifacts : undefined,
        // GitLab CI predefined variables mapping
        gitlabProjectId: glProjectId,
        gitlabProjectUrl: glProjectUrl,
        gitlabProjectTitle: glProjectTitle,
        gitlabProjectDescription: glProjectDescription,
        gitlabProjectVisibility: glProjectVisibility,
        gitlabProjectNamespace: glProjectNamespace,
        gitlabProjectRootNamespace: glProjectRootNamespace,
        gitlabPipelineId: glPipelineId,
        gitlabPipelineIid: glPipelineIid,
        gitlabPipelineUrl: glPipelineUrl,
        gitlabPipelineSource: glPipelineSource,
        gitlabPipelineName: glPipelineName,
        gitlabPipelineCreatedAt: glPipelineCreatedAt,
        gitlabJobId: glJobId,
        gitlabJobName: glJobName,
        gitlabJobStage: glJobStage,
        gitlabJobStatus: glJobStatus,
        gitlabJobStartedAt: glJobStartedAt,
        gitlabJobImage: glJobImage,
        gitlabJobTimeout: glJobTimeout,
        gitlabJobTags: glJobTags,
        gitlabCommitTitle: glCommitTitle,
        gitlabCommitDescription: glCommitDescription,
        gitlabCommitAuthor: glCommitAuthor,
        gitlabCommitTimestamp: glCommitTimestamp,
        gitlabCommitBeforeSha: glCommitBeforeSha,
        gitlabEnvironmentTier: glEnvironmentTier || options.environmentTier,
        gitlabEnvironmentUrl: glEnvironmentUrl || options.environmentUrl,
        gitlabEnvironmentAction: glEnvironmentAction || options.environmentAction,
        gitlabMergeRequestIid: glMrIid || options.prNumber,
        gitlabMergeRequestId: glMrId || options.prId,
        gitlabMergeRequestTitle: glMrTitle || options.prTitle,
        gitlabMergeRequestEvent: glMrEvent,
        gitlabMergeRequestSourceBranch: glMrSourceBranch || options.prSourceBranch,
        gitlabMergeRequestTargetBranch: glMrTargetBranch || options.prTargetBranchName,
        gitlabMergeRequestAssignees: glMrAssignees,
        gitlabMergeRequestLabels: glMrLabels,
        gitlabMergeRequestMilestone: glMrMilestone,
        gitlabRunnerId: glRunnerId || options.runnerId,
        gitlabRunnerDescription: glRunnerDesc || options.runnerName,
        gitlabRunnerTags: glRunnerTags || options.runnerTags,
        gitlabRunnerVersion: glRunnerVersion || options.runnerVersion,
        gitlabUserLogin: glUserLogin,
        gitlabUserName: glUserName,
        gitlabUserEmail: glUserEmail,
        gitlabUserId: glUserId || options.actorId,
        gitlabServerUrl: glServerUrl,
        gitlabServerVersion: glServerVersion,
        // Bitbucket Pipelines predefined variables mapping
        bitbucketBuildNumber: bbBuildNumber,
        bitbucketCloneDir: bbCloneDir,
        bitbucketCommit: bbCommit,
        bitbucketWorkspace: bbWorkspace,
        bitbucketWorkspaceUuid: bbWorkspaceUuid,
        bitbucketRepoOwner: bbRepoOwner,
        bitbucketRepoOwnerUuid: bbRepoOwnerUuid,
        bitbucketRepoSlug: bbRepoSlug,
        bitbucketRepoUuid: bbRepoUuid,
        bitbucketRepoFullName: bbRepoFullName,
        bitbucketRepoIsPrivate: bbRepoIsPrivate,
        bitbucketBranch: bbBranch,
        bitbucketTag: bbTag,
        bitbucketBookmark: bbBookmark,
        bitbucketParallelStep: bbParallelStep,
        bitbucketParallelStepCount: bbParallelStepCount,
        bitbucketPrId: bbPrId,
        bitbucketPrDestinationBranch: bbPrDestinationBranch,
        bitbucketPrDestinationCommit: bbPrDestinationCommit,
        bitbucketMergeQueuePrIds: bbMergeQueuePrIds,
        bitbucketGitHttpOrigin: bbGitHttpOrigin,
        bitbucketGitSshOrigin: bbGitSshOrigin,
        bitbucketExitCode: bbExitCode,
        bitbucketStepUuid: bbStepUuid,
        bitbucketPipelineUuid: bbPipelineUuid,
        bitbucketDeploymentEnvironment: bbDeploymentEnvironment,
        bitbucketDeploymentEnvironmentUuid: bbDeploymentEnvironmentUuid,
        bitbucketProjectKey: bbProjectKey,
        bitbucketProjectUuid: bbProjectUuid,
        bitbucketStepTriggererUuid: bbStepTriggererUuid,
        bitbucketStepRunNumber: bbStepRunNumber,
        bitbucketPackagesUsername: bbPackagesUsername,
        bitbucketDockerHost: bbDockerHost,
        bitbucketTriggerPipelineUuid: bbTriggerPipelineUuid,
        bitbucketTriggerPipelineRunUuid: bbTriggerPipelineRunUuid,
        bitbucketTriggerStepUuid: bbTriggerStepUuid,
        bitbucketTriggerPipelineSelectorType: bbTriggerPipelineSelectorType,
        bitbucketTriggerPipelineSelectorPattern: bbTriggerPipelineSelectorPattern,
        bitbucketTriggerPipelineStatus: bbTriggerPipelineStatus,
        bitbucketTriggerDeploymentUuid: bbTriggerDeploymentUuid,
        bitbucketTriggerDeploymentStatus: bbTriggerDeploymentStatus,
        bitbucketTriggerDeploymentEnvironmentName: bbTriggerDeploymentEnvironmentName,
        bitbucketTriggerPackagesPackageType: bbTriggerPackagesPackageType,
        bitbucketTriggerPackagesPackageName: bbTriggerPackagesPackageName,
        bitbucketTriggerPackagesArtifactName: bbTriggerPackagesArtifactName,
        bitbucketTriggerFixFlakyTestTargetBranch: bbTriggerFixFlakyTestTargetBranch,
        bitbucketTriggerFixFlakyTestSourceBranch: bbTriggerFixFlakyTestSourceBranch,
        bitbucketTriggerTestCaseFqdn: bbTriggerTestCaseFqdn,
        bitbucketTriggerTestCaseUuid: bbTriggerTestCaseUuid,
        // CircleCI predefined variables mapping
        circleciBuildNum: ccBuildNum,
        circleciBuildUrl: ccBuildUrl,
        circleciJob: ccJob,
        circleciBranch: ccBranch,
        circleciTag: ccTag,
        circleciSha1: ccSha1,
        circleciRepositoryUrl: ccRepositoryUrl,
        circleciProjectUsername: ccProjectUsername,
        circleciProjectReponame: ccProjectReponame,
        circleciProjectId: ccProjectId,
        circleciOrganizationId: ccOrganizationId,
        circleciPipelineId: ccPipelineId,
        circleciPipelineNumber: ccPipelineNumber,
        circleciWorkflowId: ccWorkflowId,
        circleciWorkflowJobId: ccWorkflowJobId,
        circleciWorkflowWorkspaceId: ccWorkflowWorkspaceId,
        circleciWorkingDirectory: ccWorkingDirectory,
        circleciNodeIndex: ccNodeIndex,
        circleciNodeTotal: ccNodeTotal,
        circleciPrNumber: ccPrNumber,
        circleciPrReponame: ccPrReponame,
        circleciPrUsername: ccPrUsername,
        circleciPullRequest: ccPullRequest,
        circleciPullRequests: ccPullRequests,
        circleciUsername: ccUsername,
        circleciOidcToken: ccOidcToken,
        circleciOidcTokenV2: ccOidcTokenV2,
      },
      repository: {
        owner: options.repositoryOwner || githubRepositoryOwner || glProjectRootNamespace || glProjectNamespace || bbWorkspace || bbRepoOwner || ccProjectUsername || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
        name: repository?.split("/")[1] || repository || "unknown-repo",
        url: repositoryUrl,
        defaultBranch: "main",
        id: adoRepositoryId || githubRepositoryId || glProjectId || bbRepoUuid,
        ownerId: githubRepositoryOwnerId || bbWorkspaceUuid,
        provider: adoRepositoryProvider || (source === "gitlab" || Boolean(process.env.GITLAB_CI) ? "gitlab" : (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER) ? "bitbucket" : (source === "circleci" || Boolean(process.env.CIRCLECI) ? "circleci" : (githubServerUrl ? "github" : undefined)))),
      },
      commit: {
        sha: commit,
        url: (repository && commit)
          ? (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER)
              ? `https://bitbucket.org/${bbRepoFullName || repository}/commits/${commit}`
              : (source === "circleci" || Boolean(process.env.CIRCLECI)
                  ? (ccRepositoryUrl ? `${ccRepositoryUrl.replace(/\.git$/, "")}/commit/${commit}` : `https://github.com/${repository}/commit/${commit}`)
                  : (githubServerUrl
                      ? `${githubServerUrl}/${repository}/commit/${commit}`
                      : (glProjectUrl
                          ? `${glProjectUrl}/-/commit/${commit}`
                          : repositoryUrl + `/commit/${commit}`))))
          : "https://github.com/cli-user/unknown-repo/commit/unknown",
        message: options.commitMessage || glCommitMessage || glCommitTitle || adoSourceVersionMessage || "CLI analysis",
        author: options.actor || glCommitAuthor || triggeredBy,
        authorEmail: options.actorEmail || glUserEmail || adoRequestedForEmail,
      },
      branch: finalBranch,
      environment: environment,
      triggeredBy: triggeredBy,
      eventName: finalEventName,
      apiUrl: finalApiUrl,
      graphqlUrl: options.graphqlUrl,
      eventPayload: options.eventPayload ? (typeof options.eventPayload === 'string' ? JSON.parse(options.eventPayload) : options.eventPayload) : undefined,
      metadata: metadata,
      explicitFields: explicitFields,
      failure: {
        exitCode: options.exitCode !== undefined ? parseInt(options.exitCode, 10) : parsedLogs.exitCodes[0],
        errorMessage: options.errorMessage || parsedLogs.errorMessages[0],
        failedStep: options.step || parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
        logs: parsedLogs.entries.map((e: any) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
        logsTruncated: parsedLogs.truncated,
      },
    };
    
    // Add pull request information if available
    if (isPullRequest && pullRequestNumber) {
      let prUrl: string;
      if (source === "circleci" || Boolean(process.env.CIRCLECI)) {
        prUrl = ccPullRequest || (repository ? `https://github.com/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pull/${pullRequestNumber}`);
      } else if (githubServerUrl && repository) {
        prUrl = `${githubServerUrl}/${repository}/pull/${pullRequestNumber}`;
      } else if (glProjectUrl) {
        prUrl = `${glProjectUrl}/-/merge_requests/${pullRequestNumber}`;
      } else if (glServerUrl && repository) {
        prUrl = `${glServerUrl}/${repository}/-/merge_requests/${pullRequestNumber}`;
      } else if (bbRepoFullName) {
        prUrl = `https://bitbucket.org/${bbRepoFullName}/pull-requests/${pullRequestNumber}`;
      } else if (adoCollectionUri || adoTeamProject) {
        prUrl = `${repositoryUrl}/pullrequest/${pullRequestNumber}`;
      } else {
        prUrl = `${repositoryUrl}/pull/${pullRequestNumber}`;
      }

      (event as any).pullRequest = {
        number: parseInt(pullRequestNumber),
        url: prUrl,
        title: options.prTitle || glMrTitle || `PR #${pullRequestNumber}`,
        author: options.actor || glCommitAuthor || triggeredBy || "unknown",
        ...(options.prSourceBranch || glMrSourceBranch || bbBranch ? { sourceBranch: options.prSourceBranch || glMrSourceBranch || bbBranch } : {}),
        ...(options.prTargetBranchName || glMrTargetBranch || bbPrDestinationBranch ? { targetBranch: options.prTargetBranchName || glMrTargetBranch || bbPrDestinationBranch } : {}),
      };
    }
    
    return event;
  }

  // Interactive prompts for missing information
  const questions = [
    {
      type: "input",
      name: "pipelineName",
      message: "Pipeline/workflow name:",
      default: pipeline || "unknown-pipeline",
    },
    {
      type: "input",
      name: "repositoryName",
      message: "Repository name:",
      default: repository || "unknown-repo",
    },
    {
      type: "input",
      name: "branch",
      message: "Branch:",
      default: finalBranch || "main",
    },
    {
      type: "input",
      name: "commitSha",
      message: "Commit SHA:",
      default: commit || "unknown",
    },
    {
      type: "input",
      name: "environment",
      message: "Environment (optional):",
      default: environment,
    },
  ];

  const answers = await inquirer.prompt(questions as any);

  const event: FailureEvent = {
    source,
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
      pipeline: {
        name: pipeline || answers.pipelineName,
        url: definitionUrl,
        runUrl: executionUrl,
        runId: runId || "cli-run",
        runNumber: parseInt(runNumber) || 1,
        step: options.step || parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
        stage: options.stage || glJobStage,
        runAttempt: parseInt(finalRunAttempt as string) || 1,
        runnerOs: finalRunnerOs,
        runnerArch: finalRunnerArch,
        runnerName: finalRunnerName,
        agentMachineName: finalAgentMachineName,
        definitionId: finalDefinitionId,
        definitionVersion: finalDefinitionVersion,
        sourcesDirectory: finalSourcesDirectory,
        binariesDirectory: finalBinariesDirectory,
        artifactStagingDirectory: finalArtifactStagingDirectory,
        containerId: finalContainerId,
        repositoryLocalPath: finalRepositoryLocalPath,
        workflowRef: finalWorkflowRef,
        workflowSha: finalWorkflowSha,
        runnerEnvironment: finalRunnerEnvironment,
        runnerDebug: finalRunnerDebug,
        retentionDays: finalRetentionDays,
        actorId: finalActorId,
        triggeringActor: finalTriggeringActor,
        refType: finalRefType,
        refProtected: finalRefProtected,
        job: finalJobName,
        jobName: finalJobName,
        ...(adoStageRequestedBy ? { stageRequestedBy: adoStageRequestedBy } : {}),
        ...(adoStageRequestedForId ? { stageRequestedForId: adoStageRequestedForId } : {}),
        ...(adoSourceTfvcShelveset ? { sourceTfvcShelveset: adoSourceTfvcShelveset } : {}),
        ...(adoSourceBranch ? { fullSourceBranch: adoSourceBranch } : {}),
        gitlabProjectId: glProjectId,
        gitlabProjectUrl: glProjectUrl,
        gitlabProjectTitle: glProjectTitle,
        gitlabProjectDescription: glProjectDescription,
        gitlabProjectVisibility: glProjectVisibility,
        gitlabProjectNamespace: glProjectNamespace,
        gitlabProjectRootNamespace: glProjectRootNamespace,
        gitlabPipelineId: glPipelineId,
        gitlabPipelineIid: glPipelineIid,
        gitlabPipelineUrl: glPipelineUrl,
        gitlabPipelineSource: glPipelineSource,
        gitlabPipelineName: glPipelineName,
        gitlabPipelineCreatedAt: glPipelineCreatedAt,
        gitlabJobId: glJobId,
        gitlabJobName: glJobName,
        gitlabJobStage: glJobStage,
        gitlabJobStatus: glJobStatus,
        gitlabJobStartedAt: glJobStartedAt,
        gitlabJobImage: glJobImage,
        gitlabJobTimeout: glJobTimeout,
        gitlabJobTags: glJobTags,
        gitlabCommitTitle: glCommitTitle,
        gitlabCommitDescription: glCommitDescription,
        gitlabCommitAuthor: glCommitAuthor,
        gitlabCommitTimestamp: glCommitTimestamp,
        gitlabCommitBeforeSha: glCommitBeforeSha,
        gitlabEnvironmentTier: glEnvironmentTier || options.environmentTier,
        gitlabEnvironmentUrl: glEnvironmentUrl || options.environmentUrl,
        gitlabEnvironmentAction: glEnvironmentAction || options.environmentAction,
        gitlabMergeRequestIid: glMrIid || options.prNumber,
        gitlabMergeRequestId: glMrId || options.prId,
        gitlabMergeRequestTitle: glMrTitle || options.prTitle,
        gitlabMergeRequestEvent: glMrEvent,
        gitlabMergeRequestSourceBranch: glMrSourceBranch || options.prSourceBranch,
        gitlabMergeRequestTargetBranch: glMrTargetBranch || options.prTargetBranchName,
        gitlabMergeRequestAssignees: glMrAssignees,
        gitlabMergeRequestLabels: glMrLabels,
        gitlabMergeRequestMilestone: glMrMilestone,
        gitlabRunnerId: glRunnerId || options.runnerId,
        gitlabRunnerDescription: glRunnerDesc || options.runnerName,
        gitlabRunnerTags: glRunnerTags || options.runnerTags,
        gitlabRunnerVersion: glRunnerVersion || options.runnerVersion,
        gitlabUserLogin: glUserLogin,
        gitlabUserName: glUserName,
        gitlabUserEmail: glUserEmail,
        gitlabUserId: glUserId || options.actorId,
        gitlabServerUrl: glServerUrl,
        gitlabServerVersion: glServerVersion,
        // Bitbucket Pipelines predefined variables mapping
        bitbucketBuildNumber: bbBuildNumber,
        bitbucketCloneDir: bbCloneDir,
        bitbucketCommit: bbCommit,
        bitbucketWorkspace: bbWorkspace,
        bitbucketWorkspaceUuid: bbWorkspaceUuid,
        bitbucketRepoOwner: bbRepoOwner,
        bitbucketRepoOwnerUuid: bbRepoOwnerUuid,
        bitbucketRepoSlug: bbRepoSlug,
        bitbucketRepoUuid: bbRepoUuid,
        bitbucketRepoFullName: bbRepoFullName,
        bitbucketRepoIsPrivate: bbRepoIsPrivate,
        bitbucketBranch: bbBranch,
        bitbucketTag: bbTag,
        bitbucketBookmark: bbBookmark,
        bitbucketParallelStep: bbParallelStep,
        bitbucketParallelStepCount: bbParallelStepCount,
        bitbucketPrId: bbPrId,
        bitbucketPrDestinationBranch: bbPrDestinationBranch,
        bitbucketPrDestinationCommit: bbPrDestinationCommit,
        bitbucketMergeQueuePrIds: bbMergeQueuePrIds,
        bitbucketGitHttpOrigin: bbGitHttpOrigin,
        bitbucketGitSshOrigin: bbGitSshOrigin,
        bitbucketExitCode: bbExitCode,
        bitbucketStepUuid: bbStepUuid,
        bitbucketPipelineUuid: bbPipelineUuid,
        bitbucketDeploymentEnvironment: bbDeploymentEnvironment,
        bitbucketDeploymentEnvironmentUuid: bbDeploymentEnvironmentUuid,
        bitbucketProjectKey: bbProjectKey,
        bitbucketProjectUuid: bbProjectUuid,
        bitbucketStepTriggererUuid: bbStepTriggererUuid,
        bitbucketStepRunNumber: bbStepRunNumber,
        bitbucketPackagesUsername: bbPackagesUsername,
        bitbucketDockerHost: bbDockerHost,
        bitbucketTriggerPipelineUuid: bbTriggerPipelineUuid,
        bitbucketTriggerPipelineRunUuid: bbTriggerPipelineRunUuid,
        bitbucketTriggerStepUuid: bbTriggerStepUuid,
        bitbucketTriggerPipelineSelectorType: bbTriggerPipelineSelectorType,
        bitbucketTriggerPipelineSelectorPattern: bbTriggerPipelineSelectorPattern,
        bitbucketTriggerPipelineStatus: bbTriggerPipelineStatus,
        bitbucketTriggerDeploymentUuid: bbTriggerDeploymentUuid,
        bitbucketTriggerDeploymentStatus: bbTriggerDeploymentStatus,
        bitbucketTriggerDeploymentEnvironmentName: bbTriggerDeploymentEnvironmentName,
        bitbucketTriggerPackagesPackageType: bbTriggerPackagesPackageType,
        bitbucketTriggerPackagesPackageName: bbTriggerPackagesPackageName,
        bitbucketTriggerPackagesArtifactName: bbTriggerPackagesArtifactName,
        bitbucketTriggerFixFlakyTestTargetBranch: bbTriggerFixFlakyTestTargetBranch,
        bitbucketTriggerFixFlakyTestSourceBranch: bbTriggerFixFlakyTestSourceBranch,
        bitbucketTriggerTestCaseFqdn: bbTriggerTestCaseFqdn,
        bitbucketTriggerTestCaseUuid: bbTriggerTestCaseUuid,
        // CircleCI predefined variables mapping
        circleciBuildNum: ccBuildNum,
        circleciBuildUrl: ccBuildUrl,
        circleciJob: ccJob,
        circleciBranch: ccBranch,
        circleciTag: ccTag,
        circleciSha1: ccSha1,
        circleciRepositoryUrl: ccRepositoryUrl,
        circleciProjectUsername: ccProjectUsername,
        circleciProjectReponame: ccProjectReponame,
        circleciProjectId: ccProjectId,
        circleciOrganizationId: ccOrganizationId,
        circleciPipelineId: ccPipelineId,
        circleciPipelineNumber: ccPipelineNumber,
        circleciWorkflowId: ccWorkflowId,
        circleciWorkflowJobId: ccWorkflowJobId,
        circleciWorkflowWorkspaceId: ccWorkflowWorkspaceId,
        circleciWorkingDirectory: ccWorkingDirectory,
        circleciNodeIndex: ccNodeIndex,
        circleciNodeTotal: ccNodeTotal,
        circleciPrNumber: ccPrNumber,
        circleciPrReponame: ccPrReponame,
        circleciPrUsername: ccPrUsername,
        circleciPullRequest: ccPullRequest,
        circleciPullRequests: ccPullRequests,
        circleciUsername: ccUsername,
        circleciOidcToken: ccOidcToken,
        circleciOidcTokenV2: ccOidcTokenV2,
      },
      repository: {
        owner: options.repositoryOwner || githubRepositoryOwner || glProjectRootNamespace || glProjectNamespace || bbWorkspace || bbRepoOwner || ccProjectUsername || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
        name: repository?.split("/")[1] || answers.repositoryName,
        url: repositoryUrl,
        defaultBranch: "main",
        id: adoRepositoryId || githubRepositoryId || glProjectId || bbRepoUuid,
        ownerId: githubRepositoryOwnerId || bbRepoOwnerUuid || bbWorkspaceUuid,
        provider: adoRepositoryProvider || (source === "gitlab" || Boolean(process.env.GITLAB_CI) ? "gitlab" : (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER) ? "bitbucket" : (source === "circleci" || Boolean(process.env.CIRCLECI) ? "circleci" : (githubServerUrl ? "github" : undefined)))),
      },
    commit: {
      sha: commit || answers.commitSha,
      url: (repository && commit)
        ? (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER)
            ? `https://bitbucket.org/${bbRepoFullName || repository}/commits/${commit}`
            : (source === "circleci" || Boolean(process.env.CIRCLECI)
                ? (ccRepositoryUrl ? `${ccRepositoryUrl.replace(/\.git$/, "")}/commit/${commit}` : `https://github.com/${repository}/commit/${commit}`)
                : (githubServerUrl
                    ? `${githubServerUrl}/${repository}/commit/${commit}`
                    : (glProjectUrl
                        ? `${glProjectUrl}/-/commit/${commit}`
                        : repositoryUrl + `/commit/${commit}`))))
        : `https://github.com/cli-user/unknown-repo/commit/${answers.commitSha}`,
      message: options.commitMessage || glCommitMessage || glCommitTitle || adoSourceVersionMessage || "CLI analysis",
      author: options.actor || glCommitAuthor || triggeredBy,
      authorEmail: options.actorEmail || glUserEmail || adoRequestedForEmail,
    },
    branch: finalBranch || answers.branch,
    environment: environment || answers.environment,
    triggeredBy: triggeredBy,
    eventName: finalEventName,
    apiUrl: finalApiUrl,
    metadata: parseMetadata(options.meta),
    explicitFields: explicitFields,
    failure: {
      exitCode: options.exitCode !== undefined ? parseInt(options.exitCode, 10) : parsedLogs.exitCodes[0],
      errorMessage: options.errorMessage || parsedLogs.errorMessages[0],
      failedStep: options.step || parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
      logs: parsedLogs.entries.map((e: any) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
      logsTruncated: parsedLogs.truncated,
    },
  };
  
  // Add pull request information if available
  if (isPullRequest && pullRequestNumber) {
    let prUrl: string;
    if (source === "circleci" || Boolean(process.env.CIRCLECI)) {
      prUrl = ccPullRequest || (repository ? `https://github.com/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pull/${pullRequestNumber}`);
    } else if (source === "bitbucket" || Boolean(process.env.BITBUCKET_BUILD_NUMBER)) {
      prUrl = `https://bitbucket.org/${bbRepoFullName || repository}/pull-requests/${pullRequestNumber}`;
    } else if (githubServerUrl && repository) {
      prUrl = `${githubServerUrl}/${repository}/pull/${pullRequestNumber}`;
    } else if (glProjectUrl) {
      prUrl = `${glProjectUrl}/-/merge_requests/${pullRequestNumber}`;
    } else if (glServerUrl && repository) {
      prUrl = `${glServerUrl}/${repository}/-/merge_requests/${pullRequestNumber}`;
    } else if (adoCollectionUri || adoTeamProject) {
      prUrl = `${repositoryUrl}/pullrequest/${pullRequestNumber}`;
    } else {
      prUrl = `${repositoryUrl}/pull/${pullRequestNumber}`;
    }

    (event as any).pullRequest = {
      number: parseInt(pullRequestNumber),
      url: prUrl,
      title: options.prTitle || glMrTitle || `PR #${pullRequestNumber}`,
      author: options.actor || glCommitAuthor || triggeredBy || "unknown",
      ...(options.prSourceBranch || glMrSourceBranch || bbBranch ? { sourceBranch: options.prSourceBranch || glMrSourceBranch || bbBranch } : {}),
      ...(options.prTargetBranchName || glMrTargetBranch || bbPrDestinationBranch ? { targetBranch: options.prTargetBranchName || glMrTargetBranch || bbPrDestinationBranch } : {}),
    };
  }

  return event;
}

function parseMetadata(metaArray: string[] | undefined): Record<string, string> {
  const metadata: Record<string, string> = {};
  if (!metaArray) return metadata;

  for (const item of metaArray) {
    const [key, ...valueParts] = item.split("=");
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join("=").trim();
    }
  }
  return metadata;
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("Unhandled rejection at:"), promise, "reason:", reason);
  process.exit(1);
});

// Run CLI when not in unit test environment
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  program.parse();
}
