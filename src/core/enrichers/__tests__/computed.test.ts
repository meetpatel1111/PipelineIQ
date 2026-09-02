import { describe, it, expect } from "vitest";
import { computedEnricher } from "../computed.js";
import { deterministicEnricher } from "../deterministic.js";
import { renderDescription, getExitCodeDescription } from "../../renderer.js";
import type { EnrichmentContext } from "../types.js";
import { PipelineIQConfigSchema } from "../../types/config.js";
import type { FailureEvent } from "../../types/index.js";

function createMockEvent(overrides: Partial<FailureEvent> = {}): FailureEvent {
  return {
    source: "github",
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
    pipeline: { name: "cicd", url: "https://github.com/acme/web-app/actions/runs/123", runId: "123", step: "installing dependencies" },
    repository: { owner: "acme", name: "web-app", url: "https://github.com/acme/web-app" },
    branch: "main",
    commit: { sha: "abc1234567890", url: "https://github.com/acme/web-app/commit/abc1234" },
    environment: "production",
    metadata: {},
    explicitFields: [],
    failure: {
      exitCode: 1,
      errorMessage: "unable to find node 2",
      logs: "Error: unable to find node 2\nCheck runner PATH configuration",
      logsTruncated: false,
    },
    ...overrides,
  };
}

describe("Standardized Jira details when AI is disabled (computedEnricher)", () => {
  it("formats standardized summary with pipeline, step, concise error, and branch", () => {
    const event = createMockEvent();
    const config = PipelineIQConfigSchema.parse({
      jira: { baseUrl: "https://acme.atlassian.net", email: "a@b.com", apiToken: "tok" },
      jiraProject: "DEV",
      ai: { mode: "disabled" },
    });

    const ctx: EnrichmentContext = { event, config, fields: {}, provenance: {} };
    deterministicEnricher.enrich(ctx);
    computedEnricher.enrich(ctx);

    expect(ctx.fields.summary).toBe("Pipeline 'cicd' failed at 'installing dependencies' with error \"unable to find node 2\" (main)");
    expect(ctx.fields.rca).toBeDefined();
    expect(ctx.fields.remediationSteps).toBeDefined();
    expect(Array.isArray(ctx.fields.remediationSteps)).toBe(true);
    expect(ctx.fields.remediationSteps!.length).toBeGreaterThan(0);
    expect(ctx.fields.labels).toContain("piq-mode:deterministic");
  });

  it("translates exit codes to human-readable explanations", () => {
    expect(getExitCodeDescription(127)).toContain("Command Not Found in PATH");
    expect(getExitCodeDescription(137)).toContain("Out of Memory");
    expect(getExitCodeDescription(1)).toContain("General Command / Script Failure");
  });

  it("renders rich incident breakdown and description details without AI", () => {
    const event = createMockEvent();
    const config = PipelineIQConfigSchema.parse({
      jira: { baseUrl: "https://acme.atlassian.net", email: "a@b.com", apiToken: "tok" },
      jiraProject: "DEV",
      ai: { mode: "disabled" },
    });

    const ctx: EnrichmentContext = { event, config, fields: {}, provenance: {} };
    deterministicEnricher.enrich(ctx);
    computedEnricher.enrich(ctx);

    const description = renderDescription(
      event,
      ctx.fields,
      50,
      true,
      undefined,
      undefined,
      undefined
    );

    expect(description).toContain("## PipelineIQ Failure Report");
    expect(description).toContain("### Failure Summary");
    expect(description).toContain("### Incident Breakdown");
    expect(description).toContain("- **Pipeline:** `cicd`");
    expect(description).toContain("- **Failing Step:** `installing dependencies`");
    expect(description).toContain("- **Exit Status:** `1 (General Command / Script Failure)`");
    expect(description).toContain("### Root Cause");
    expect(description).toContain("### Suggested Remediation");
    expect(description).toContain("## Pipeline Metadata");
    expect(description).toContain("### Links");
  });
});
