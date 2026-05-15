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
});

describe("parseSteps — non-structured source", () => {
  it("returns empty array for generic source", () => {
    const lines = ["some log line", "error: boom"];
    expect(parseSteps(lines, "generic")).toEqual([]);
  });
});
