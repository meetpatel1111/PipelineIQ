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
  JiraClient,
  PipelineIQConfigSchema
} from "@pipelineiq/core";
import type {
  FailureEvent,
  PipelineIQConfig,
  FailureSource,
  LogFormat,
} from "@pipelineiq/core";

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
  .action(async (options) => {
    await handleTest(options);
  });

async function handleAnalyze(options: any) {
  const spinner = ora("Analyzing failure...").start();

  try {
    // Load configuration
    const config = await loadConfig(options.config);
    
    // Read and parse logs
    const logContent = await readLogs(options.logs);
    const parsedLogs = parseLogs(logContent, {
      format: options.format as LogFormat,
      extractStackTraces: true,
      extractErrorMessages: true,
      extractExitCodes: true,
      extractCommands: true,
    });

    // Create failure event
    const event = await createFailureEvent(options.source as FailureSource, parsedLogs, options);
    
    // Process with PipelineIQ
    const result = await processFailureEvent(event, config, {
      extraEnrichers: config.ai.mode !== "disabled" ? [await createAIEnricher(config.ai)] : [],
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

    if (options.jira) {
      const spinner = ora("Testing Jira connectivity...").start();
      const jira = new JiraClient(config.jira);
      
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

async function loadConfig(configPath: string): Promise<PipelineIQConfig> {
  try {
    const configContent = await fs.readJson(configPath);
    return PipelineIQConfigSchema.parse(configContent);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      console.log(chalk.yellow(`Configuration file ${configPath} not found, using defaults`));
      return PipelineIQConfigSchema.parse({
        jira: {
          baseUrl: process.env.JIRA_URL || "",
          email: process.env.JIRA_EMAIL || "",
          apiToken: process.env.JIRA_TOKEN || "",
        },
        jiraProject: process.env.JIRA_PROJECT || "DEVOPS",
        ai: { mode: "disabled" },
        dedup: { enabled: true },
      });
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
  // Interactive prompts for missing information
  const questions = [
    {
      type: "input",
      name: "pipelineName",
      message: "Pipeline/workflow name:",
      default: "unknown-pipeline",
    },
    {
      type: "input",
      name: "repositoryName",
      message: "Repository name:",
      default: "unknown-repo",
    },
    {
      type: "input",
      name: "branch",
      message: "Branch:",
      default: "main",
    },
    {
      type: "input",
      name: "commitSha",
      message: "Commit SHA:",
      default: "unknown",
    },
    {
      type: "input",
      name: "environment",
      message: "Environment (optional):",
    },
  ];

  const answers = await inquirer.prompt(questions as any);

  return {
    source,
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
    pipeline: {
      name: answers.pipelineName,
      url: "https://example.com/pipeline", // Would be populated from context
      runId: "cli-run",
      runNumber: 1,
      step: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
    },
    repository: {
      owner: "cli-user",
      name: answers.repositoryName,
      url: "https://github.com/cli-user/unknown-repo",
      defaultBranch: "main",
    },
    commit: {
      sha: answers.commitSha,
      url: `https://github.com/cli-user/unknown-repo/commit/${answers.commitSha}`,
      message: "CLI analysis",
      author: "cli-user",
    },
    branch: answers.branch,
    environment: answers.environment,
    triggeredBy: "cli-user",
    failure: {
      exitCode: parsedLogs.exitCodes[0],
      errorMessage: parsedLogs.errorMessages[0],
      failedStep: parsedLogs.entries.find((e: any) => e.level === "error")?.message?.split(":")[0] || "unknown",
      logs: parsedLogs.entries.map((e: any) => `${e.timestamp || ""} [${e.level?.toUpperCase() || "INFO"}] ${e.message}`).join("\n"),
      logsTruncated: parsedLogs.truncated,
    },
  };
}

async function createAIEnricher(aiConfig: any) {
  return {
    name: "ai-enricher",
    source: "ai" as const,
    async enrich(ctx: any) {
      const aiEngine = AIEngine.create("assist" as any, aiConfig);
      const results = await aiEngine.enrich(ctx.event, aiConfig);
      
      for (const result of results) {
        ctx.fields[result.field] = result.value;
        ctx.provenance[result.field] = result.provenance;
      }
    },
  };
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
