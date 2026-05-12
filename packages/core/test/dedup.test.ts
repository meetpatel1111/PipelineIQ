import { describe, expect, it } from "vitest";
import type { FailureEvent } from "../src/types/index.js";
import { computeDedupSignature } from "../src/dedup.js";

function baseEvent(overrides: Partial<FailureEvent> = {}): FailureEvent {
  return {
    source: "github",
    startedAt: "2026-05-12T10:00:00.000Z",
    failedAt: "2026-05-12T10:05:00.000Z",
    pipeline: {
      name: "deploy-prod",
      url: "https://github.com/x/y/actions/runs/1",
      runId: "1",
      step: "terraform apply",
    },
    repository: {
      owner: "x",
      name: "y",
      url: "https://github.com/x/y",
    },
    commit: {
      sha: "abc123",
      url: "https://github.com/x/y/commit/abc123",
    },
    branch: "main",
    failure: {
      errorMessage: "Error acquiring state lock. Lock Info: ID: 8d7a6f3e",
      logs: "",
      logsTruncated: false,
    },
    ...overrides,
  };
}

describe("computeDedupSignature", () => {
  it("produces identical signatures for two failures with different lock IDs", () => {
    const a = computeDedupSignature(baseEvent(), "Infrastructure");
    const b = computeDedupSignature(
      baseEvent({
        failure: {
          errorMessage: "Error acquiring state lock. Lock Info: ID: 9e8b7c2a",
          logs: "",
          logsTruncated: false,
        },
      }),
      "Infrastructure",
    );
    expect(a).toBe(b);
  });

  it("produces different signatures for different repos", () => {
    const a = computeDedupSignature(baseEvent(), "Infrastructure");
    const b = computeDedupSignature(
      baseEvent({ repository: { owner: "z", name: "w", url: "https://github.com/z/w" } }),
      "Infrastructure",
    );
    expect(a).not.toBe(b);
  });

  it("produces different signatures for different categories", () => {
    const a = computeDedupSignature(baseEvent(), "Infrastructure");
    const b = computeDedupSignature(baseEvent(), "Build");
    expect(a).not.toBe(b);
  });

  it("returns a stable 16-char hex string", () => {
    const sig = computeDedupSignature(baseEvent(), "Infrastructure");
    expect(sig).toMatch(/^[0-9a-f]{16}$/);
  });
});
