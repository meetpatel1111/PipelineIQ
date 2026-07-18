import { processFailureEvent } from "./dist/index.js";
import path from "path";

// A mock Jira client
const mockJiraClient = {
  findBySignature: async () => null,
  createIssue: async (issueSpec) => {
    console.log("\n=============================================");
    console.log("✅ JIRA TICKET SPECIFICATION CREATED");
    console.log("=============================================");
    console.log(`Summary: ${issueSpec.summary}`);
    console.log(`Assignee: ${issueSpec.assignee || 'Unassigned'}`);
    console.log(`Labels: ${issueSpec.labels?.join(", ")}`);
    console.log("=============================================\n");
    return { key: "DEMO-123" };
  },
  updateIssue: async () => { return { key: "DEMO-123" }; },
  searchIssues: async () => ({ issues: [] }),
  advancedSearch: async () => ({ issues: [] }),
  getIssue: async () => ({ fields: {} }),
  addComment: async () => {},
  addWorklog: async () => {}
};

// A mock failure event simulating a TypeScript error in piq-test/src/mathUtils.ts
const demoEvent = {
  source: "github",
  startedAt: new Date().toISOString(),
  failedAt: new Date().toISOString(),
  pipeline: {
    name: "CI Pipeline",
    url: "http://github.com/test",
    runId: "123",
    workspace: "C:/Users/pmeet/Downloads/piq-test", // Use piq-test as the workspace root
  },
  repository: {
    owner: "demo",
    name: "piq-test",
    url: "http://github.com/demo/piq-test"
  },
  commit: {
    sha: "abcdef",
    url: "http://github.com/demo/piq-test/commit/abcdef",
  },
  branch: "main",
  failure: {
    errorMessage: "src/mathUtils.ts(10,5): error TS1005: ',' expected.",
    logs: "src/mathUtils.ts(10,5): error TS1005: ',' expected.\n    return a / b;\n    ~~~~~",
    exitCode: 1,
  },
  metadata: {},
  explicitFields: []
};

// Minimal configuration
const config = {
  jira: { baseUrl: "https://demo.atlassian.net" },
  jiraProject: "DEMO",
  issueType: "Bug",
  ai: {
    mode: "full",
    provider: "local",
    model: "dummy",
  },
  dedup: {
    enabled: true,
  },
  selfHealing: {
    enabled: true,
    platform: "github",
    enableGuardrails: false,
    dryRun: true,
    reviewers: ["default-reviewer"],
    enableVerification: false, // We'll disable it for the fast dryRun, or maybe keep it true?
  }
};

// Mock AI enricher to simulate what the AI usually does
const mockAiEnricher = {
  name: "mock-ai",
  source: "ai",
  enrich: (ctx) => {
    ctx.fields.failingFiles = ["src/mathUtils.ts"];
    ctx.fields.description = "AI Root Cause Analysis: Syntax error in mathUtils.ts.";
  }
};

// We will also patch the fixGenerator in SelfHealingEngine just to simulate it generating a hallucinated fix
// Since we only want to test the Engine fallback, we can use the `attemptFix` method if we want, or let `processFailureEvent` do it.

async function runDemo() {
  console.log("🚀 Starting PipelineIQ Local Test Run against piq-test...");
  
  // Set the CWD to piq-test so CODEOWNERS is found correctly!
  process.env.GITHUB_WORKSPACE = "C:/Users/pmeet/Downloads/piq-test";
  
  try {
    const result = await processFailureEvent(
      demoEvent, 
      config, 
      {
        jiraClient: mockJiraClient,
        extraEnrichers: [mockAiEnricher],
      }
    );

    console.log("Process Result:", result.action);
    if (result.selfHealing) {
      console.log("\n=============================================");
      console.log("🤖 SELF-HEALING ENGINE RESULT");
      console.log("=============================================");
      console.log(`Attempted: ${result.selfHealing.attempted}`);
      console.log(`Success: ${result.selfHealing.success}`);
      console.log(`Reason: ${result.selfHealing.reason}`);
      console.log("=============================================\n");
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

runDemo();
