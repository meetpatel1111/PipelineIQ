/**
 * Smart log excerpt — step-structure-aware log excerpt for Jira ticket descriptions.
 *
 * Strategy chain (highest to lowest fidelity):
 *   1. step-aware    — GitHub Actions (##[group]) or Azure DevOps (##[section]) markers found
 *   2. error-anchored — any log: find first ERROR/FATAL line + context window
 *   3. tail-fallback  — no errors found: last maxLines lines (original behaviour)
 */

export type StepStatus = "passed" | "failed" | "skipped";

export type StepInfo = {
  name: string;
  status: StepStatus;
  startLine: number;  // index of first content line (after the opening marker)
  endLine: number;    // index of last content line; for truncated final step: lines.length-1; for empty step: startLine-1
};

export type ExcerptStrategy = "step-aware" | "error-anchored" | "tail-fallback";

export type SmartExcerptResult = {
  text: string;
  strategy: ExcerptStrategy;
  failingStep?: string;
};

// Lines matching any of these patterns are error anchors
const ERROR_ANCHOR_PATTERNS: RegExp[] = [
  /^\s*##\[error\]/i,
  /exit\s+code\s+[1-9]\d*/i,
  /process\s+exited\s+with\s+code\s+[1-9]\d*/i,
  /\b(FAIL|FAILED|ERROR)\b/,
  /exception\s+in\s+thread/i,
  /traceback\s+\(most\s+recent\s+call\s+last\)/i,
  /thread\s+'.*'\s+panicked/i,
  /goroutine\s+\d+\s+\[running\]/i,
];

/**
 * Parse step boundaries from log lines.
 * Returns [] for sources without step markers (fallback handled by caller).
 */
export function parseSteps(lines: string[], source: string): StepInfo[] {
  if (source === "github") return parseGitHubSteps(lines);
  if (source === "azure-devops") return parseAzureSteps(lines);
  return [];
}

function parseGitHubSteps(lines: string[]): StepInfo[] {
  const steps: StepInfo[] = [];
  let current: { name: string; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const groupMatch = line.match(/^##\[group\](.+)/);
    const endGroup = line.startsWith("##[endgroup]");

    if (groupMatch) {
      current = { name: groupMatch[1]!.trim(), startLine: i + 1 };
    } else if (endGroup && current) {
      const contentLines = lines.slice(current.startLine, i);
      steps.push({
        name: current.name,
        status: hasError(contentLines) ? "failed" : "passed",
        startLine: current.startLine,
        endLine: i - 1,
      });
      current = null;
    }
  }

  // Log ended mid-step — mark as failed
  if (current) {
    steps.push({
      name: current.name,
      status: "failed",
      startLine: current.startLine,
      endLine: lines.length - 1,
    });
  }

  return markSkippedSteps(steps);
}

function parseAzureSteps(lines: string[]): StepInfo[] {
  const steps: StepInfo[] = [];
  let current: { name: string; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Strip optional timestamp prefix: "2026-01-01T00:00:00Z ##[section]..."
    const clean = line.replace(/^\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+\s+/, "");
    const startMatch = clean.match(/^##\[section\]Starting:\s*(.+)/);
    const endMatch = clean.match(/^##\[section\]Finishing:\s*(.+)/);

    if (startMatch) {
      current = { name: startMatch[1]!.trim(), startLine: i + 1 };
    } else if (endMatch && current) {
      const contentLines = lines.slice(current.startLine, i);
      steps.push({
        name: current.name,
        status: hasError(contentLines) ? "failed" : "passed",
        startLine: current.startLine,
        endLine: i - 1,
      });
      current = null;
    }
  }

  if (current) {
    steps.push({
      name: current.name,
      status: "failed",
      startLine: current.startLine,
      endLine: lines.length - 1,
    });
  }

  return markSkippedSteps(steps);
}

function hasError(lines: string[]): boolean {
  return lines.some(line => ERROR_ANCHOR_PATTERNS.some(p => p.test(line)));
}

function markSkippedSteps(steps: StepInfo[]): StepInfo[] {
  const failIdx = steps.findIndex(s => s.status === "failed");
  if (failIdx === -1) return steps;
  return steps.map((s, i) =>
    i > failIdx ? { ...s, status: "skipped" as StepStatus } : s,
  );
}
