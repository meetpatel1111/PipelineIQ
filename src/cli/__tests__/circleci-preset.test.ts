import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset, createFailureEvent } from "../index.js";
import { maskSecrets } from "../../core/secret-mask.js";

describe("CircleCI Preset & Predefined Variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates CircleCI predefined variables when CIRCLECI is set", () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_PROJECT_USERNAME = "circleci-org";
    process.env.CIRCLE_PROJECT_REPONAME = "app-service";
    process.env.CIRCLE_REPOSITORY_URL = "https://github.com/circleci-org/app-service.git";
    process.env.CIRCLE_BRANCH = "main";
    process.env.CIRCLE_SHA1 = "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b";
    process.env.CIRCLE_JOB = "build-and-test";
    process.env.CIRCLE_PIPELINE_NUMBER = "42";
    process.env.CIRCLE_PIPELINE_ID = "11111111-2222-3333-4444-555555555555";
    process.env.CIRCLE_BUILD_NUM = "105";
    process.env.CIRCLE_BUILD_URL = "https://circleci.com/gh/circleci-org/app-service/105";
    process.env.CIRCLE_USERNAME = "circle-dev";
    process.env.CIRCLE_WORKING_DIRECTORY = "/home/circleci/project";
    process.env.CIRCLE_PROJECT_ID = "22222222-3333-4444-5555-666666666666";
    process.env.CIRCLE_ORGANIZATION_ID = "33333333-4444-5555-6666-777777777777";
    process.env.CIRCLE_WORKFLOW_ID = "44444444-5555-6666-7777-888888888888";
    process.env.CIRCLE_WORKFLOW_JOB_ID = "55555555-6666-7777-8888-999999999999";
    process.env.CIRCLE_NODE_INDEX = "1";
    process.env.CIRCLE_NODE_TOTAL = "4";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("circleci");
    expect(options.format).toBe("circleci");
    expect(options.repository).toBe("circleci-org/app-service");
    expect(options.repositoryOwner).toBe("circleci-org");
    expect(options.repositoryGitUrl).toBe("https://github.com/circleci-org/app-service.git");
    expect(options.branch).toBe("main");
    expect(options.commit).toBe("0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b");
    expect(options.pipeline).toBe("build-and-test #42");
    expect(options.runId).toBe("105");
    expect(options.runNumber).toBe("42");
    expect(options.actor).toBe("circle-dev");
    expect(options.runUrl).toBe("https://circleci.com/gh/circleci-org/app-service/105");
    expect(options.jobName).toBe("build-and-test");
    expect(options.workspace).toBe("/home/circleci/project");
    expect(options.project).toBe("app-service");
    expect(options.projectId).toBe("22222222-3333-4444-5555-666666666666");
    expect(options.parallelStep).toBe("1");
    expect(options.parallelStepCount).toBe("4");
    expect(options.environment).toBe("main");
  });

  it("handles Pull Request builds and extracts PR numbers from CIRCLE_PULL_REQUEST", () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_PROJECT_USERNAME = "circleci-org";
    process.env.CIRCLE_PROJECT_REPONAME = "app-service";
    process.env.CIRCLE_BRANCH = "feat/new-api";
    process.env.CIRCLE_PULL_REQUEST = "https://github.com/circleci-org/app-service/pull/99";
    process.env.CIRCLE_PR_REPONAME = "app-service";
    process.env.CIRCLE_PR_USERNAME = "external-contributor";

    const options = applyCIPreset({});

    expect(options.source).toBe("circleci");
    expect(options.prNumber).toBe("99");
    expect(options.prUrl).toBe("https://github.com/circleci-org/app-service/pull/99");
    expect(options.prRepoName).toBe("app-service");
    expect(options.prUsername).toBe("external-contributor");
    expect(options.prSourceBranch).toBe("feat/new-api");
  });

  it("falls back to CIRCLE_TAG when CIRCLE_BRANCH is empty", () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_PROJECT_USERNAME = "circleci-org";
    process.env.CIRCLE_PROJECT_REPONAME = "app-service";
    delete process.env.CIRCLE_BRANCH;
    process.env.CIRCLE_TAG = "v2.5.0";

    const options = applyCIPreset({});

    expect(options.source).toBe("circleci");
    expect(options.branch).toBe("v2.5.0");
    expect(options.tag).toBe("v2.5.0");
  });

  it("ensures CLI flags take precedence over CIRCLE_* environment variables", () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_BRANCH = "ci-branch";
    process.env.CIRCLE_JOB = "ci-job";
    process.env.CIRCLE_BUILD_NUM = "100";

    const options = applyCIPreset({
      branch: "override-branch",
      pipeline: "override-pipeline",
      runId: "999",
    });

    expect(options.branch).toBe("override-branch");
    expect(options.pipeline).toBe("override-pipeline");
    expect(options.runId).toBe("999");
  });

  it("creates a FailureEvent with complete CircleCI pipeline metadata", async () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_PROJECT_USERNAME = "acme";
    process.env.CIRCLE_PROJECT_REPONAME = "payment-svc";
    process.env.CIRCLE_BRANCH = "main";
    process.env.CIRCLE_SHA1 = "1234567890abcdef1234567890abcdef12345678";
    process.env.CIRCLE_JOB = "deploy";
    process.env.CIRCLE_BUILD_NUM = "77";
    process.env.CIRCLE_BUILD_URL = "https://circleci.com/gh/acme/payment-svc/77";
    process.env.CIRCLE_WORKFLOW_ID = "wf-123";
    process.env.CIRCLE_WORKFLOW_JOB_ID = "wfj-456";
    process.env.CIRCLE_NODE_INDEX = "0";
    process.env.CIRCLE_NODE_TOTAL = "2";

    const parsedLogs = {
      entries: [
        { timestamp: "2026-09-13T10:00:00Z", level: "error" as const, message: "Deploy failed: timeout" }
      ],
      exitCodes: [1],
      errorMessages: ["Deploy failed: timeout"],
      truncated: false,
    };

    const event = await createFailureEvent(
      "circleci",
      parsedLogs,
      {
        source: "circleci",
        repository: "acme/payment-svc",
        branch: "main",
        commit: "1234567890abcdef1234567890abcdef12345678",
        pipeline: "deploy",
      }
    );

    expect(event.source).toBe("circleci");
    expect(event.pipeline.circleciBuildNum).toBe("77");
    expect(event.pipeline.circleciBuildUrl).toBe("https://circleci.com/gh/acme/payment-svc/77");
    expect(event.pipeline.circleciWorkflowId).toBe("wf-123");
    expect(event.pipeline.circleciWorkflowJobId).toBe("wfj-456");
    expect(event.pipeline.circleciNodeIndex).toBe(0);
    expect(event.pipeline.circleciNodeTotal).toBe(2);
    expect(event.pipeline.runUrl).toBe("https://circleci.com/gh/acme/payment-svc/77");
    expect(event.pipeline.url).toBe("https://circleci.com/gh/acme/payment-svc");
    expect(event.repository.provider).toBe("circleci");
  });

  it("masks CircleCI Personal API Tokens and Circle-Token header", () => {
    const rawLog = [
      "Authenticating with token CCIPAT_abcdef12345678901234567890",
      "curl -H 'Circle-Token: secret_token_value_here' https://circleci.com/api/v2/me",
    ].join("\n");

    const masked = maskSecrets(rawLog);

    expect(masked).not.toContain("CCIPAT_abcdef12345678901234567890");
    expect(masked).not.toContain("secret_token_value_here");
    expect(masked).toContain("[REDACTED_CIRCLECI_TOKEN]");
  });
});
