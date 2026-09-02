import { describe, it, expect, vi } from "vitest";
import { SelfHealingEngine } from "../engine.js";
import { FixGenerator } from "../fix-generator.js";
import { applyPatch } from "../patch.js";
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
        enableThinking: false,
        thinkingBudget: 8000,
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
        enableThinking: false,
        thinkingBudget: 8000,
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
        enableThinking: false,
        thinkingBudget: 8000,
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

  it("patchLocalFile handles CRLF vs LF line endings and indentation differences", () => {
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
        enableThinking: false,
        thinkingBudget: 8000,
      }
    );
    // 1. Line endings mismatch: CRLF in original content, LF in snippet
    const originalContentCRLF = "{\r\n  \"dependencies\": {\r\n    \"react\": \"^18.0.0\"\r\n  }\r\n}";
    const originalSnippetLF = "  \"dependencies\": {\n    \"react\": \"^18.0.0\"\n  }";
    const newSnippetLF = "  \"dependencies\": {\n    \"react\": \"^18.2.0\"\n  }";
 
    const patchedResult = applyPatch(originalContentCRLF, originalSnippetLF, newSnippetLF);
    expect(patchedResult).toContain("\r\n");
    expect(patchedResult).toContain("\"react\": \"^18.2.0\"");
    expect(patchedResult).not.toContain("^18.0.0");
 
    // 2. Indentation mismatch: snippet has different indentation spacing or alignment
    const originalContent = "class Test {\n    constructor() {\n        this.setup();\n    }\n}";
    const snippetIndentation = "  constructor() {\n    this.setup();\n  }";
    const newSnippet = "  constructor() {\n    this.initialize();\n  }";
 
    const patchedIndentation = applyPatch(originalContent, snippetIndentation, newSnippet);
    expect(patchedIndentation).toContain("this.initialize()");
    expect(patchedIndentation).not.toContain("this.setup()");
 
    // 3. Snippet not found throws — prevents corrupt file writes
    expect(() => applyPatch(originalContent, "nonexistentSnippet", "newSnippet")).toThrow(
      /Target snippet could not be matched/
    );
  });

  it("extracts all types of file extensions correctly and ignores numeric versions/decimals", () => {
    const generator = new FixGenerator({
      provider: "local",
      apiKey: "dummy",
      model: "dummy-model",
      minConfidence: 0.6,
      temperature: 0.1,
      timeout: 30000,
      maxTokens: 1000,
      retryAttempts: 3,
      enableThinking: false,
      thinkingBudget: 8000,
    });
    const logText = "Error in main.tf at line 20, also check Cargo.toml, build.gradle, app.kt, lib.rs and src/utils.ts. Version is 3.14 or 0.19.1.";
    const paths = (generator as any).extractFilePaths(logText);
    
    expect(paths).toContain("main.tf");
    expect(paths).toContain("Cargo.toml");
    expect(paths).toContain("build.gradle");
    expect(paths).toContain("app.kt");
    expect(paths).toContain("lib.rs");
    expect(paths).toContain("src/utils.ts");
    expect(paths).not.toContain("20");
    expect(paths).not.toContain("3.14");
    expect(paths).not.toContain("0.19.1");
  });

  it("supports wildcard '*' category to allow fixes across all failure types", async () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["*"],
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
        enableThinking: false,
        thinkingBudget: 8000,
      }
    );

    expect((engine as any).isCategoryAllowed("DatabaseMigration")).toBe(true);
    expect((engine as any).isCategoryAllowed("SecurityVulnerability")).toBe(true);
    expect((engine as any).isCategoryAllowed("SyntaxError")).toBe(true);
  });

  it("prioritizes AI-suggested verificationCommand when present", () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["*"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: true,
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
        enableThinking: false,
        thinkingBudget: 8000,
      }
    );

    const fixWithCmd: CodeFix = {
      ...dummyFix,
      verificationCommand: "pnpm nx test core-api",
    };

    const cmds = (engine as any).resolveVerificationCommands("Test", process.cwd(), fixWithCmd);
    expect(cmds).toEqual(["pnpm nx test core-api"]);
  });

  it("extracts failed step execution command from CI runner logs", () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["*"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: true,
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
        enableThinking: false,
        thinkingBudget: 8000,
      }
    );

    const eventWithLog: FailureEvent = {
      ...dummyEvent,
      failure: {
        logs: "##[group]Run mix test --cover\nCompiling 12 files (.ex)\n......\n1) test calculates mttr (HistoryTest)\n** (RuntimeError) expected true",
        logsTruncated: false,
      },
    };

    const extracted = (engine as any).extractFailedStepCommand(eventWithLog);
    expect(extracted).toBe("mix test --cover");

    const resolved = (engine as any).resolveVerificationCommands("Test", process.cwd(), dummyFix, eventWithLog);
    expect(resolved).toEqual(["mix test --cover"]);
  });

  it("identifies lockfile desync across multiple package managers and ecosystems", () => {
    const engine = new SelfHealingEngine(
      {
        enabled: true,
        enableGuardrails: true,
        dryRun: false,
        minConfidence: 0.8,
        maxFilesChanged: 10,
        maxLinesChanged: 200,
        allowedCategories: ["*"],
        blockedPaths: [],
        branchPrefix: "fix",
        draftPr: true,
        reviewers: [],
        prLabels: [],
        enableVerification: true,
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
        enableThinking: false,
        thinkingBudget: 8000,
      }
    );

    const pnpmDesync: FailureEvent = {
      ...dummyEvent,
      failure: { errorMessage: "ERR_PNPM_LOCKFILE_OUTDATED: Cannot install with \"frozen-lockfile\" because pnpm-lock.yaml is not up-to-date", logs: "", logsTruncated: false },
    };
    expect((engine as any).isLockfileDesync(pnpmDesync)).toBe(true);

    const cargoDesync: FailureEvent = {
      ...dummyEvent,
      failure: { errorMessage: "error: the lock file /app/Cargo.lock needs to be updated but --locked was passed to prevent this", logs: "", logsTruncated: false },
    };
    expect((engine as any).isLockfileDesync(cargoDesync)).toBe(true);

    const poetryDesync: FailureEvent = {
      ...dummyEvent,
      failure: { errorMessage: "poetry.lock was not found or is out of date", logs: "", logsTruncated: false },
    };
    expect((engine as any).isLockfileDesync(poetryDesync)).toBe(true);

    expect((engine as any).isLockfileName("pnpm-lock.yaml")).toBe(true);
    expect((engine as any).isLockfileName("Cargo.lock")).toBe(true);
    expect((engine as any).isLockfileName("poetry.lock")).toBe(true);
    expect((engine as any).isLockfileName("src/auth.ts")).toBe(false);
  });

  it("parses AI verificationCommand and packageSyncCommand from fix response", () => {
    const generator = new FixGenerator({
      provider: "local",
      apiKey: "dummy",
      model: "dummy-model",
      minConfidence: 0.6,
      temperature: 0.1,
      timeout: 30000,
      maxTokens: 1000,
      retryAttempts: 3,
      enableThinking: false,
      thinkingBudget: 8000,
    });

    const aiRaw = JSON.stringify({
      canFix: true,
      title: "Update Foundry dependencies and contracts",
      description: "Upgrades OpenZeppelin contracts and regenerates bindings",
      confidence: 0.95,
      riskLevel: "low",
      verificationCommand: "forge test --match-contract AuthTest",
      packageSyncCommand: "forge build",
      changes: [
        {
          filePath: "contracts/Auth.sol",
          action: "modify",
          originalContent: "import '@openzeppelin/contracts/access/Ownable.sol';",
          newContent: "import '@openzeppelin/contracts-v5/access/Ownable.sol';",
          changeDescription: "Update import path",
        },
      ],
    });

    const parsed = (generator as any).parseFix(aiRaw, "SmartContract");
    expect(parsed).not.toBeNull();
    expect(parsed.verificationCommand).toBe("forge test --match-contract AuthTest");
    expect(parsed.packageSyncCommand).toBe("forge build");
    expect(parsed.changes[0].filePath).toBe("contracts/Auth.sol");
  });
});
