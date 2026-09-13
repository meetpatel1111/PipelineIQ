import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createFailureEvent } from "../index.js";

describe("CLI Operational Overrides (createFailureEvent)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const dummyParsedLogs = {
    entries: [
      { timestamp: "2026-09-13T00:00:00Z", level: "info", message: "Step 1 started" },
      { timestamp: "2026-09-13T00:01:00Z", level: "error", message: "default-step: segmentation fault" },
    ],
    exitCodes: [1],
    errorMessages: ["default-step: segmentation fault"],
    truncated: false,
  };

  it("strictly prioritizes CLI flag overrides over ambient Bitbucket CI environment variables", async () => {
    // Populate ambient Bitbucket environment variables
    process.env.BITBUCKET_BUILD_NUMBER = "100";
    process.env.BITBUCKET_REPO_FULL_NAME = "ambient-org/ambient-repo";
    process.env.BITBUCKET_BRANCH = "ambient-branch";
    process.env.BITBUCKET_COMMIT = "1111111111111111111111111111111111111111";
    process.env.BITBUCKET_PR_ID = "10";
    process.env.BITBUCKET_STEP_UUID = "{ambient-uuid}";

    const options = {
      pipeline: "Custom Pipeline",
      repository: "override-org/override-repo",
      branch: "override-branch",
      commit: "9999999999999999999999999999999999999999",
      step: "Custom Step Execution",
      stage: "Integration Tests",
      exitCode: "137",
      errorMessage: "Killed by OOM Killer",
      prNumber: "99",
      prTitle: "Feat: CLI overrides",
      prSourceBranch: "feat/cli-overrides",
      prTargetBranchName: "main",
      runnerId: "runner-override-42",
      runnerOs: "linux-custom",
      environmentTier: "staging",
      actor: "override-dev",
    };

    const event = await createFailureEvent("bitbucket", dummyParsedLogs, options);

    // Operational overrides
    expect(event.repository.owner).toBe("override-org");
    expect(event.repository.name).toBe("override-repo");
    expect(event.branch).toBe("feat/cli-overrides");
    expect(event.commit.sha).toBe("9999999999999999999999999999999999999999");
    expect(event.pipeline.name).toBe("Custom Pipeline");
    expect(event.pipeline.step).toBe("Custom Step Execution");
    expect(event.pipeline.stage).toBe("Integration Tests");
    expect(event.pipeline.runnerOs).toBe("linux-custom");

    // Failure details
    expect(event.failure.exitCode).toBe(137);
    expect(event.failure.errorMessage).toBe("Killed by OOM Killer");
    expect(event.failure.failedStep).toBe("Custom Step Execution");

    // Pull request
    expect(event.pullRequest).toBeDefined();
    expect(event.pullRequest?.number).toBe(99);
    expect(event.pullRequest?.title).toBe("Feat: CLI overrides");
    expect(event.pullRequest?.sourceBranch).toBe("feat/cli-overrides");
    expect(event.pullRequest?.targetBranch).toBe("main");

    // Explicit fields tracking
    expect(event.explicitFields).toContain("step");
    expect(event.explicitFields).toContain("stage");
    expect(event.explicitFields).toContain("exitCode");
    expect(event.explicitFields).toContain("errorMessage");
    expect(event.explicitFields).toContain("prNumber");
    expect(event.explicitFields).toContain("prTitle");
    expect(event.explicitFields).toContain("prSourceBranch");
    expect(event.explicitFields).toContain("prTargetBranchName");
    expect(event.explicitFields).toContain("runnerId");
    expect(event.explicitFields).toContain("environmentTier");
  });

  it("strictly prioritizes CLI flag overrides over ambient GitLab CI environment variables", async () => {
    // Populate ambient GitLab environment variables
    process.env.CI_PROJECT_PATH = "gitlab-org/gitlab-repo";
    process.env.CI_COMMIT_BRANCH = "main";
    process.env.CI_COMMIT_SHA = "aaaaabbbbbcccccdddddeeeeefffff0000011111";
    process.env.CI_PIPELINE_NAME = "GitLab Pipeline";
    process.env.CI_JOB_STAGE = "test";
    process.env.CI_MERGE_REQUEST_IID = "5";

    const options = {
      pipeline: "Custom CI Pipeline",
      repository: "my-group/my-repo",
      branch: "fix/auth-bug",
      commit: "fffffeeeee0000011111aaaaabbbbbcccccddddd",
      step: "Unit Tests (Jest)",
      stage: "quality-assurance",
      exitCode: "2",
      errorMessage: "2 snapshot tests failed",
    };

    const event = await createFailureEvent("gitlab", dummyParsedLogs, options);

    expect(event.repository.owner).toBe("my-group");
    expect(event.repository.name).toBe("my-repo");
    expect(event.branch).toBe("fix/auth-bug");
    expect(event.commit.sha).toBe("fffffeeeee0000011111aaaaabbbbbcccccddddd");
    expect(event.pipeline.name).toBe("Custom CI Pipeline");
    expect(event.pipeline.step).toBe("Unit Tests (Jest)");
    expect(event.pipeline.stage).toBe("quality-assurance");
    expect(event.failure.exitCode).toBe(2);
    expect(event.failure.errorMessage).toBe("2 snapshot tests failed");
    expect(event.failure.failedStep).toBe("Unit Tests (Jest)");
  });

  it("strictly prioritizes CLI flag overrides over ambient GitHub Actions environment variables", async () => {
    // Populate ambient GitHub environment variables
    process.env.GITHUB_REPOSITORY = "github-org/github-repo";
    process.env.GITHUB_REF = "refs/heads/master";
    process.env.GITHUB_SHA = "0000000000000000000000000000000000000000";
    process.env.GITHUB_WORKFLOW = "Build and Test";

    const options = {
      repository: "override-owner/override-project",
      branch: "release/v1.0",
      commit: "1234567890abcdef1234567890abcdef12345678",
      step: "E2E Cypress Tests",
      exitCode: "1",
    };

    const event = await createFailureEvent("github", dummyParsedLogs, options);

    expect(event.repository.owner).toBe("override-owner");
    expect(event.repository.name).toBe("override-project");
    expect(event.branch).toBe("release/v1.0");
    expect(event.commit.sha).toBe("1234567890abcdef1234567890abcdef12345678");
    expect(event.pipeline.step).toBe("E2E Cypress Tests");
    expect(event.failure.failedStep).toBe("E2E Cypress Tests");
    expect(event.failure.exitCode).toBe(1);
  });
});
