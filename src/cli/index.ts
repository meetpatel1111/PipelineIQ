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
  .version("0.0.1");

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
  .option("--issue-type <type>", "Jira issue type to create (default from config)")
  .option("--dedup-window <hours>", "Deduplication window in hours (default from config)")
  .option("--jira-url <url>", "Jira base URL")
  .option("--jira-email <email>", "Jira user email")
  .option("--jira-token <token>", "Jira API token")
  .option("--jira-project <key>", "Jira project key")
  .option("--ai-mode <mode>", "AI mode (disabled | assist | full)")
  .option("--ai-api-key <key>", "AI API key")
  .option("--ai-provider <provider>", "AI provider (openai | anthropic | azure-openai | gemini)")
  .option("--ai-model <model>", "AI model to use (e.g. gpt-4, gemini-2.5-flash)")
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
    if (options.jiraUrl) configData.jira.baseUrl = options.jiraUrl;
    if (options.jiraEmail) configData.jira.email = options.jiraEmail;
    if (options.jiraToken) configData.jira.apiToken = options.jiraToken;
    if (options.jiraProject) configData.jiraProject = options.jiraProject;
    if (options.issueType) configData.issueType = options.issueType;
    if (options.dedupWindow) configData.dedup.windowHours = parseInt(options.dedupWindow);
    if (options.aiMode) configData.ai.mode = options.aiMode;
    if (options.aiApiKey) configData.ai.apiKey = options.aiApiKey;
    if (options.aiProvider) configData.ai.provider = options.aiProvider;
    if (options.aiModel) configData.ai.model = options.aiModel;

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
    // Process with PipelineIQ
    const result = await processFailureEvent(event, config, {
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
    return await fs.readJson(configPath);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      if (configPath !== "./pipelineiq.json") {
        console.log(chalk.yellow(`Configuration file ${configPath} not found, using defaults`));
      }
      return {
        jira: {
          baseUrl: process.env.JIRA_URL || "https://placeholder.atlassian.net",
          email: process.env.JIRA_EMAIL || "placeholder@example.com",
          apiToken: process.env.JIRA_TOKEN || "placeholder",
        },
        jiraProject: process.env.JIRA_PROJECT || "DEVOPS",
        ai: { mode: "disabled" },
        dedup: { enabled: true, windowHours: 24 },
      };
    }
    throw error;
  }
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
  const adoAgentName = process.env.AGENT_NAME;
  const adoAgentMachineName = process.env.AGENT_MACHINENAME;
  
  // Azure DevOps built-in variables
  const adoRepo = process.env.BUILD_REPOSITORY_NAME || options.repository;
  const adoSourceBranch = process.env.BUILD_SOURCEBRANCH || options.branch;
  const adoSourceVersion = process.env.BUILD_SOURCEVERSION || options.commit;
  const adoBuildId = process.env.BUILD_BUILDID || options.runId;
  const adoBuildNumber = process.env.BUILD_BUILDNUMBER || options.runId;
  const adoPipeline = process.env.BUILD_DEFINITIONNAME || options.pipeline;
  const adoDefinitionVersion = process.env.BUILD_DEFINITIONVERSION;
  const adoSourcesDirectory = process.env.BUILD_SOURCESDIRECTORY;
  const adoBinariesDirectory = process.env.BUILD_BINARIESDIRECTORY;
  const adoArtifactStagingDirectory = process.env.BUILD_ARTIFACTSTAGINGDIRECTORY || process.env.BUILD_STAGINGDIRECTORY;
  const adoContainerId = process.env.BUILD_CONTAINERID;
  const adoRepositoryLocalPath = process.env.BUILD_REPOSITORY_LOCALPATH;
  const adoCollectionUri = process.env.SYSTEM_COLLECTIONURI;
  const adoTeamProject = process.env.SYSTEM_TEAMPROJECT;
  const adoRequestedFor = process.env.BUILD_REQUESTEDFOR;
  const adoRequestedForEmail = process.env.BUILD_REQUESTEDFOREMAIL;
  const adoRequestedForId = process.env.BUILD_REQUESTEDFORID;
  const adoSourceVersionMessage = process.env.BUILD_SOURCEVERSIONMESSAGE;
  const adoBuildReason = process.env.BUILD_REASON;
  const adoBuildUri = process.env.BUILD_BUILDURI;
  const adoRepositoryUri = process.env.BUILD_REPOSITORY_URI;
  const adoRepositoryId = process.env.BUILD_REPOSITORY_ID;
  const adoRepositoryProvider = process.env.BUILD_REPOSITORY_PROVIDER;
  const adoSourceBranchName = process.env.BUILD_SOURCEBRANCHNAME;
  const adoQueuedBy = process.env.BUILD_QUEUEDBY;
  const adoQueuedById = process.env.BUILD_QUEUEDBYID;
  
  // Azure DevOps System variables
  const adoSystemCollectionId = process.env.SYSTEM_COLLECTIONID;
  const adoSystemDefinitionId = process.env.SYSTEM_DEFINITIONID;
  const adoSystemTeamProjectId = process.env.SYSTEM_TEAMPROJECTID;
  const adoSystemTimelineId = process.env.SYSTEM_TIMELINEID;
  
  // Azure DevOps Environment variables (deployment jobs)
  const adoEnvironmentName = process.env.ENVIRONMENT_NAME;
  const adoEnvironmentId = process.env.ENVIRONMENT_ID;
  const adoEnvironmentResourceName = process.env.ENVIRONMENT_RESOURCENAME;
  const adoEnvironmentResourceId = process.env.ENVIRONMENT_RESOURCEID;
  
  // Azure DevOps Pull Request variables
  const adoPrIsFork = process.env.SYSTEM_PULLREQUEST_ISFORK;
  const adoPrId = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
  const adoPrNumber = process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER;
  const adoPrTargetBranch = process.env.SYSTEM_PULLREQUEST_TARGETBRANCHNAME;
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
  const finalRunnerOs = runnerOs || adoAgentOs;
  const finalRunnerArch = runnerArch || adoAgentArch;
  const finalRunnerName = runnerName || adoAgentName;
  const finalAgentMachineName = adoAgentMachineName;
  
  // Use PR branch if available, otherwise use main branch
  const finalBranch = pullRequestBranch || branch;
  
  // Build proper URLs based on platform
  let runUrl = options.runUrl;
  if (!runUrl) {
    if (githubServerUrl && githubRepo && runId) {
      runUrl = `${githubServerUrl}/${githubRepo}/actions/runs/${runId}`;
    } else if (adoCollectionUri && adoTeamProject && adoBuildId) {
      // Build Azure DevOps Run URL: {collection}/{project}/_build/results?buildId={id}
      const cleanUri = adoCollectionUri.endsWith('/') ? adoCollectionUri.slice(0, -1) : adoCollectionUri;
      runUrl = `${cleanUri}/${adoTeamProject}/_build/results?buildId=${adoBuildId}`;
    } else if (adoCollectionUri && adoTeamProject && runId) {
      runUrl = `${adoCollectionUri}/${adoTeamProject}/_build/results?buildId=${runId}`;
    } else if (adoBuildUri) {
      runUrl = adoBuildUri;
    }
  }
  
  // Repository URL for Azure DevOps
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
        url: runUrl || "https://example.com/pipeline",
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
        url: runUrl || "https://example.com/pipeline",
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
