import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset } from "../index.js";
import { maskSecrets } from "../../core/secret-mask.js";

describe("Bitbucket Pipelines Preset & Predefined Variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates Bitbucket Pipelines predefined variables when BITBUCKET_BUILD_NUMBER is set", () => {
    process.env.BITBUCKET_BUILD_NUMBER = "105";
    process.env.BITBUCKET_CLONE_DIR = "/opt/atlassian/pipelines/agent/build";
    process.env.BITBUCKET_COMMIT = "1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d";
    process.env.BITBUCKET_WORKSPACE = "atlassian-corp";
    process.env.BITBUCKET_WORKSPACE_UUID = "{11111111-2222-3333-4444-555555555555}";
    process.env.BITBUCKET_REPO_OWNER = "atlassian-corp";
    process.env.BITBUCKET_REPO_OWNER_UUID = "{22222222-3333-4444-5555-666666666666}";
    process.env.BITBUCKET_REPO_SLUG = "backend-service";
    process.env.BITBUCKET_REPO_UUID = "{33333333-4444-5555-6666-777777777777}";
    process.env.BITBUCKET_REPO_FULL_NAME = "atlassian-corp/backend-service";
    process.env.BITBUCKET_REPO_IS_PRIVATE = "true";
    process.env.BITBUCKET_BRANCH = "release/v2";
    process.env.BITBUCKET_GIT_HTTP_ORIGIN = "https://bitbucket.org/atlassian-corp/backend-service.git";
    process.env.BITBUCKET_STEP_UUID = "{44444444-5555-6666-7777-888888888888}";
    process.env.BITBUCKET_PIPELINE_UUID = "{55555555-6666-7777-8888-999999999999}";
    process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT = "Production";
    process.env.BITBUCKET_DEPLOYMENT_ENVIRONMENT_UUID = "{66666666-7777-8888-9999-000000000000}";
    process.env.BITBUCKET_PROJECT_KEY = "PROJ";
    process.env.BITBUCKET_PROJECT_UUID = "{77777777-8888-9999-0000-111111111111}";
    process.env.BITBUCKET_STEP_TRIGGERER_UUID = "{88888888-9999-0000-1111-222222222222}";
    process.env.BITBUCKET_STEP_RUN_NUMBER = "1";
    process.env.BITBUCKET_PARALLEL_STEP = "2";
    process.env.BITBUCKET_PARALLEL_STEP_COUNT = "4";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("bitbucket");
    expect(options.format).toBe("bitbucket");
    expect(options.repository).toBe("atlassian-corp/backend-service");
    expect(options.repositoryOwner).toBe("atlassian-corp");
    expect(options.repositoryGitUrl).toBe("https://bitbucket.org/atlassian-corp/backend-service.git");
    expect(options.branch).toBe("release/v2");
    expect(options.commit).toBe("1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d");
    expect(options.runId).toBe("105");
    expect(options.runNumber).toBe("105");
    expect(options.actor).toBe("{88888888-9999-0000-1111-222222222222}");
    expect(options.actorId).toBe("{88888888-9999-0000-1111-222222222222}");
    expect(options.environment).toBe("Production");
    expect(options.environmentId).toBe("{66666666-7777-8888-9999-000000000000}");
    expect(options.project).toBe("PROJ");
    expect(options.workspace).toBe("/opt/atlassian/pipelines/agent/build");
    expect(options.stepRunNumber).toBe("1");
    expect(options.stepUuid).toBe("{44444444-5555-6666-7777-888888888888}");
    expect(options.pipelineUuid).toBe("{55555555-6666-7777-8888-999999999999}");
    expect(options.parallelStep).toBe("2");
    expect(options.parallelStepCount).toBe("4");
    expect(options.runUrl).toBe("https://bitbucket.org/atlassian-corp/backend-service/pipelines/results/105");
  });

  it("handles Pull Request pipelines and maps PR metadata", () => {
    process.env.BITBUCKET_BUILD_NUMBER = "106";
    process.env.BITBUCKET_REPO_FULL_NAME = "acme/api-server";
    process.env.BITBUCKET_PR_ID = "42";
    process.env.BITBUCKET_BRANCH = "feature/login-fix";
    process.env.BITBUCKET_PR_DESTINATION_BRANCH = "main";
    process.env.BITBUCKET_COMMIT = "commit1234567890abcdef";
    process.env.BITBUCKET_PR_DESTINATION_COMMIT = "destcommit0987654321";

    const options = applyCIPreset({});

    expect(options.source).toBe("bitbucket");
    expect(options.prNumber).toBe("42");
    expect(options.prSourceBranch).toBe("feature/login-fix");
    expect(options.prTargetBranchName).toBe("main");
    expect(options.prSourceCommitId).toBe("commit1234567890abcdef");
    expect(options.prDestinationCommit).toBe("destcommit0987654321");
    expect(options.headRef).toBe("feature/login-fix");
    expect(options.baseRef).toBe("main");
    expect(options.runUrl).toBe("https://bitbucket.org/acme/api-server/pipelines/results/106");
  });

  it("falls back to BITBUCKET_TAG when BITBUCKET_BRANCH is unset", () => {
    process.env.BITBUCKET_BUILD_NUMBER = "107";
    process.env.BITBUCKET_REPO_SLUG = "sdk";
    process.env.BITBUCKET_WORKSPACE = "acme";
    delete process.env.BITBUCKET_BRANCH;
    process.env.BITBUCKET_TAG = "v1.2.0";

    const options = applyCIPreset({});

    expect(options.source).toBe("bitbucket");
    expect(options.repository).toBe("acme/sdk");
    expect(options.branch).toBe("v1.2.0");
  });

  it("masks Bitbucket Personal Access Tokens and Repository Access Tokens", () => {
    const rawLog = "Deploying using bpat-abcdef1234567890abcdef1234 and bbpat-0987654321fedcba0987654321";
    const masked = maskSecrets(rawLog);

    expect(masked).not.toContain("bpat-abcdef1234567890abcdef1234");
    expect(masked).not.toContain("bbpat-0987654321fedcba0987654321");
    expect(masked).toContain("[REDACTED_BITBUCKET_TOKEN]");
  });
});
