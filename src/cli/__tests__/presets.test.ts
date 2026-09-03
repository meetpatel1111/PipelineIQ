import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset } from "../index.js";

describe("applyCIPreset (CI Platform Auto-Detection & Presets)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates GitHub Actions metadata when running in GitHub Actions", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_REPOSITORY = "acme/payment-service";
    process.env.GITHUB_WORKFLOW = "CI Workflow";
    process.env.GITHUB_SHA = "1234567890abcdef";
    process.env.GITHUB_REF_NAME = "main";
    process.env.GITHUB_RUN_ID = "998877";
    process.env.GITHUB_RUN_NUMBER = "42";
    process.env.GITHUB_ACTOR = "octocat";
    process.env.RUNNER_OS = "Linux";
    process.env.RUNNER_ARCH = "X64";
    process.env.GITHUB_TOKEN = "ghp_secretToken";

    const options = applyCIPreset({});

    expect(options.source).toBe("github");
    expect(options.format).toBe("github-actions");
    expect(options.repository).toBe("acme/payment-service");
    expect(options.pipeline).toBe("CI Workflow");
    expect(options.commit).toBe("1234567890abcdef");
    expect(options.branch).toBe("main");
    expect(options.runId).toBe("998877");
    expect(options.runNumber).toBe("42");
    expect(options.actor).toBe("octocat");
    expect(options.runnerOs).toBe("Linux");
    expect(options.githubToken).toBe("ghp_secretToken");
  });

  it("allows user CLI flags to explicitly override environment defaults", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_REPOSITORY = "acme/payment-service";
    process.env.GITHUB_REF_NAME = "main";

    // User explicitly overrides the branch and repository
    const options = applyCIPreset({
      branch: "release/v2.0",
      repository: "acme/custom-override",
    });

    expect(options.branch).toBe("release/v2.0");
    expect(options.repository).toBe("acme/custom-override");
  });

  it("auto-populates Azure DevOps metadata when preset is azure-devops", () => {
    process.env.BUILD_REPOSITORY_NAME = "acme-corp/azure-app";
    process.env.BUILD_DEFINITIONNAME = "Build & Deploy";
    process.env.BUILD_SOURCEVERSION = "abcdef123456";
    process.env.BUILD_SOURCEBRANCHNAME = "staging";
    process.env.SYSTEM_ACCESSTOKEN = "azure_secret_pat";

    const options = applyCIPreset({ preset: "azure-devops" });

    expect(options.source).toBe("azure-devops");
    expect(options.format).toBe("azure-devops");
    expect(options.repository).toBe("acme-corp/azure-app");
    expect(options.pipeline).toBe("Build & Deploy");
    expect(options.commit).toBe("abcdef123456");
    expect(options.branch).toBe("staging");
    expect(options.azureToken).toBe("azure_secret_pat");
  });

  it("falls back to standard environment variables for Jira and AI", () => {
    process.env.JIRA_URL = "https://acme.atlassian.net";
    process.env.JIRA_PROJECT = "SCRUM";
    process.env.GEMINI_API_KEY = "gemini_secret_key";

    const options = applyCIPreset({});

    expect(options.jiraUrl).toBe("https://acme.atlassian.net");
    expect(options.jiraProject).toBe("SCRUM");
    expect(options.aiApiKey).toBe("gemini_secret_key");
    expect(options.aiProvider).toBe("gemini");
    expect(options.aiMode).toBe("assist");
  });

  it("disables auto-population when preset is none", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_REPOSITORY = "acme/payment-service";

    const options = applyCIPreset({ preset: "none" });

    expect(options.repository).toBeUndefined();
    expect(options.source).toBeUndefined();
  });
});
