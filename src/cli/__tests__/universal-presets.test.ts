import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset } from "../index.js";

describe("applyCIPreset - Universal CI Presets", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear CI indicators
    delete process.env.GITHUB_ACTIONS;
    delete process.env.TF_BUILD;
    delete process.env.GITLAB_CI;
    delete process.env.BITBUCKET_BUILD_NUMBER;
    delete process.env.CIRCLECI;
    delete process.env.JENKINS_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates GitLab CI environment variables", () => {
    process.env.GITLAB_CI = "true";
    process.env.CI_PROJECT_PATH = "acme-corp/payment-service";
    process.env.CI_COMMIT_REF_NAME = "release/v2.5.0";
    process.env.CI_COMMIT_SHA = "998877665544";
    process.env.CI_JOB_NAME = "unit-tests";
    process.env.CI_PIPELINE_ID = "123456";
    process.env.CI_PIPELINE_IID = "42";
    process.env.GITLAB_USER_LOGIN = "gitlab-dev";
    process.env.CI_JOB_URL = "https://gitlab.com/acme-corp/payment-service/-/jobs/123456";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("gitlab");
    expect(options.repository).toBe("acme-corp/payment-service");
    expect(options.branch).toBe("release/v2.5.0");
    expect(options.commit).toBe("998877665544");
    expect(options.pipeline).toBe("unit-tests");
    expect(options.runId).toBe("123456");
    expect(options.runNumber).toBe("42");
    expect(options.actor).toBe("gitlab-dev");
    expect(options.runUrl).toBe("https://gitlab.com/acme-corp/payment-service/-/jobs/123456");
  });

  it("auto-populates Bitbucket Pipelines environment variables", () => {
    process.env.BITBUCKET_BUILD_NUMBER = "105";
    process.env.BITBUCKET_REPO_FULL_NAME = "acme/auth-api";
    process.env.BITBUCKET_BRANCH = "feat/AUTH-200-oauth";
    process.env.BITBUCKET_COMMIT = "112233445566";
    process.env.BITBUCKET_STEP_TRIGGER = "manual";
    process.env.BITBUCKET_GIT_HTTP_ORIGIN = "https://bitbucket.org";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("bitbucket");
    expect(options.repository).toBe("acme/auth-api");
    expect(options.branch).toBe("feat/AUTH-200-oauth");
    expect(options.commit).toBe("112233445566");
    expect(options.runId).toBe("105");
    expect(options.runNumber).toBe("105");
    expect(options.runUrl).toContain("https://bitbucket.org/acme/auth-api/addon/pipelines/home#!/results/105");
  });

  it("auto-populates CircleCI environment variables", () => {
    process.env.CIRCLECI = "true";
    process.env.CIRCLE_PROJECT_USERNAME = "acme";
    process.env.CIRCLE_PROJECT_REPONAME = "mobile-app";
    process.env.CIRCLE_BRANCH = "main";
    process.env.CIRCLE_SHA1 = "aabbccddeeff";
    process.env.CIRCLE_JOB = "e2e-tests";
    process.env.CIRCLE_BUILD_NUM = "77";
    process.env.CIRCLE_BUILD_URL = "https://circleci.com/gh/acme/mobile-app/77";
    process.env.CIRCLE_USERNAME = "circle-runner";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("circleci");
    expect(options.repository).toBe("acme/mobile-app");
    expect(options.branch).toBe("main");
    expect(options.commit).toBe("aabbccddeeff");
    expect(options.pipeline).toBe("e2e-tests");
    expect(options.runId).toBe("77");
    expect(options.runNumber).toBe("77");
    expect(options.actor).toBe("circle-runner");
    expect(options.runUrl).toBe("https://circleci.com/gh/acme/mobile-app/77");
  });

  it("auto-populates Jenkins environment variables", () => {
    process.env.JENKINS_URL = "https://jenkins.acme.com/";
    process.env.JOB_NAME = "Acme-Backend-CI";
    process.env.BUILD_NUMBER = "420";
    process.env.GIT_BRANCH = "origin/release/v1.0.0";
    process.env.GIT_COMMIT = "1234567890abcdef";
    process.env.BUILD_URL = "https://jenkins.acme.com/job/Acme-Backend-CI/420/";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("jenkins");
    expect(options.pipeline).toBe("Acme-Backend-CI");
    expect(options.runId).toBe("420");
    expect(options.runNumber).toBe("420");
    expect(options.branch).toBe("origin/release/v1.0.0");
    expect(options.commit).toBe("1234567890abcdef");
    expect(options.runUrl).toBe("https://jenkins.acme.com/job/Acme-Backend-CI/420/");
  });
});
