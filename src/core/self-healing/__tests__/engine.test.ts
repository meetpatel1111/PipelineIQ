import { describe, it, expect, vi } from "vitest";
import { SelfHealingEngine } from "../engine.js";
import type { FailureEvent, CodeFix } from "../../types/index.js";

describe("SelfHealingEngine - Gatekeepers & Diagnostics", () => {
  const dummyEvent: FailureEvent = {
    source: "github",
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
    repository: { 
      owner: "test-owner", 
      name: "test-repo", 
      url: "https://github.com/test-owner/test-repo" 
    },
    branch: "main",
    commit: { 
      sha: "abcdef123456", 
      url: "https://github.com/test-owner/test-repo/commit/abcdef123456" 
    },
    pipeline: { 
      name: "test-pipeline", 
      url: "https://github.com/test-owner/test-repo/actions/runs/123",
      runId: "123", 
      runNumber: 1, 
      runAttempt: 1 
    },
    explicitFields: [],
    metadata: {},
    failure: {
      logs: "",
      logsTruncated: false,
    },
  };

  const dummyFix: CodeFix = {
    id: "fix-123",
    title: "Test Fix",
    description: "A fix for test",
    confidence: 0.9,
    riskLevel: "low",
    category: "Build",
    changes: [
      {
        filePath: "package.json",
        action: "modify",
        originalContent: `"license": "MIT"`,
        newContent: `"license": "Apache-2.0"`,
        changeDescription: "Update license",
      },
    ],
  };

  it("checks category eligibility correctly", async () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["Build"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: false,
        verificationCommands: [],
        autoRegenerateLockfile: true,
      },
      { 
        provider: "openai", 
        model: "gpt-4o",
        minConfidence: 0.6,
        temperature: 0.1,
        timeout: 30000,
        maxTokens: 1000,
        retryAttempts: 3,
      }
    );

    const result = await engine.attemptFix(
      dummyEvent,
      "Root cause",
      ["Step 1"],
      "Dependency", // ineligible category
      "SCRUM-123"
    );

    expect(result.attempted).toBe(false);
    expect(result.reason).toContain("not eligible for self-healing");
  });

  it("returns user-friendly diagnostic reason for permission errors", async () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["Build"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: false,
        verificationCommands: [],
        autoRegenerateLockfile: true,
      },
      { 
        provider: "openai", 
        model: "gpt-4o",
        minConfidence: 0.6,
        temperature: 0.1,
        timeout: 30000,
        maxTokens: 1000,
        retryAttempts: 3,
      }
    );

    // Mock fixGenerator to return a dummy fix
    (engine as any).fixGenerator = {
      isAvailable: () => true,
      generateFix: async () => dummyFix,
    };

    // Mock resolveProvider to throw a mock HTTP error
    const mockProvider = {
      createFixPR: vi.fn().mockRejectedValue(new Error("HttpError: Resource not accessible by integration")),
    };
    (engine as any).resolveProvider = () => mockProvider;

    const result = await engine.attemptFix(
      dummyEvent,
      "Root cause",
      ["Step 1"],
      "Build",
      "SCRUM-123"
    );

    expect(result.attempted).toBe(true);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Insufficient GitHub token permissions");
  });

  it("identifies blocked workflow modifications correctly", async () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["Build"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: false,
        verificationCommands: [],
        autoRegenerateLockfile: true,
      },
      { 
        provider: "openai", 
        model: "gpt-4o",
        minConfidence: 0.6,
        temperature: 0.1,
        timeout: 30000,
        maxTokens: 1000,
        retryAttempts: 3,
      }
    );

    const workflowFix: CodeFix = {
      ...dummyFix,
      changes: [
        {
          filePath: ".github/workflows/ci.yml",
          action: "modify",
          originalContent: "runs-on: ubuntu-latest",
          newContent: "runs-on: ubuntu-22.04",
          changeDescription: "Update runner",
        },
      ],
    };

    (engine as any).fixGenerator = {
      isAvailable: () => true,
      generateFix: async () => workflowFix,
    };

    const mockProvider = {
      createFixPR: vi.fn().mockRejectedValue(new Error("HttpError: Resource not accessible by integration")),
    };
    (engine as any).resolveProvider = () => mockProvider;

    const result = await engine.attemptFix(
      dummyEvent,
      "Root cause",
      ["Step 1"],
      "Build",
      "SCRUM-123"
    );

    expect(result.attempted).toBe(true);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Cannot modify .github/workflows/ files without a Personal Access Token");
  });
});
