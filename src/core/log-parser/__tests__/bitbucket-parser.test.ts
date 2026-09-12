import { describe, it, expect } from "vitest";
import { parseBitbucket, parseLogs } from "../index.js";

describe("parseBitbucket", () => {
  it("parses Bitbucket runner logs, strips ANSI escapes and extracts step commands", () => {
    const raw = [
      "+ npm ci",
      "added 450 packages in 3s",
      "+ npm test",
      "> pipelineiq@0.26.0 test",
      "> vitest run",
      "\x1b[31;1mFAIL\x1b[0m src/core/auth.test.ts",
      "  ✕ should authenticate with Jira Cloud PAT",
      "    AssertionError: expected 401 to be 200",
      "\x1b[31;1mError: Command failed with exit code 1\x1b[0m",
    ].join("\n");

    const result = parseBitbucket(raw);

    expect(result.exitCodes).toContain(1);
    expect(result.errorMessages.length).toBeGreaterThan(0);
    expect(result.errorMessages.some(m => m.includes("exit code 1") || m.includes("FAIL"))).toBe(true);

    const commandEntries = result.entries.filter(e => e.metadata?.command);
    expect(commandEntries).toHaveLength(2);
    expect(commandEntries[0]?.metadata?.command).toBe("npm ci");
    expect(commandEntries[1]?.metadata?.command).toBe("npm test");

    const errorEntries = result.entries.filter(e => e.level === "error");
    expect(errorEntries.length).toBeGreaterThan(0);
  });

  it("works with parseLogs dispatcher with format: 'bitbucket'", () => {
    const raw = [
      "+ docker build -t my-app .",
      "Step 1/5 : FROM node:20-alpine",
      "Step 2/5 : WORKDIR /app",
      "\x1b[31mERROR: failed to solve: failed to read dockerfile\x1b[0m",
      "exit code: 2",
    ].join("\n");

    const result = parseLogs(raw, { format: "bitbucket" });

    expect(result.entries[0]?.source).toBe("bitbucket");
    expect(result.exitCodes).toContain(2);
    expect(result.errorMessages.length).toBeGreaterThan(0);
  });
});
