import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset } from "../index.js";
import { maskSecrets } from "../../core/secret-mask.js";

describe("GitLab CI Preset & Predefined Variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates GitLab CI predefined variables when GITLAB_CI is set", () => {
    process.env.GITLAB_CI = "true";
    process.env.CI_PROJECT_PATH = "gitlab-org/gitlab-runner";
    process.env.CI_PROJECT_ROOT_NAMESPACE = "gitlab-org";
    process.env.CI_PROJECT_URL = "https://gitlab.com/gitlab-org/gitlab-runner";
    process.env.CI_COMMIT_BRANCH = "main";
    process.env.CI_COMMIT_SHA = "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b";
    process.env.CI_PIPELINE_ID = "100200300";
    process.env.CI_PIPELINE_IID = "42";
    process.env.CI_PIPELINE_NAME = "Build and Test Pipeline";
    process.env.CI_JOB_ID = "889900";
    process.env.CI_JOB_NAME = "unit-tests";
    process.env.CI_JOB_STAGE = "test";
    process.env.CI_JOB_STATUS = "failed";
    process.env.CI_JOB_URL = "https://gitlab.com/gitlab-org/gitlab-runner/-/jobs/889900";
    process.env.CI_PIPELINE_SOURCE = "push";
    process.env.CI_JOB_RETRY_COUNT = "1";
    process.env.CI_ENVIRONMENT_NAME = "staging";
    process.env.CI_ENVIRONMENT_TIER = "staging";
    process.env.CI_ENVIRONMENT_ACTION = "start";
    process.env.CI_API_V4_URL = "https://gitlab.com/api/v4";
    process.env.CI_RUNNER_DESCRIPTION = "gitlab-runner-saas-linux-medium";
    process.env.CI_RUNNER_ID = "123456";
    process.env.CI_RUNNER_TAGS = "saas-linux-medium,docker";
    process.env.CI_RUNNER_VERSION = "16.10.0";
    process.env.CI_RUNNER_EXECUTABLE_ARCH = "linux/amd64";
    process.env.CI_JOB_IMAGE = "node:20-alpine";
    process.env.GITLAB_USER_LOGIN = "testdev";
    process.env.GITLAB_USER_ID = "998877";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("gitlab");
    expect(options.format).toBe("gitlab");
    expect(options.repository).toBe("gitlab-org/gitlab-runner");
    expect(options.repositoryOwner).toBe("gitlab-org");
    expect(options.branch).toBe("main");
    expect(options.commit).toBe("9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b");
    expect(options.pipeline).toBe("Build and Test Pipeline");
    expect(options.runId).toBe("100200300");
    expect(options.runNumber).toBe("42");
    expect(options.actor).toBe("testdev");
    expect(options.actorId).toBe("998877");
    expect(options.jobName).toBe("unit-tests");
    expect(options.stage).toBe("test");
    expect(options.jobStatus).toBe("failed");
    expect(options.eventName).toBe("push");
    expect(options.runAttempt).toBe("2"); // 1 retry count -> attempt 2
    expect(options.environment).toBe("staging");
    expect(options.environmentTier).toBe("staging");
    expect(options.runUrl).toBe("https://gitlab.com/gitlab-org/gitlab-runner/-/jobs/889900");
    expect(options.apiUrl).toBe("https://gitlab.com/api/v4");
    expect(options.runnerOs).toBe("linux");
    expect(options.runnerArch).toBe("amd64");
    expect(options.runnerName).toBe("gitlab-runner-saas-linux-medium");
    expect(options.runnerId).toBe("123456");
    expect(options.runnerTags).toBe("saas-linux-medium,docker");
    expect(options.runnerVersion).toBe("16.10.0");
    expect(options.jobContainer).toBe("node:20-alpine");
  });

  it("handles Merge Request pipelines and maps MR metadata", () => {
    process.env.GITLAB_CI = "true";
    process.env.CI_PROJECT_PATH = "acme/web-frontend";
    process.env.CI_MERGE_REQUEST_IID = "15";
    process.env.CI_MERGE_REQUEST_ID = "987654";
    process.env.CI_MERGE_REQUEST_TITLE = "feat: add user authentication";
    process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME = "feature/auth";
    process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME = "main";
    process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA = "fedcba0987654321";
    process.env.CI_MERGE_REQUEST_PROJECT_URL = "https://gitlab.com/acme/web-frontend";
    process.env.CI_COMMIT_REF_NAME = "15-feature-auth";

    const options = applyCIPreset({});

    expect(options.source).toBe("gitlab");
    expect(options.branch).toBe("feature/auth");
    expect(options.prNumber).toBe("15");
    expect(options.prId).toBe("987654");
    expect(options.prTitle).toBe("feat: add user authentication");
    expect(options.prSourceBranch).toBe("feature/auth");
    expect(options.prTargetBranchName).toBe("main");
    expect(options.prSourceCommitId).toBe("fedcba0987654321");
    expect(options.headRef).toBe("feature/auth");
    expect(options.baseRef).toBe("main");
  });

  it("masks GitLab secret tokens in logs", () => {
    const raw = [
      "Authenticating with glpat-abcdef12345678901234 to registry",
      "Using job token glcbt-9876543210fedcba0987 for API",
      "Deploying with token gldt-tokendeploy1234567890",
      "Triggering pipeline with glptt-triggerpipe1234567890",
    ].join("\n");

    const masked = maskSecrets(raw);

    expect(masked).not.toContain("glpat-abcdef12345678901234");
    expect(masked).not.toContain("glcbt-9876543210fedcba0987");
    expect(masked).not.toContain("gldt-tokendeploy1234567890");
    expect(masked).not.toContain("glptt-triggerpipe1234567890");
    expect(masked).toContain("[REDACTED_GITLAB_PAT]");
    expect(masked).toContain("[REDACTED_GITLAB_JOB_TOKEN]");
    expect(masked).toContain("[REDACTED_GITLAB_DEPLOY_TOKEN]");
    expect(masked).toContain("[REDACTED_GITLAB_TRIGGER_TOKEN]");
  });
});
