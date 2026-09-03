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
    // Strip optional timestamp prefix: "2026-01-01T00:00:00.123Z ##[group]..."
    const clean = line.replace(/^\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+\s+/, "");
    const groupMatch = clean.match(/^##\[group\](.+)/);
    const endGroup = clean.startsWith("##[endgroup]");

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
  return steps.map((s, i) => {
    // If a subsequent step also encountered errors (e.g. continue-on-error), preserve its failed status
    if (s.status === "failed") return s;
    return i > failIdx ? { ...s, status: "skipped" as StepStatus } : s;
  });
}

/**
 * Return indices of all lines that match an error anchor pattern.
 */
export function findErrorAnchors(lines: string[]): number[] {
  return lines.reduce<number[]>((acc, line, i) => {
    if (ERROR_ANCHOR_PATTERNS.some(p => p.test(line))) acc.push(i);
    return acc;
  }, []);
}

/**
 * Render a compact one-line breadcrumb from the step list.
 * Truncated at 120 chars with "…" if needed.
 */
export function renderBreadcrumb(steps: StepInfo[]): string {
  const icon = (s: StepStatus): string =>
    s === "passed" ? "✓" : s === "failed" ? "✗" : "○";
  const parts = steps.map(s => `${icon(s.status)} ${s.name}`);
  const joined = parts.join(" → ");
  const full = "Steps: " + joined;
  if (full.length <= 120) return full;
  return full.slice(0, 120) + "…";
}

/**
 * Render the output of a single step within the line budget.
 * Trims from the top when over budget. Highlights error anchors with ▶.
 * Returns "[Step produced no output]" for empty steps.
 */
export function renderStepOutput(
  allLines: string[],
  step: StepInfo,
  budget: number,
): string {
  const endLine = step.endLine === -1 ? allLines.length - 1 : step.endLine;

  // Empty step: startLine > endLine (e.g., immediate ##[endgroup])
  if (step.startLine > endLine) {
    return "[Step produced no output]";
  }

  let stepLines = allLines.slice(step.startLine, endLine + 1);

  let trimNotice = "";
  if (stepLines.length > budget) {
    const trimmed = stepLines.length - budget;
    stepLines = stepLines.slice(-budget);
    trimNotice = `[... ${trimmed} lines trimmed from top of step output ...]\n`;
  }

  const highlighted = stepLines.map(line =>
    ERROR_ANCHOR_PATTERNS.some(p => p.test(line)) ? `▶ ${line}` : line,
  );

  return trimNotice + highlighted.join("\n");
}

/**
 * Build a smart log excerpt. Called by the renderer instead of tailLines().
 *
 * Strategy chain:
 *   1. step-aware     — GitHub Actions or Azure DevOps markers detected
 *   2. error-anchored — generic log with detectable error lines
 *   3. tail-fallback  — last maxLines lines (original behaviour)
 */
export function buildSmartExcerpt(
  log: string,
  source: string,
  maxLines: number,
): SmartExcerptResult {
  if (!log) return { text: "", strategy: "tail-fallback" };

  const clampedMax = Math.max(maxLines, 20);
  const lines = log.split("\n");

  // ── Strategy 1: step-aware ────────────────────────────────────────────────
  const steps = parseSteps(lines, source);
  if (steps.length > 0) {
    const failingSteps = steps.filter(s => s.status === "failed");
    const breadcrumb = renderBreadcrumb(steps);

    if (failingSteps.length > 0) {
      const stepBudget = Math.max(Math.floor((clampedMax * 0.75) / failingSteps.length), 20);
      const stepOutputs = failingSteps.map(s => {
        const out = renderStepOutput(lines, s, stepBudget);
        return failingSteps.length > 1 ? `### Failing Step: ${s.name}\n${out}` : out;
      }).join("\n\n");
      const text = `${breadcrumb}\n\n${stepOutputs}`;
      return { text, strategy: "step-aware", failingStep: failingSteps.map(s => s.name).join(", ") };
    }

    // Steps parsed but none failed (all passed) — fall through to anchors
  }

  // ── Strategy 2: error-anchored ────────────────────────────────────────────
  const anchors = findErrorAnchors(lines);
  if (anchors.length > 0) {
    const BEFORE = 40;
    const AFTER = 20;
    const first = anchors[0]!;
    const start = Math.max(0, first - BEFORE);
    const end = Math.min(lines.length - 1, first + AFTER);
    const contextLines = lines.slice(start, end + 1);

    const highlighted = contextLines.map(line =>
      ERROR_ANCHOR_PATTERNS.some(p => p.test(line)) ? `▶ ${line}` : line,
    );

    const prefix = start > 0 ? `[... ${start} lines above omitted ...]\n` : "";
    return {
      text: prefix + highlighted.join("\n"),
      strategy: "error-anchored",
    };
  }

  // ── Strategy 3: tail fallback ─────────────────────────────────────────────
  const tail = lines.length <= clampedMax
    ? log
    : lines.slice(-clampedMax).join("\n");

  return { text: tail, strategy: "tail-fallback" };
}
