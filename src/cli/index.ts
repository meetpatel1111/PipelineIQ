#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { 
  processFailureEvent, 
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
  .option("-l, --logs <path>", "Path to log file or directory")
  .option("-f, --format <format>", "Log format (github-actions, azure-devops, terraform, kubernetes, docker, junit, generic)", "generic")
  .option("-s, --source <source>", "Failure source (github, azure-devops)", "github")
  .option("-c, --config <path>", "Path to config file", "./pipelineiq.json")
  .option("--dry-run", "Show what would be done without creating Jira issues", false)
  .option("--github-token <token>", "GitHub token for API access")
  .option("--environment <env>", "Deployment environment (dev/staging/production)")
  .option("--repository <repo>", "Repository name (owner/repo)")
  .option("--branch <branch>", "Branch name")
  .option("--commit <sha>", "Commit SHA")
  .option("--pipeline <name>", "Pipeline/workflow name")
  .option("--run-id <id>", "Run ID or build number")
  .option("--run-number <number>", "Run number")
  .option("--run-url <url>", "Run URL or pipeline URL")
  .option("--event-name <name>", "Event name (push, pull_request, etc.)")
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
  .option("-m, --ai-model <model>", "AI model to use (e.g. gpt-4, gemini-2.5-flash)")
  .option("--ai-max-tokens <tokens>", "Maximum output tokens for AI response")
  .option("--assignee <id>", "Jira account ID to assign the issue to (defaults to unassigned)")
  .option("--default-assignee <id>", "Alias for --assignee (defaults to unassigned)")
  .option("--display-meta <fields>", "Comma-separated list of metadata fields to display", (val) => val.split(","))
  .option("--meta <key=value>", "Custom metadata to include in the ticket (can be repeated)", (val, memo: string[]) => {
    memo.push(val);
    return memo;
  }, [])
  .action(async (options) => {
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

async function handleAnalyze(options: any) {
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
    if (options.displayMeta) configData.displayMetadata = options.displayMeta;

    // Now validate the fully merged configuration
    const config = PipelineIQConfigSchema.parse(configData);
    
    // Read and parse logs or fetch from platform API
    let event: FailureEvent;
    
    if (options.logs) {
      const logContent = await readLogs(options.logs);
      const parsedLogs = parseLogs(logContent, {
        format: options.format as LogFormat,
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
    }
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
        // Test by getting project info
        await jira.request("GET", `/rest/api/3/project/${config.jiraProject}`);
        spinner.succeed();
        console.log(chalk.green("✓ Jira connectivity test passed"));
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
    return await mapAzureDevOpsContext(options.environment);
  }

  throw new Error(`Unsupported failure source for automatic log fetching: ${source}. Please provide logs via --logs.`);
}

async function loadConfig(configPath: string): Promise<any> {
  try {
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
    
    // If a specific config path was provided but doesn't exist, throw error
    if (configPath !== "./pipelineiq.json" && configPath !== "pipelineiq.json") {
      throw new Error(`Configuration file not found at: ${configPath}`);
    }
  } catch (error) {
    if ((error as any).code !== "ENOENT") {
      throw new Error(`Error reading configuration file ${configPath}: ${(error as Error).message}`);
    }
  }

  // No config file found, return environment variable structure for merging
  return {
    jira: {
      baseUrl: (process.env.JIRA_URL || "").trim(),
      email: (process.env.JIRA_EMAIL || "").trim(),
      apiToken: (process.env.JIRA_TOKEN || "").trim(),
    },
    jiraProject: (process.env.JIRA_PROJECT || "").trim(),
    ai: { mode: "disabled" },
    dedup: { enabled: true, windowHours: 24 },
  };
}

async function initConfig() {
  const questions = [
    {
      type: "input",
      name: "jiraUrl",
      message: "Jira base URL:",
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
      message: "Jira email:",
      validate: (input: string) => input.length > 0 || "Email is required",
    },
    {
      type: "password",
      name: "jiraToken",
      message: "Jira API token:",
      validate: (input: string) => input.length > 0 || "API token is required",
    },
    {
      type: "input",
      name: "jiraProject",
      message: "Jira project key:",
      default: "DEVOPS",
    },
    {
      type: "list",
      name: "aiMode",
      message: "AI mode:",
      choices: ["disabled", "assist", "full"],
      default: "disabled",
    },
  ];

  const answers = await inquirer.prompt(questions as any);
  
  const config = {
    jira: {
      baseUrl: answers.jiraUrl,
      email: answers.jiraEmail,
      apiToken: answers.jiraToken,
    },
    jiraProject: answers.jiraProject,
    ai: { mode: answers.aiMode },
    dedup: { enabled: true },
  };

  await fs.writeJson("./pipelineiq.json", config, { spaces: 2 });
  console.log(chalk.green("✓ Configuration saved to ./pipelineiq.json"));
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

async function createFailureEvent(
  source: FailureSource,
  parsedLogs: any,
  options: any
): Promise<FailureEvent> {
  // Check for built-in CI/CD environment variables
  const githubToken = options.githubToken || process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const environment = options.environment || process.env.ENVIRONMENT || process.env.DEPLOYMENT_ENVIRONMENT || process.env.ENVIRONMENT_NAME;
  
  // GitHub Actions built-in variables
    const githubRepo = process.env.GITHUB_REPOSITORY || options.repository;
  const githubRef = process.env.GITHUB_REF || options.branch;
  const githubSha = process.env.GITHUB_SHA || options.commit;
  const githubRunId = process.env.GITHUB_RUN_ID || options.runId;
  const githubRunNumber = process.env.GITHUB_RUN_NUMBER || options.runId;
  const githubWorkflow = process.env.GITHUB_WORKFLOW || options.pipeline;
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
  const adoRepo = process.env.BUILD_REPOSITORY_NAME || options.repository;
  const adoSourceBranch = process.env.BUILD_SOURCEBRANCH || options.branch;
  const adoSourceVersion = process.env.BUILD_SOURCEVERSION || options.commit;
  const adoBuildId = process.env.BUILD_BUILDID || options.runId;
  const adoBuildNumber = process.env.BUILD_BUILDNUMBER || options.runId;
  const adoPipeline = process.env.BUILD_DEFINITIONNAME || options.pipeline;
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
  
  // Use environment variables if available, otherwise use CLI options
  const repository = githubRepo || adoRepo || options.repository;
  const branch = githubRef?.replace('refs/heads/', '') || adoSourceBranch?.replace('refs/heads/', '') || adoSourceBranchName || options.branch;
  const commit = githubSha || adoSourceVersion || options.commit;
  const pipeline = githubWorkflow || adoPipeline || options.pipeline;
  const runId = githubRunId || adoBuildId || options.runId;
  const runNumber = githubRunNumber || adoBuildNumber || options.runId;
  const triggeredBy = githubActor || adoRequestedFor || adoRequestedForEmail || adoQueuedBy || adoRequestedForId || adoQueuedById || process.env.BUILD_QUEUEDBY || "cli-user";
  
  // Pull request information
  const pullRequestNumber = githubRef?.match(/refs\/pull\/(\d+)\//)?.[1] || adoPrNumber || adoPrId;
  const isPullRequest = !!(githubRef?.includes('refs/pull/') || adoPrId || adoPrNumber);
  const pullRequestBranch = adoPrSourceBranch?.replace('refs/heads/', '');
  
  // Rich data mapping for Azure DevOps
  const adoJobName = process.env.SYSTEM_JOBNAME || process.env.SYSTEM_PHASENAME || process.env.SYSTEM_STAGENAME || adoAgentJobName;
  const adoJobAttempt = process.env.SYSTEM_JOBATTEMPT;
  const adoPhaseAttempt = process.env.SYSTEM_PHASEATTEMPT;
  const adoRunAttempt = adoJobAttempt || adoPhaseAttempt || process.env.SYSTEM_STAGEATTEMPT;
  const adoApiUrl = process.env.SYSTEM_COLLECTIONURI;
  
  const finalJobName = options.jobName || githubJob || adoJobName;
  const finalRunAttempt = githubRunAttempt || adoRunAttempt || options.runAttempt;
  const finalEventName = githubEventName || adoBuildReason || options.eventName;
  const finalApiUrl = githubApiUrl || adoCollectionUri || options.apiUrl;
  const finalDefinitionId = adoSystemDefinitionId;
  const finalDefinitionVersion = adoDefinitionVersion;
  const finalSourcesDirectory = adoSourcesDirectory || githubWorkspace;
  const finalBinariesDirectory = adoBinariesDirectory;
  const finalArtifactStagingDirectory = adoArtifactStagingDirectory;
  const finalContainerId = adoContainerId;
  const finalRepositoryLocalPath = adoRepositoryLocalPath;
  const finalRetentionDays = githubRetentionDays ? parseInt(githubRetentionDays) : undefined;
  const finalRunnerEnvironment = runnerEnvironment;
  const finalRunnerDebug = runnerDebug === "1";
  const finalWorkflowRef = githubWorkflowRef;
  const finalWorkflowSha = githubWorkflowSha;
  const finalActorId = githubActorId;
  const finalTriggeringActor = githubTriggeringActor;
  const finalRefType = githubRefType;
  const finalRefProtected = githubRefProtected === "true";
  const finalPrNumber = pullRequestNumber;
  const finalRepoOwner = githubRepositoryOwner;
  const finalRunnerOs = runnerOs || adoAgentOs || options.runnerOs;
  const finalRunnerArch = runnerArch || adoAgentArch || options.runnerArch;
  const finalRunnerName = runnerName || adoAgentName || options.runnerName;
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
  }

  // Repository URL logic
  let repositoryUrl = options.repository ? (githubServerUrl ? `${githubServerUrl}/${repository}` : `https://github.com/${repository}`) : "https://github.com/cli-user/unknown-repo";
  if (adoRepositoryUri && !githubServerUrl) {
    repositoryUrl = adoRepositoryUri;
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
        step: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
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
        jobStatus: options.jobStatus,
        jobContainer: options.jobContainer,
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
        prId: adoPrId,
        systemWorkFolder: adoSystemWorkFolder,
        tfBuild: adoTfBuild,
        checksStageAttempt: adoChecksStageAttempt,
        strategyName: adoStrategyName,
        strategyCycleName: adoStrategyCycleName,
        cronScheduleDisplayName: adoCronScheduleDisplayName,
        requestedFor: adoRequestedFor,
        requestedForEmail: adoRequestedForEmail,
        requestedForId: adoRequestedForId,
        queuedBy: adoQueuedBy,
        queuedById: adoQueuedById,
        sourceBranchName: adoSourceBranchName,
        sourceVersionMessage: adoSourceVersionMessage,
        repositoryId: adoRepositoryId,
        repositoryProvider: adoRepositoryProvider,
        repositoryUri: adoRepositoryUri,
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
      },
      repository: {
        owner: options.repositoryOwner || githubRepositoryOwner || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
        name: repository?.split("/")[1] || repository || "unknown-repo",
        url: repositoryUrl,
        defaultBranch: "main",
        id: adoRepositoryId || githubRepositoryId,
        ownerId: githubRepositoryOwnerId,
        provider: adoRepositoryProvider || (githubServerUrl ? "github" : undefined),
      },
      commit: {
        sha: commit,
        url: repository && commit ? (githubServerUrl ? `${githubServerUrl}/${repository}/commit/${commit}` : repositoryUrl + `/commit/${commit}`) : "https://github.com/cli-user/unknown-repo/commit/unknown",
        message: adoSourceVersionMessage || "CLI analysis",
        author: triggeredBy,
        authorEmail: adoRequestedForEmail,
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
        exitCode: parsedLogs.exitCodes[0],
        errorMessage: parsedLogs.errorMessages[0],
        failedStep: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
        logs: parsedLogs.entries.map((e: any) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
        logsTruncated: parsedLogs.truncated,
      },
    };
    
    // Add pull request information if available
    if (isPullRequest && pullRequestNumber) {
      (event as any).pullRequest = {
        number: parseInt(pullRequestNumber),
        url: githubServerUrl ? `${githubServerUrl}/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pullrequest/${pullRequestNumber}`,
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
        step: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
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
      },
      repository: {
        owner: options.repositoryOwner || githubRepositoryOwner || adoTeamProject || repository?.split("/")[0] || triggeredBy?.split("\\")[1] || "cli-user",
        name: repository?.split("/")[1] || answers.repositoryName,
        url: repositoryUrl,
        defaultBranch: "main",
        id: adoRepositoryId || githubRepositoryId,
        ownerId: githubRepositoryOwnerId,
        provider: adoRepositoryProvider || (githubServerUrl ? "github" : undefined),
      },
    commit: {
      sha: commit || answers.commitSha,
      url: (repository && commit) ? (githubServerUrl ? `${githubServerUrl}/${repository}/commit/${commit}` : repositoryUrl + `/commit/${commit}`) : `https://github.com/cli-user/unknown-repo/commit/${answers.commitSha}`,
      message: adoSourceVersionMessage || "CLI analysis",
      author: triggeredBy,
    },
    branch: finalBranch || answers.branch,
    environment: environment || answers.environment,
    triggeredBy: triggeredBy,
    eventName: finalEventName,
    apiUrl: finalApiUrl,
    metadata: parseMetadata(options.meta),
    explicitFields: [],
    failure: {
      exitCode: parsedLogs.exitCodes[0],
      errorMessage: parsedLogs.errorMessages[0],
      failedStep: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
      logs: parsedLogs.entries.map((e: any) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
      logsTruncated: parsedLogs.truncated,
    },
  };
  
  // Add pull request information if available
  if (isPullRequest && pullRequestNumber) {
    (event as any).pullRequest = {
      number: parseInt(pullRequestNumber),
      url: githubServerUrl ? `${githubServerUrl}/${repository}/pull/${pullRequestNumber}` : `${repositoryUrl}/pullrequest/${pullRequestNumber}`,
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

// Run CLI
program.parse();
