import { ParseOptionsSchema } from "./types.js";
import type { LogEntry, ParsedLog, ParseOptions, LogFormat } from "./types.js";
import {
  extractErrorMessages,
  extractStackTraces,
  extractExitCodes,
  extractFailedCommands,
} from "./extractors.js";

/**
 * Main log parsing function that delegates to format-specific parsers
 */
export function parseLogs(rawLogs: string, options: Partial<ParseOptions> = {}): ParsedLog {
  const parsedOptions = ParseOptionsSchema.parse(options);
  const parser = getParser(parsedOptions.format);
  return parser(rawLogs, parsedOptions);
}

function getParser(format: LogFormat) {
  switch (format) {
    case "github-actions":
      return parseGitHubActions;
    case "azure-devops":
      return parseAzureDevOps;
    case "gitlab":
      return parseGitLab;
    case "bitbucket":
      return parseBitbucket;
    case "circleci":
      return parseCircleCI;
    case "jenkins":
      return parseJenkins;
    case "terraform":
      return parseTerraform;
    case "kubernetes":
      return parseKubernetes;
    case "docker":
      return parseDocker;
    case "junit":
      return parseJUnit;
    default:
      return parseGeneric;
  }
}

/**
 * GitHub Actions log parser
 * Handles structured output with step markers and timestamps
 */
function parseGitHubActions(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    // GitHub Actions format: ##[group]Action name##[endgroup]
    const stepMatch = line.match(/^##\[group\](.+?)##\[endgroup\]/);
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
    
    let level: LogEntry["level"] = "info";
    if (line.includes("error") || line.includes("Error")) level = "error";
    else if (line.includes("warning") || line.includes("Warning")) level = "warn";
    else if (line.includes("debug")) level = "debug";

    const entry: LogEntry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "github-actions",
    };

    entries.push(entry);

    // Mark as relevant if contains error keywords
    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * Azure DevOps log parser
 * Handles task output with timestamps and structured logging
 */
function parseAzureDevOps(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    // Azure DevOps format: 2024-01-01T12:00:00.1234567Z ##[section]Starting: Task name
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z)/);
    const sectionMatch = line.match(/##\[(\w+)\](.+)/);
    
    let level: LogEntry["level"] = "info";
    if (line.includes("error") || line.includes("Error")) level = "error";
    else if (line.includes("warning") || line.includes("Warning")) level = "warn";
    else if (line.includes("debug")) level = "debug";

    const entry: LogEntry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "azure-devops",
      metadata: sectionMatch ? { section: sectionMatch[1], task: sectionMatch[2] } : undefined,
    };

    entries.push(entry);

    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * GitLab CI log parser
 * Handles GitLab runner step section markers, commands, and error output
 */
export function parseGitLab(rawLogs: string, options: Partial<ParseOptions> = {}): ParsedLog {
  const parsedOptions = ParseOptionsSchema.parse({ ...options, format: "gitlab" });
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const rawLine of lines) {
    // Strip carriage returns and GitLab ANSI escape sequences
    let line = rawLine
      .replace(/\r\x1b\[0K/g, "")
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
      .trimEnd();

    // Detect GitLab section markers: section_start:1644342200:step_name[collapsed=true]
    const sectionStartMatch = line.match(/section_start:(\d+):([a-zA-Z0-9_\-]+)(?:\[(.*)\])?/);
    const sectionEndMatch = line.match(/section_end:(\d+):([a-zA-Z0-9_\-]+)/);

    let timestamp: string | undefined;
    if (sectionStartMatch?.[1]) {
      const epochSeconds = parseInt(sectionStartMatch[1], 10);
      if (!isNaN(epochSeconds)) {
        timestamp = new Date(epochSeconds * 1000).toISOString();
      }
      line = line.replace(/section_start:\d+:[a-zA-Z0-9_\-]+(?:\[.*?\])?/, "").trim();
    } else if (sectionEndMatch?.[1]) {
      const epochSeconds = parseInt(sectionEndMatch[1], 10);
      if (!isNaN(epochSeconds)) {
        timestamp = new Date(epochSeconds * 1000).toISOString();
      }
      line = line.replace(/section_end:\d+:[a-zA-Z0-9_\-]+/, "").trim();
    } else {
      const isoMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
      if (isoMatch) {
        timestamp = isoMatch[1];
      }
    }

    if (!line) continue;

    let level: LogEntry["level"] = "info";
    const lower = line.toLowerCase();
    if (lower.includes("error:") || lower.includes("fail") || lower.includes("fatal:") || lower.includes("job failed")) {
      level = "error";
    } else if (lower.includes("warning:") || lower.includes("warn:")) {
      level = "warn";
    } else if (lower.includes("debug:")) {
      level = "debug";
    }

    const metadata: Record<string, any> = {};
    if (sectionStartMatch) {
      metadata.section = sectionStartMatch[2];
      metadata.sectionAction = "start";
    } else if (sectionEndMatch) {
      metadata.section = sectionEndMatch[2];
      metadata.sectionAction = "end";
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message: line,
      source: "gitlab",
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    entries.push(entry);

    if (isRelevantEntry(line, parsedOptions.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options: parsedOptions,
    rawLogs,
  });
}

/**
 * Bitbucket Pipelines log parser
 * Handles Bitbucket runner shell step executions (+ <cmd>), exit codes, and test diagnostics
 */
export function parseBitbucket(rawLogs: string, options: Partial<ParseOptions> = {}): ParsedLog {
  const parsedOptions = ParseOptionsSchema.parse({ ...options, format: "bitbucket" });
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const rawLine of lines) {
    // Strip terminal ANSI escape sequences and carriage returns
    const line = rawLine
      .replace(/\r/g, "")
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
      .trimEnd();

    if (!line) continue;

    // Detect timestamps if present (ISO format)
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
    const timestamp = timestampMatch?.[1];

    let level: LogEntry["level"] = "info";
    const lower = line.toLowerCase();
    if (lower.includes("error:") || lower.includes("fail") || lower.includes("fatal:") || lower.includes("exit code") || lower.includes("assertionerror")) {
      level = "error";
    } else if (lower.includes("warning:") || lower.includes("warn:")) {
      level = "warn";
    } else if (lower.includes("debug:")) {
      level = "debug";
    }

    const metadata: Record<string, any> = {};
    if (line.startsWith("+ ")) {
      metadata.command = line.substring(2).trim();
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message: line,
      source: "bitbucket",
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    entries.push(entry);

    if (isRelevantEntry(line, parsedOptions.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options: parsedOptions,
    rawLogs,
  });
}

/**
 * CircleCI log parser
 * Handles CircleCI bash step executions, exit code notices (e.g. "Exited with code exit status 1"),
 * timeout errors, ANSI color sequences, and test suite failure diagnostics.
 */
export function parseCircleCI(rawLogs: string, options: Partial<ParseOptions> = {}): ParsedLog {
  const parsedOptions = ParseOptionsSchema.parse({ ...options, format: "circleci" });
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];
  let pendingInterpreter = false;

  for (const rawLine of lines) {
    // Strip terminal ANSI escape sequences and carriage returns
    const line = rawLine
      .replace(/\r/g, "")
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
      .trimEnd();

    if (!line) continue;

    // Detect timestamps if present (e.g. ISO format or CircleCI timestamp)
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/);
    const timestamp = timestampMatch?.[1];

    let level: LogEntry["level"] = "info";
    const lower = line.toLowerCase();
    if (
      lower.includes("error:") ||
      lower.includes("fail") ||
      lower.includes("fatal:") ||
      lower.includes("exited with code") ||
      lower.includes("exit status") ||
      lower.includes("too long with no output") ||
      lower.includes("context deadline exceeded") ||
      lower.includes("oomkilled") ||
      lower.includes("assertionerror")
    ) {
      level = "error";
    } else if (lower.includes("warning:") || lower.includes("warn:")) {
      level = "warn";
    } else if (lower.includes("debug:")) {
      level = "debug";
    }

    const metadata: Record<string, any> = {};
    if (line.startsWith("#!/bin/bash") || line.startsWith("#!/bin/sh")) {
      metadata.stepInterpreter = line.trim();
      pendingInterpreter = true;
    } else if (line.startsWith("==> Command: ")) {
      metadata.command = line.substring("==> Command: ".length).trim();
    } else if (line.startsWith("==> Step: ")) {
      metadata.step = line.substring("==> Step: ".length).trim();
    } else if (line.startsWith("+ ")) {
      metadata.command = line.substring(2).trim();
    } else if (pendingInterpreter) {
      metadata.command = line.trim();
      pendingInterpreter = false;
    } else if (line.match(/^Exited with code (?:exit status )?(\d+)/i)) {
      const match = line.match(/^Exited with code (?:exit status )?(\d+)/i);
      if (match?.[1]) {
        metadata.exitCode = parseInt(match[1], 10);
      }
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message: line,
      source: "circleci",
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    entries.push(entry);

    if (isRelevantEntry(line, parsedOptions.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options: parsedOptions,
    rawLogs,
  });
}

/**
 * Jenkins log parser
 * Handles Jenkins Declarative and Scripted Pipeline logs, stage blocks ([Pipeline] { (StageName)),
 * shell execution steps ([Pipeline] sh, + <cmd>), AbortException, exit codes (e.g. "ERROR: script returned exit code 1"),
 * and build completion status ("Finished: FAILURE").
 */
export function parseJenkins(rawLogs: string, options: Partial<ParseOptions> = {}): ParsedLog {
  const parsedOptions = ParseOptionsSchema.parse({ ...options, format: "jenkins" });
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];
  let currentStage: string | undefined;

  for (const rawLine of lines) {
    // Strip terminal ANSI escape sequences and carriage returns
    const line = rawLine
      .replace(/\r/g, "")
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
      .trimEnd();

    if (!line) continue;

    // Detect timestamps if present (e.g., Timestamper plugin formats: ISO, "[14:20:05]", or "2026-09-13 14:20:05")
    const timestampMatch = line.match(/^(?:\[)?(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?|\d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\])?/);
    const timestamp = timestampMatch?.[1];

    let level: LogEntry["level"] = "info";
    const lower = line.toLowerCase();
    if (
      lower.includes("error:") ||
      lower.includes("fail") ||
      lower.includes("fatal:") ||
      lower.includes("hudson.abortexception") ||
      lower.includes("script returned exit code") ||
      lower.includes("marked build as failure") ||
      lower.includes("finished: failure") ||
      lower.includes("finished: aborted") ||
      lower.includes("assertionerror")
    ) {
      level = "error";
    } else if (lower.includes("warning:") || lower.includes("warn:") || lower.includes("finished: unstable")) {
      level = "warn";
    } else if (lower.includes("debug:")) {
      level = "debug";
    }

    const metadata: Record<string, any> = {};

    // Track Pipeline stages: [Pipeline] { (Build & Test)
    const stageMatch = line.match(/\[Pipeline\]\s*\{\s*\(([^)]+)\)/i);
    if (stageMatch?.[1]) {
      currentStage = stageMatch[1].trim();
      metadata.stage = currentStage;
    } else if (currentStage) {
      metadata.stage = currentStage;
    }

    // Step type detection: [Pipeline] sh, [Pipeline] bat, [Pipeline] junit, etc.
    const stepMatch = line.match(/\[Pipeline\]\s*([a-zA-Z0-9_-]+)/);
    if (stepMatch?.[1] && stepMatch[1] !== "stage" && stepMatch[1] !== "{") {
      metadata.step = stepMatch[1];
    }

    // Shell command execution: + npm test
    if (line.startsWith("+ ")) {
      metadata.command = line.substring(2).trim();
    }

    // Exit code parsing: ERROR: script returned exit code 1
    const exitCodeMatch = line.match(/(?:ERROR:\s*)?script returned exit code\s*(\d+)/i);
    if (exitCodeMatch?.[1]) {
      metadata.exitCode = parseInt(exitCodeMatch[1], 10);
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message: line,
      source: "jenkins",
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    entries.push(entry);

    if (isRelevantEntry(line, parsedOptions.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options: parsedOptions,
    rawLogs,
  });
}

/**
 * Terraform log parser
 * Handles Terraform state and plan outputs
 */
function parseTerraform(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    // Terraform format: timestamp [color] level: message
    const terraformMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}[+-]\d{4})\s+\[([a-z]+)\]\s+(.+)$/);
    
    let level: LogEntry["level"] = "info";
    let message = line;
    let timestamp: string | undefined;

    if (terraformMatch) {
      timestamp = terraformMatch[1]!;
      const colorLevel = terraformMatch[2]!;
      message = terraformMatch[3]!;
      
      switch (colorLevel) {
        case "red": level = "error"; break;
        case "yellow": level = "warn"; break;
        case "cyan": level = "debug"; break;
        default: level = "info"; break;
      }
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      source: "terraform",
    };

    entries.push(entry);

    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * Kubernetes log parser
 * Handles container logs and kubectl output
 */
function parseKubernetes(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    // Kubernetes format: timestamp stream pod namespace message
    const k8sMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)\s+([FS])\s+(\S+)\s+(\S+)\s+(.+)$/);
    
    let level: LogEntry["level"] = "info";
    let message = line;
    let timestamp: string | undefined;

    if (k8sMatch) {
      timestamp = k8sMatch[1]!;
      const stream = k8sMatch[2]!;
      const pod = k8sMatch[3]!;
      const namespace = k8sMatch[4]!;
      const logMessage = k8sMatch[5]!;
      
      message = logMessage;
      
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";

      const entry: LogEntry = {
        timestamp,
        level,
        message,
        source: "kubernetes",
        metadata: { stream, pod, namespace },
      };

      entries.push(entry);

      if (isRelevantEntry(logMessage, options.relevantKeywords)) {
        relevantEntries.push(entry);
      }
    } else {
      // Fallback for unstructured logs
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";

      const entry: LogEntry = {
        level,
        message: line,
        source: "kubernetes",
      };

      entries.push(entry);

      if (isRelevantEntry(line, options.relevantKeywords)) {
        relevantEntries.push(entry);
      }
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * Docker log parser
 * Handles Docker build and container logs
 */
function parseDocker(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    // Docker format: timestamp level message
    const dockerMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z)\s+(\w+)\s+(.+)$/);
    
    let level: LogEntry["level"] = "info";
    let message = line;
    let timestamp: string | undefined;

    if (dockerMatch) {
      timestamp = dockerMatch[1]!;
      const logLevel = dockerMatch[2]!.toLowerCase();
      message = dockerMatch[3]!;
      
      switch (logLevel) {
        case "error": level = "error"; break;
        case "warn": level = "warn"; break;
        case "debug": level = "debug"; break;
        default: level = "info"; break;
      }
    } else {
      // Fallback for unstructured Docker logs
      if (line.includes("error") || line.includes("Error")) level = "error";
      else if (line.includes("warning") || line.includes("Warning")) level = "warn";
      else if (line.includes("debug")) level = "debug";
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      source: "docker",
    };

    entries.push(entry);

    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * JUnit XML parser
 * Handles test result XML
 */
function parseJUnit(rawLogs: string, options: ParseOptions): ParsedLog {
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  // Simple XML parsing for test failures
  const failureMatches = rawLogs.match(/<failure[^>]*message="([^"]*)"[^>]*>(.*?)<\/failure>/gs) || [];
  
  for (const failure of failureMatches) {
    const messageMatch = failure.match(/message="([^"]*)"/);
    const contentMatch = failure.match(/>(.*?)<\/failure>/);
    
    if (messageMatch) {
      const entry: LogEntry = {
        level: "error",
        message: `Test failure: ${messageMatch[1]}`,
        source: "junit",
        metadata: {
          failureMessage: messageMatch[1],
          failureContent: contentMatch?.[1],
        },
      };

      entries.push(entry);
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * Generic log parser
 * Fallback parser for unstructured logs
 */
function parseGeneric(rawLogs: string, options: ParseOptions): ParsedLog {
  const lines = rawLogs.split("\n");
  const entries: LogEntry[] = [];
  const relevantEntries: LogEntry[] = [];

  for (const line of lines) {
    let level: LogEntry["level"] = "info";
    
    // Try to extract timestamp
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
    
    // Determine log level
    if (line.includes("error") || line.includes("Error") || line.includes("ERROR")) level = "error";
    else if (line.includes("warning") || line.includes("Warning") || line.includes("WARN")) level = "warn";
    else if (line.includes("debug") || line.includes("Debug") || line.includes("DEBUG")) level = "debug";
    else if (line.includes("fatal") || line.includes("Fatal") || line.includes("FATAL")) level = "fatal";

    const entry: LogEntry = {
      timestamp: timestampMatch?.[1],
      level,
      message: line,
      source: "generic",
    };

    entries.push(entry);

    if (isRelevantEntry(line, options.relevantKeywords)) {
      relevantEntries.push(entry);
    }
  }

  return extractStructuredData({
    entries,
    relevantEntries,
    options,
    rawLogs,
  });
}

/**
 * Helper function to check if an entry is relevant based on keywords
 */
function isRelevantEntry(message: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

/**
 * Extract structured data from parsed entries
 */
function extractStructuredData({
  entries,
  relevantEntries,
  options,
  rawLogs,
}: {
  entries: LogEntry[];
  relevantEntries: LogEntry[];
  options: ParseOptions;
  rawLogs: string;
}): ParsedLog {
  const errorMessages: string[] = [];
  const stackTraces: string[] = [];
  const exitCodes: number[] = [];
  const failedCommands: string[] = [];

  if (options.extractErrorMessages) {
    errorMessages.push(...extractErrorMessages(rawLogs));
  }

  if (options.extractStackTraces) {
    stackTraces.push(...extractStackTraces(rawLogs));
  }

  if (options.extractExitCodes) {
    exitCodes.push(...extractExitCodes(rawLogs));
  }

  if (options.extractCommands) {
    failedCommands.push(...extractFailedCommands(rawLogs));
  }

  // Limit entries if specified
  const limitedEntries = options.maxEntries > 0 
    ? entries.slice(0, options.maxEntries)
    : entries;

  return {
    entries: limitedEntries,
    errorMessages,
    stackTraces,
    exitCodes,
    failedCommands,
    relevantEntries,
    truncated: entries.length > options.maxEntries,
  };
}
