import { describe, it, expect } from "vitest";
import { parseCircleCI, parseLogs } from "../index.js";

describe("parseCircleCI", () => {
  it("parses CircleCI runner logs, strips ANSI escapes and extracts step commands", () => {
    const raw = [
      "#!/bin/bash -eo pipefail",
      "npm ci",
      "added 350 packages in 2.5s",
      "==> Step: Running test suite",
      "#!/bin/bash -eo pipefail",
      "npm test",
      "\x1b[31;1mFAIL\x1b[0m src/core/auth.test.ts",
      "  ✕ should authenticate with CircleCI API token",
      "    AssertionError: expected 401 to be 200",
      "\x1b[31;1mExited with code exit status 1\x1b[0m",
      "CircleCI received exit code 1",
    ].join("\n");

    const result = parseCircleCI(raw);

    expect(result.exitCodes).toContain(1);
    expect(result.errorMessages.length).toBeGreaterThan(0);
    expect(result.errorMessages.some(m => m.includes("exit status 1") || m.includes("FAIL"))).toBe(true);

    const commandEntries = result.entries.filter(e => e.metadata?.command);
    expect(commandEntries.length).toBeGreaterThan(0);

    const errorEntries = result.entries.filter(e => e.level === "error");
    expect(errorEntries.length).toBeGreaterThan(0);
  });

  it("detects CircleCI task timeouts and context deadline exceeded", () => {
    const raw = [
      "#!/bin/bash -eo pipefail",
      "pytest tests/",
      "Too long with no output (exceeded 10m0s): context deadline exceeded",
    ].join("\n");

    const result = parseCircleCI(raw);

    expect(result.exitCodes).toContain(124);
    expect(result.errorMessages.some(m => m.includes("context deadline exceeded") || m.includes("exceeded 10m0s"))).toBe(true);
  });

  it("works with parseLogs dispatcher with format: 'circleci'", () => {
    const raw = [
      "==> Command: docker build -t my-circle-app .",
      "Sending build context to Docker daemon  2.048kB",
      "\x1b[31mError response from daemon: dockerfile parse error\x1b[0m",
      "Exited with code exit status 2",
    ].join("\n");

    const result = parseLogs(raw, { format: "circleci" });

    expect(result.entries[0]?.source).toBe("circleci");
    expect(result.exitCodes).toContain(2);
    expect(result.errorMessages.length).toBeGreaterThan(0);
  });
});
