import { describe, it, expect } from "vitest";
import { parseSteps } from "../smart-excerpt.js";
import type { StepInfo, StepStatus } from "../smart-excerpt.js";

describe("parseSteps — GitHub Actions", () => {
  it("detects group/endgroup markers with correct line ranges", () => {
    const lines = [
      "##[group]Set up job",
      "Setting up runner",
      "##[endgroup]",
      "##[group]Run tests",
      "PASS src/a.test.ts",
      "FAIL src/b.test.ts",
      "##[error]Tests failed",
    ];
    const steps = parseSteps(lines, "github");
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ name: "Set up job", status: "passed", startLine: 1, endLine: 1 });
    expect(steps[1]).toMatchObject({ name: "Run tests", status: "failed", startLine: 4, endLine: 6 });
  });

  it("marks the last open step as failed when log ends mid-step", () => {
    const lines = [
      "##[group]Install deps",
      "npm install",
      // no ##[endgroup] — log ended mid-step
    ];
    const steps = parseSteps(lines, "github");
    expect(steps[0]).toMatchObject({ name: "Install deps", status: "failed", endLine: 1 });
  });

  it("marks steps after the failed step as skipped", () => {
    const lines = [
      "##[group]Lint",
      "ok",
      "##[endgroup]",
      "##[group]Test",
      "##[error]failed",
      "##[endgroup]",
      "##[group]Deploy",
      "skipped",
      "##[endgroup]",
    ];
    const steps = parseSteps(lines, "github");
    expect(steps[0]!.status).toBe("passed");
    expect(steps[1]!.status).toBe("failed");
    expect(steps[2]!.status).toBe("skipped");
  });

  it("handles empty step (no content between markers)", () => {
    const lines = [
      "##[group]Cache",
      "##[endgroup]",
      "##[group]Build",
      "npm run build",
      "##[endgroup]",
    ];
    const steps = parseSteps(lines, "github");
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ name: "Cache", status: "passed" });
    expect(steps[0]!.endLine).toBeLessThan(steps[0]!.startLine); // empty: endLine < startLine
    expect(steps[1]).toMatchObject({ name: "Build", status: "passed" });
  });
});

describe("parseSteps — Azure DevOps", () => {
  it("detects section Starting/Finishing markers", () => {
    const lines = [
      "2026-01-01T00:00:00Z ##[section]Starting: Checkout",
      "Checking out repo",
      "2026-01-01T00:00:01Z ##[section]Finishing: Checkout",
      "2026-01-01T00:00:02Z ##[section]Starting: Run tests",
      "##[error]Tests failed",
    ];
    const steps = parseSteps(lines, "azure-devops");
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ name: "Checkout", status: "passed" });
    expect(steps[1]).toMatchObject({ name: "Run tests", status: "failed" });
  });

  it("sets correct startLine and endLine indices for Azure steps", () => {
    const lines = [
      "##[section]Starting: Setup",   // 0
      "Setting up",                    // 1
      "##[section]Finishing: Setup",  // 2
      "##[section]Starting: Build",   // 3
      "##[error]build failed",        // 4
    ];
    const steps = parseSteps(lines, "azure-devops");
    expect(steps[0]).toMatchObject({ startLine: 1, endLine: 1 });
    expect(steps[1]).toMatchObject({ startLine: 4, endLine: 4 });
  });
});

describe("parseSteps — non-structured source", () => {
  it("returns empty array for generic source", () => {
    const lines = ["some log line", "error: boom"];
    expect(parseSteps(lines, "generic")).toEqual([]);
  });
});

import { findErrorAnchors, renderBreadcrumb } from "../smart-excerpt.js";

describe("findErrorAnchors", () => {
  it("finds ERROR keyword line (uppercase FAIL)", () => {
    const lines = ["Starting build", "FAIL src/core/foo.test.ts", "done"];
    expect(findErrorAnchors(lines)).toEqual([1]);
  });

  it("finds ##[error] annotation", () => {
    const lines = ["ok", "##[error]Tests failed"];
    expect(findErrorAnchors(lines)).toEqual([1]);
  });

  it("finds non-zero exit code", () => {
    const lines = ["running", "exit code 127", "done"];
    expect(findErrorAnchors(lines)).toEqual([1]);
  });

  it("returns all matching line indices", () => {
    const lines = ["ok", "FAIL suite A", "ok", "##[error]fatal: bad config"];
    const anchors = findErrorAnchors(lines);
    expect(anchors).toContain(1);
    expect(anchors).toContain(3);
  });

  it("returns empty array when no errors", () => {
    expect(findErrorAnchors(["all good", "✓ passed"])).toEqual([]);
  });
});

describe("renderBreadcrumb", () => {
  it("formats steps with correct icons and separators", () => {
    const steps: StepInfo[] = [
      { name: "Set up job", status: "passed", startLine: 0, endLine: 1 },
      { name: "Run tests", status: "failed", startLine: 2, endLine: 5 },
      { name: "Upload", status: "skipped", startLine: 6, endLine: 7 },
    ];
    const crumb = renderBreadcrumb(steps);
    expect(crumb).toBe("Steps: ✓ Set up job → ✗ Run tests → ○ Upload");
  });

  it("truncates long breadcrumb at 120 chars with ellipsis", () => {
    const steps: StepInfo[] = Array.from({ length: 10 }, (_, i) => ({
      name: `A very long step name number ${i}`,
      status: "passed" as StepStatus,
      startLine: i,
      endLine: i,
    }));
    const crumb = renderBreadcrumb(steps);
    expect(crumb.length).toBeLessThanOrEqual(121); // 120 chars + "…"
    expect(crumb.endsWith("…")).toBe(true);
  });

  it("returns just the prefix for empty step list", () => {
    expect(renderBreadcrumb([])).toBe("Steps: ");
  });
});

import { renderStepOutput, buildSmartExcerpt } from "../smart-excerpt.js";

describe("renderStepOutput", () => {
  it("returns full output when within budget", () => {
    const lines = ["line 0", "line 1", "line 2"];
    const step: StepInfo = { name: "Test", status: "failed", startLine: 0, endLine: 2 };
    const result = renderStepOutput(lines, step, 10);
    expect(result).toContain("line 0");
    expect(result).toContain("line 2");
    expect(result).not.toContain("trimmed");
  });

  it("trims from top with notice when over budget", () => {
    const allLines = Array.from({ length: 20 }, (_, i) => `line ${i}`);
    const step: StepInfo = { name: "Test", status: "failed", startLine: 0, endLine: 19 };
    const result = renderStepOutput(allLines, step, 5);
    expect(result).toContain("trimmed");
    expect(result).toContain("line 19");
    expect(result).not.toContain("line 0");
  });

  it("highlights error anchor lines with ▶ prefix", () => {
    const lines = ["Setting up", "##[error]bad config", "done"];
    const step: StepInfo = { name: "Setup", status: "failed", startLine: 0, endLine: 2 };
    const result = renderStepOutput(lines, step, 10);
    expect(result).toContain("▶ ##[error]bad config");
    expect(result).not.toMatch(/▶ Setting up/);
    expect(result).not.toMatch(/▶ done/);
  });

  it("returns empty step notice for step with no content lines", () => {
    const lines = ["##[group]Cache", "##[endgroup]"];
    const step: StepInfo = { name: "Cache", status: "passed", startLine: 1, endLine: 0 };
    const result = renderStepOutput(lines, step, 10);
    expect(result).toContain("[Step produced no output]");
  });
});

describe("buildSmartExcerpt", () => {
  const ghLog = [
    "##[group]Set up job",
    "Runner ready",
    "##[endgroup]",
    "##[group]Run tests",
    "PASS src/a.test.ts",
    "FAIL src/b.test.ts",
    "##[error]Tests failed",
  ].join("\n");

  it("returns step-aware strategy for GitHub Actions log", () => {
    const result = buildSmartExcerpt(ghLog, "github", 150);
    expect(result.strategy).toBe("step-aware");
    expect(result.failingStep).toBe("Run tests");
    expect(result.text).toContain("✓ Set up job");
    expect(result.text).toContain("✗ Run tests");
    expect(result.text).toContain("▶");
  });

  const adoLog = [
    "##[section]Starting: Checkout",
    "Cloning repo",
    "##[section]Finishing: Checkout",
    "##[section]Starting: Build",
    "##[error]Build failed",
  ].join("\n");

  it("returns step-aware strategy for Azure DevOps log", () => {
    const result = buildSmartExcerpt(adoLog, "azure-devops", 150);
    expect(result.strategy).toBe("step-aware");
    expect(result.failingStep).toBe("Build");
  });

  it("returns error-anchored strategy for generic log with errors", () => {
    const log = Array.from({ length: 100 }, (_, i) =>
      i === 40 ? "##[error]something broke" : `line ${i}`,
    ).join("\n");
    const result = buildSmartExcerpt(log, "generic", 150);
    expect(result.strategy).toBe("error-anchored");
    expect(result.text).toContain("##[error]something broke");
  });

  it("returns tail-fallback strategy when no errors found", () => {
    const log = "all good\neverything passed\n✓ done";
    const result = buildSmartExcerpt(log, "generic", 150);
    expect(result.strategy).toBe("tail-fallback");
    expect(result.text).toContain("✓ done");
  });

  it("never exceeds maxLines in output (rough check)", () => {
    const log = Array.from({ length: 500 }, (_, i) => `line ${i}`).join("\n");
    const result = buildSmartExcerpt(log, "generic", 50);
    const lineCount = result.text.split("\n").length;
    // Allow a few extra lines for breadcrumb and trim notice overhead
    expect(lineCount).toBeLessThanOrEqual(60);
  });

  it("clamps maxLines to minimum 20", () => {
    const log = Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n");
    const result = buildSmartExcerpt(log, "generic", 5);
    expect(result.text.split("\n").length).toBeGreaterThanOrEqual(1);
    // Should not crash
    expect(result.strategy).toBeDefined();
  });

  it("returns empty text for empty log", () => {
    const result = buildSmartExcerpt("", "generic", 150);
    expect(result.text).toBe("");
    expect(result.strategy).toBe("tail-fallback");
  });
});
