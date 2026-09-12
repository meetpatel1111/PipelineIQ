import { describe, it, expect } from "vitest";
import { parseGitLab } from "../parsers.js";

describe("parseGitLab", () => {
  it("parses GitLab CI logs and strips section markers and ANSI escapes", () => {
    const raw = [
      "\x1b[0Ksection_start:1690000000:prepare_executor\r\x1b[0KPreparing the \"docker\" executor",
      "Using Docker executor with image node:20-alpine ...",
      "\x1b[0Ksection_end:1690000005:prepare_executor\r\x1b[0K",
      "\x1b[0Ksection_start:1690000006:step_script\r\x1b[0K$ npm test",
      "> pipelineiq@0.24.0 test",
      "> vitest run",
      "\x1b[31;1mFAIL\x1b[0m src/core/auth.test.ts",
      "  ✕ should authenticate with valid credentials",
      "    AssertionError: expected false to be true",
      "\x1b[31;1mERROR: Job failed: exit code 1\x1b[0m",
      "\x1b[0Ksection_end:1690000020:step_script\r\x1b[0K",
    ].join("\n");

    const result = parseGitLab(raw);

    expect(result.exitCodes).toContain(1);
    expect(result.errorMessages.length).toBeGreaterThan(0);
    expect(result.errorMessages.some(m => m.includes("exit code 1") || m.includes("FAIL"))).toBe(true);

    const errorEntries = result.entries.filter(e => e.level === "error");
    expect(errorEntries.length).toBeGreaterThan(0);

    // Ensure raw section marker tokens are not cluttering entry messages
    expect(result.entries.every(e => !e.message.includes("section_start:") && !e.message.includes("section_end:"))).toBe(true);
  });

  it("handles clean logs without section markers or ANSI codes", () => {
    const raw = [
      "Running on runner-abc-123...",
      "Cloning repository...",
      "Checking out 9a8b7c6d as main...",
      "npm test failed with exit code 2",
    ].join("\n");

    const result = parseGitLab(raw);

    expect(result.exitCodes).toContain(2);
    expect(result.entries).toHaveLength(4);
  });
});
