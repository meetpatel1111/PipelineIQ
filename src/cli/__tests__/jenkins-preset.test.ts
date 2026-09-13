import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyCIPreset, createFailureEvent } from "../index.js";
import { maskSecrets } from "../../core/secret-mask.js";
import { renderDescription } from "../../core/renderer.js";

describe("Jenkins Preset & Predefined Variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("auto-populates Jenkins predefined variables when JENKINS_URL is set", () => {
    process.env.JENKINS_URL = "https://jenkins.mycompany.internal/";
    process.env.JOB_NAME = "backend-services/payment-gateway";
    process.env.JOB_BASE_NAME = "payment-gateway";
    process.env.BUILD_NUMBER = "342";
    process.env.BUILD_ID = "342";
    process.env.BUILD_URL = "https://jenkins.mycompany.internal/job/backend-services/job/payment-gateway/342/";
    process.env.GIT_URL = "https://github.com/mycompany/payment-gateway.git";
    process.env.BRANCH_NAME = "main";
    process.env.GIT_BRANCH = "origin/main";
    process.env.GIT_COMMIT = "abcdef1234567890abcdef1234567890abcdef12";
    process.env.WORKSPACE = "/var/lib/jenkins/workspace/backend-services/payment-gateway";
    process.env.NODE_NAME = "agent-linux-01";
    process.env.NODE_LABELS = "linux docker x86_64";
    process.env.BUILD_USER = "jane.developer";
    process.env.BUILD_USER_ID = "jdeveloper";
    process.env.STAGE_NAME = "Test & Verify";

    const options = applyCIPreset({ preset: "auto" });

    expect(options.source).toBe("jenkins");
    expect(options.format).toBe("jenkins");
    expect(options.repository).toBe("mycompany/payment-gateway");
    expect(options.repositoryOwner).toBe("mycompany");
    expect(options.repositoryGitUrl).toBe("https://github.com/mycompany/payment-gateway.git");
    expect(options.branch).toBe("main");
    expect(options.commit).toBe("abcdef1234567890abcdef1234567890abcdef12");
    expect(options.pipeline).toBe("backend-services/payment-gateway");
    expect(options.runId).toBe("342");
    expect(options.runNumber).toBe("342");
    expect(options.actor).toBe("jane.developer");
    expect(options.runUrl).toBe("https://jenkins.mycompany.internal/job/backend-services/job/payment-gateway/342/");
    expect(options.jobName).toBe("payment-gateway");
    expect(options.workspace).toBe("/var/lib/jenkins/workspace/backend-services/payment-gateway");
    expect(options.runnerName).toBe("agent-linux-01");
    expect(options.runnerTags).toBe("linux docker x86_64");
    expect(options.stage).toBe("Test & Verify");
  });

  it("extracts git SSH URLs correctly (e.g. git@github.com:org/repo.git)", () => {
    process.env.JENKINS_URL = "https://ci.example.com/";
    process.env.JOB_NAME = "analytics-pipeline";
    process.env.BUILD_NUMBER = "89";
    process.env.GIT_URL = "git@github.com:fintech-inc/analytics-engine.git";

    const options = applyCIPreset({});

    expect(options.source).toBe("jenkins");
    expect(options.repository).toBe("fintech-inc/analytics-engine");
    expect(options.repositoryOwner).toBe("fintech-inc");
  });

  it("handles Multibranch Pipeline PR builds with CHANGE_* variables", () => {
    process.env.JENKINS_URL = "https://jenkins.corp.net/";
    process.env.JOB_NAME = "core-library/PR-45";
    process.env.BUILD_NUMBER = "12";
    process.env.BRANCH_NAME = "PR-45";
    process.env.CHANGE_ID = "45";
    process.env.CHANGE_URL = "https://github.com/corp/core-library/pull/45";
    process.env.CHANGE_TITLE = "Add support for OAuth2 tokens";
    process.env.CHANGE_AUTHOR = "contributor-bob";
    process.env.CHANGE_AUTHOR_DISPLAY_NAME = "Bob Smith";
    process.env.CHANGE_BRANCH = "feature/oauth2";
    process.env.CHANGE_TARGET = "main";

    const options = applyCIPreset({});

    expect(options.source).toBe("jenkins");
    expect(options.prNumber).toBe("45");
    expect(options.prUrl).toBe("https://github.com/corp/core-library/pull/45");
    expect(options.prTitle).toBe("Add support for OAuth2 tokens");
    expect(options.prUsername).toBe("Bob Smith");
    expect(options.prSourceBranch).toBe("feature/oauth2");
    expect(options.prTargetBranchName).toBe("main");
    expect(options.branch).toBe("feature/oauth2");
  });

  it("prioritizes CLI flags over ambient Jenkins environment variables", () => {
    process.env.JENKINS_URL = "https://jenkins.corp.net/";
    process.env.BRANCH_NAME = "main";
    process.env.JOB_NAME = "ci-job";
    process.env.BUILD_NUMBER = "55";

    const options = applyCIPreset({
      branch: "cli-override-branch",
      pipeline: "cli-override-pipeline",
      runId: "999",
      actor: "admin-override",
    });

    expect(options.branch).toBe("cli-override-branch");
    expect(options.pipeline).toBe("cli-override-pipeline");
    expect(options.runId).toBe("999");
    expect(options.actor).toBe("admin-override");
  });

  it("creates a FailureEvent with complete Jenkins pipeline metadata", async () => {
    process.env.JENKINS_URL = "https://jenkins.acme.org/";
    process.env.JOB_NAME = "microservices/auth-service";
    process.env.JOB_BASE_NAME = "auth-service";
    process.env.BUILD_NUMBER = "108";
    process.env.BUILD_ID = "108";
    process.env.BUILD_URL = "https://jenkins.acme.org/job/microservices/job/auth-service/108/";
    process.env.RUN_DISPLAY_URL = "https://jenkins.acme.org/display/redirect?page=job/microservices/job/auth-service/108/";
    process.env.GIT_URL = "https://github.com/acme/auth-service.git";
    process.env.GIT_BRANCH = "origin/release-v1";
    process.env.GIT_COMMIT = "fedcba9876543210fedcba9876543210fedcba98";
    process.env.NODE_NAME = "worker-node-04";
    process.env.BUILD_USER = "release-engineer";
    process.env.STAGE_NAME = "Integration Tests";

    const parsedLogs = {
      entries: [
        { timestamp: "2026-09-13T10:00:00Z", level: "error" as const, message: "Build step 'Execute shell' marked build as failure" }
      ],
      exitCodes: [1],
      errorMessages: ["Build step 'Execute shell' marked build as failure"],
      truncated: false,
    };

    const event = await createFailureEvent(
      "jenkins",
      parsedLogs,
      {
        source: "jenkins",
        repository: "acme/auth-service",
        branch: "release-v1",
        commit: "fedcba9876543210fedcba9876543210fedcba98",
        pipeline: "microservices/auth-service #108",
      }
    );

    expect(event.source).toBe("jenkins");
    expect(event.pipeline.jenkinsBuildNumber).toBe("108");
    expect(event.pipeline.jenkinsBuildUrl).toBe("https://jenkins.acme.org/job/microservices/job/auth-service/108/");
    expect(event.pipeline.jenkinsRunDisplayUrl).toBe("https://jenkins.acme.org/display/redirect?page=job/microservices/job/auth-service/108/");
    expect(event.pipeline.jenkinsJobName).toBe("microservices/auth-service #108");
    expect(event.pipeline.jenkinsNodeName).toBe("worker-node-04");
    expect(event.pipeline.jenkinsStageName).toBe("Integration Tests");
    expect(event.pipeline.jenkinsGitUrl).toBe("https://github.com/acme/auth-service.git");
    expect(event.repository.provider).toBe("jenkins");
    expect(event.pipeline.runUrl).toBe("https://jenkins.acme.org/display/redirect?page=job/microservices/job/auth-service/108/");
  });

  it("masks Jenkins API tokens and crumb headers in maskSecrets", () => {
    // Jenkins API Token format: 11 followed by 32 hex chars (34 chars total)
    const logWithToken = "Authenticating with Jenkins API token 11a1b2c3d4e5f60718293a4b5c6d7e8f90 in pipeline script";
    const maskedToken = maskSecrets(logWithToken);
    expect(maskedToken).not.toContain("11a1b2c3d4e5f60718293a4b5c6d7e8f90");
    expect(maskedToken).toContain("[REDACTED_JENKINS_TOKEN]");

    // Jenkins Crumb header
    const logWithCrumb = "Sending request with Jenkins-Crumb: 4a2f8b1c0e3d5a7f9b2c4e6a8d0f2b4c to master";
    const maskedCrumb = maskSecrets(logWithCrumb);
    expect(maskedCrumb).not.toContain("4a2f8b1c0e3d5a7f9b2c4e6a8d0f2b4c");
    expect(maskedCrumb).toContain("[REDACTED_JENKINS_CRUMB]");
  });

  it("renders Jenkins fields in Jira Markdown table", () => {
    const event = {
      source: "jenkins" as const,
      startedAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      pipeline: {
        name: "data-pipeline",
        jenkinsBuildNumber: "501",
        jenkinsJobName: "data-pipeline",
        jenkinsNodeName: "agent-k8s-pod-1",
        jenkinsStageName: "Transform",
        jenkinsChangeId: "88",
        jenkinsChangeTitle: "Optimize batch load",
      },
      repository: {
        owner: "org",
        name: "data-pipeline",
        url: "https://github.com/org/data-pipeline",
      },
      commit: {
        sha: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        url: "https://github.com/org/data-pipeline/commit/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      },
      branch: "feature/fast-load",
      explicitFields: [
        "jenkinsBuildNumber",
        "jenkinsJobName",
        "jenkinsNodeName",
        "jenkinsStageName",
        "jenkinsChangeId",
        "jenkinsChangeTitle",
      ],
      failure: {
        errorMessage: "Process exited with 1",
        logs: "Finished: FAILURE",
        logsTruncated: false,
      },
    };

    const rendered = renderDescription(event as any, {}, 50, true);
    expect(rendered).toContain("Jenkins Build Number");
    expect(rendered).toContain("501");
    expect(rendered).toContain("Jenkins Node Name");
    expect(rendered).toContain("agent-k8s-pod-1");
    expect(rendered).toContain("Jenkins Stage Name");
    expect(rendered).toContain("Transform");
    expect(rendered).toContain("Jenkins Change ID (PR)");
    expect(rendered).toContain("88");
  });
});
