import { describe, it, expect } from "vitest";
import { parseJenkins } from "../parsers.js";
import { parseLogs } from "../index.js";
import { buildSmartExcerpt } from "../smart-excerpt.js";

describe("parseJenkins Log Parser", () => {
  it("parses Jenkins declarative pipeline failure with stages, commands, and exit code", () => {
    const rawLogs = `
Started by user Admin
Running in Durability level: MAX_SURVIVABILITY
[Pipeline] Start of Pipeline
[Pipeline] node
Running on agent-linux-01 in /home/jenkins/workspace/backend-pipeline
[Pipeline] {
[Pipeline] stage
[Pipeline] { (Declarative: Checkout SCM)
[Pipeline] checkout
Selected Git installation does not exist. Using default
Cloning the remote Git repository
[Pipeline] }
[Pipeline] stage
[Pipeline] { (Build & Test)
[Pipeline] sh
+ npm ci
added 450 packages in 4.2s
+ npm test
> test
> vitest run

FAIL src/auth.test.ts > login > invalid credentials rejected
AssertionError: expected 401 to be 403
    at src/auth.test.ts:42:15
[Pipeline] }
[Pipeline] // stage
ERROR: script returned exit code 1
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
Finished: FAILURE
`;

    const parsed = parseJenkins(rawLogs);

    expect(parsed.entries.length).toBeGreaterThan(0);
    expect(parsed.exitCodes).toContain(1);
    expect(parsed.errorMessages.some((msg) => msg.includes("AssertionError") || msg.includes("script returned exit code"))).toBe(true);

    const errorEntries = parsed.entries.filter((e) => e.level === "error");
    expect(errorEntries.length).toBeGreaterThan(0);
    expect(errorEntries.some((e) => e.message.includes("script returned exit code 1"))).toBe(true);
    expect(errorEntries.some((e) => e.message.includes("Finished: FAILURE"))).toBe(true);

    const buildTestEntries = parsed.entries.filter((e) => e.metadata?.stage === "Build & Test");
    expect(buildTestEntries.length).toBeGreaterThan(0);
  });

  it("extracts hudson.AbortException error messages and build step failures", () => {
    const rawLogs = `
[Pipeline] stage
[Pipeline] { (Deploy to Staging)
[Pipeline] sh
+ ./deploy.sh staging
Deploying version v1.2.3...
hudson.AbortException: Deployment failed: connection timed out to cluster staging-k8s
Build step 'Execute shell' marked build as failure
Finished: FAILURE
`;

    const parsed = parseJenkins(rawLogs);

    expect(parsed.errorMessages.some((m) => m.includes("hudson.AbortException"))).toBe(true);
    expect(parsed.errorMessages.some((m) => m.includes("marked build as failure"))).toBe(true);
    const abortEntry = parsed.entries.find((e) => e.message.includes("hudson.AbortException"));
    expect(abortEntry).toBeDefined();
    expect(abortEntry?.level).toBe("error");
  });

  it("cleans ANSI terminal escape codes and carriage returns", () => {
    const rawLogs = `
\x1b[32m[Pipeline] { (Compile)\x1b[0m\r
\x1b[31mERROR: Compile error in main.go:25\x1b[0m\r
ERROR: script returned exit code 2\r
Finished: FAILURE\r
`;

    const parsed = parseJenkins(rawLogs);

    expect(parsed.entries.some((e) => e.message.includes("[Pipeline] { (Compile)"))).toBe(true);
    expect(parsed.entries.some((e) => e.message.includes("Compile error in main.go:25"))).toBe(true);
    expect(parsed.entries.some((e) => e.message.includes("\x1b["))).toBe(false);
    expect(parsed.exitCodes).toContain(2);
  });

  it("integrates with top-level parseLogs using format jenkins", () => {
    const rawLogs = `
[Pipeline] { (Integration Tests)
+ pytest tests/test_api.py
FAILED tests/test_api.py::test_auth - ConnectionRefusedError
ERROR: script returned exit code 1
Finished: FAILURE
`;

    const result = parseLogs(rawLogs, { format: "jenkins" });
    expect(result.exitCodes).toContain(1);
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.errorMessages.length).toBeGreaterThan(0);
  });

  it("builds stage-aware smart excerpt using buildSmartExcerpt for jenkins source", () => {
    const rawLogs = `
[Pipeline] { (Preparation)
+ echo "Setting up"
[Pipeline] }
[Pipeline] { (Test Suite)
+ npm test
FAIL src/api.test.ts
ERROR: script returned exit code 1
[Pipeline] }
[Pipeline] { (Post Actions)
+ echo "Cleaning up"
[Pipeline] }
Finished: FAILURE
`;

    const { text, failingStep, strategy } = buildSmartExcerpt(rawLogs, "jenkins", 10);
    expect(failingStep).toBe("Test Suite");
    expect(strategy).toBe("step-aware");
    expect(text).toContain("FAIL src/api.test.ts");
  });
});
