import { describe, it, expect } from "vitest";
import { computeDedupSignature, computeFailureFingerprint } from "../dedup.js";
import type { FailureEvent } from "../types/index.js";

function createMockEvent(overrides: { failure?: Partial<FailureEvent["failure"]>; repository?: Partial<FailureEvent["repository"]>; branch?: string; environment?: string } = {}): FailureEvent {
  return {
    source: "github",
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
    repository: {
      owner: "acme-org",
      name: "payment-service",
      url: "https://github.com/acme-org/payment-service",
      defaultBranch: "main",
      ...overrides.repository,
    },
    branch: overrides.branch ?? "feature/checkout",
    commit: {
      sha: "a1b2c3d4e5f67890",
      url: "https://github.com/acme-org/payment-service/commit/a1b2c3d4e5f67890",
      message: "Add checkout route",
      author: "Jane Doe",
    },
    pipeline: {
      name: "CI",
      runId: "123456",
      runNumber: 42,
      url: "https://github.com/acme-org/payment-service/actions/runs/123456",
      step: "Run Tests",
    },
    failure: {
      failedStep: "Run Tests",
      exitCode: 1,
      logs: "Runner startup boilerplate line 1\nRunner startup boilerplate line 2\n[FAIL] Test payment_gateway_spec failed with TimeoutError",
      logsTruncated: false,
      ...overrides.failure,
    },
    environment: overrides.environment ?? "dev",
    metadata: {},
    explicitFields: [],
  };
}

describe("Deduplication & Fingerprinting (dedup.ts)", () => {
  it("generates deterministic signature for identical failure parameters", () => {
    const event1 = createMockEvent();
    const event2 = createMockEvent();

    const sig1 = computeDedupSignature(event1, "Test");
    const sig2 = computeDedupSignature(event2, "Test");

    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(16);
  });

  it("differentiates failures when the error diagnostic at the tail differs even with identical runner setup", () => {
    const commonSetupHeader = "Setup runner node 20\nDownload actions/checkout\n".repeat(50);

    const event1 = createMockEvent({
      failure: {
        failedStep: "Build",
        exitCode: 1,
        logs: `${commonSetupHeader}\nError: Cannot find module '@company/core-billing'`,
      },
    });

    const event2 = createMockEvent({
      failure: {
        failedStep: "Build",
        exitCode: 1,
        logs: `${commonSetupHeader}\nError: SyntaxError: Unexpected token export in index.js`,
      },
    });

    const sig1 = computeDedupSignature(event1, "Build");
    const sig2 = computeDedupSignature(event2, "Build");

    expect(sig1).not.toBe(sig2);
  });

  it("normalizes hex IDs, numbers, and paths for stable deduplication", () => {
    const event1 = createMockEvent({
      failure: {
        failedStep: "Deploy",
        errorMessage: "Error acquiring state lock ID: 8d7a6e4b in /home/runner/work/infra/main.tf",
        logs: "",
      },
    });

    const event2 = createMockEvent({
      failure: {
        failedStep: "Deploy",
        errorMessage: "Error acquiring state lock ID: 9f8b7c6a in /home/runner/work/infra/main.tf",
        logs: "",
      },
    });

    const sig1 = computeDedupSignature(event1, "Infrastructure");
    const sig2 = computeDedupSignature(event2, "Infrastructure");

    expect(sig1).toBe(sig2);
  });

  it("computes cross-repo failure fingerprint regardless of repository name", () => {
    const event1 = createMockEvent({
      repository: { owner: "org-a", name: "repo-alpha", url: "", defaultBranch: "main" },
      failure: { failedStep: "test", errorMessage: "Fatal: connection refused to redis:6379", logs: "" },
    });

    const event2 = createMockEvent({
      repository: { owner: "org-b", name: "repo-beta", url: "", defaultBranch: "main" },
      failure: { failedStep: "test", errorMessage: "Fatal: connection refused to redis:6379", logs: "" },
    });

    const fp1 = computeFailureFingerprint(event1, "Infrastructure");
    const fp2 = computeFailureFingerprint(event2, "Infrastructure");

    expect(fp1).toBe(fp2);
  });
});
