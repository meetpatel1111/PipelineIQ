import { describe, it, expect } from "vitest";
import { renderDescription } from "../renderer.js";
import type { FailureEvent } from "../types/index.js";
import type { ComputedMetrics } from "../types/index.js";

const minEvent: FailureEvent = {
  source: "github",
  startedAt: new Date().toISOString(),
  failedAt: new Date().toISOString(),
  pipeline: {
    name: "build",
    url: "https://github.com/org/repo/actions",
    runId: "1",
  },
  repository: {
    owner: "org",
    name: "repo",
    url: "https://github.com/org/repo",
  },
  branch: "main",
  commit: {
    sha: "abc1234",
    url: "https://github.com/org/repo/commit/abc1234",
    message: "fix: something",
  },
  failure: { logs: "", logsTruncated: false, errorMessage: "test error" },
  metadata: {},
  explicitFields: [],
};

const history = {
  similarCount: 3,
  isFlaky: false,
  previousIncidentKeys: [],
  relatedKeys: [],
};

describe("renderDescription — metrics section", () => {
  it("renders MTTR when present", () => {
    const metrics: ComputedMetrics = { mttrHours: 4.2, sampleSize: 3 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).toContain("4.2h");
    expect(desc).toContain("3 incidents");
  });

  it("omits MTTR line when sampleSize is 0", () => {
    const metrics: ComputedMetrics = { sampleSize: 0 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).not.toContain("MTTR");
  });

  it("renders blast radius when present", () => {
    const metrics: ComputedMetrics = { blastRadius: 3, sampleSize: 2 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).toContain("3 repos");
  });

  it("omits blast radius line when undefined", () => {
    const metrics: ComputedMetrics = { sampleSize: 2 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).not.toContain("Blast radius");
  });

  it("renders nothing new when metrics is undefined", () => {
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, undefined);
    expect(desc).not.toContain("MTTR");
    expect(desc).not.toContain("Blast radius");
  });

  it("omits metrics section entirely when history is undefined", () => {
    const metrics: ComputedMetrics = { mttrHours: 2.0, sampleSize: 1 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, undefined, metrics);
    expect(desc).not.toContain("MTTR");
  });
});
