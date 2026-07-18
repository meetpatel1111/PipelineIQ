import { describe, it, expect } from "vitest";
import { deterministicEnricher } from "../deterministic.js";
import type { EnrichmentContext } from "../types.js";
import { PipelineIQConfigSchema } from "../../types/config.js";
import type { FailureEvent } from "../../types/index.js";

const event: FailureEvent = {
  source: "github",
  startedAt: new Date().toISOString(),
  failedAt: new Date().toISOString(),
  pipeline: { name: "build", url: "https://github.com/acme/api/actions", runId: "1" },
  repository: { owner: "acme", name: "api", url: "https://github.com/acme/api" },
  branch: "main",
  commit: { sha: "abc1234", url: "https://github.com/acme/api/commit/abc1234" },
  environment: "production",
  metadata: {},
  explicitFields: [],
  failure: { logs: "", logsTruncated: false },
};

const config = PipelineIQConfigSchema.parse({
  jira: { baseUrl: "https://acme.atlassian.net", email: "a@b.com", apiToken: "tok" },
  jiraProject: "PIQ",
});

function runEnricher(): EnrichmentContext {
  const ctx: EnrichmentContext = { event, config, fields: {}, provenance: {} };
  deterministicEnricher.enrich(ctx);
  return ctx;
}

describe("deterministicEnricher — labels", () => {
  it("emits an owner-qualified piq-repo: label for blast-radius metrics", () => {
    const labels = runEnricher().fields.labels as string[];
    // Consumed by HistoryService.getMetrics() — must be owner-qualified and prefixed piq-repo:
    expect(labels).toContain("piq-repo:acme/api");
  });

  it("keeps the legacy repo: label used by findSimilarIssues", () => {
    const labels = runEnricher().fields.labels as string[];
    expect(labels).toContain("repo:api");
  });

  it("derives branch, source, and env labels", () => {
    const labels = runEnricher().fields.labels as string[];
    expect(labels).toContain("branch:main");
    expect(labels).toContain("source:github");
    expect(labels).toContain("env:production");
  });

  it("records deterministic provenance for the labels field", () => {
    expect(runEnricher().provenance.labels).toBe("deterministic");
  });
});
