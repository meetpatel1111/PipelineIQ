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
