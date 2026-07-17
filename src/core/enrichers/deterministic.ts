import type { Enricher, EnrichmentContext } from "./types.js";
import { setField } from "./types.js";

/**
 * DeterministicEnricher — populates every field that's derivable directly
 * from the FailureEvent without computation, history, or AI.
 *
 * This always runs first, always succeeds, never makes network calls.
 */
export const deterministicEnricher: Enricher = {
  name: "deterministic",
  source: "deterministic",

  enrich(ctx: EnrichmentContext) {
    const { event, config } = ctx;

    setField(ctx, "projectKey", config.jiraProject, "deterministic");
    setField(ctx, "issueType", config.issueType, "deterministic");

    // Template-based summary — always available, even with AI disabled.
    const step = event.pipeline.step ?? event.failure.failedStep ?? "step";
    const exitInfo =
      event.failure.exitCode !== undefined ? ` (exit ${event.failure.exitCode})` : "";
    setField(
      ctx,
      "summary",
      `${event.pipeline.name} failed at ${step} on ${event.branch}${exitInfo}`,
      "deterministic",
    );

    // Labels: auto-generated from event context.
    const labels = new Set<string>(config.defaultLabels);
    labels.add(`repo:${event.repository.name}`);
    // Owner-qualified repo label — consumed by HistoryService.getMetrics() blast-radius
    // counting. Kept distinct from the `repo:` label (used by findSimilarIssues) so both
    // conventions stay stable.
    labels.add(`piq-repo:${event.repository.owner}/${event.repository.name}`);
    labels.add(`branch:${event.branch}`);
    labels.add(`source:${event.source}`);
    if (event.environment) labels.add(`env:${event.environment}`);
    setField(ctx, "labels", Array.from(labels), "deterministic");

    if (event.environment) {
      setField(ctx, "environment", event.environment, "deterministic");
    }

    if (config.defaultAssignee) {
      setField(ctx, "assignee", config.defaultAssignee, "deterministic");
    } else {
      setField(ctx, "assignee", null, "deterministic");
    }

    // External links — always populated from event payload.
    const links: Array<{ url: string; title: string }> = [
      { url: event.pipeline.url, title: "Pipeline" },
    ];
    if (event.pipeline.runUrl) {
      links.push({ url: event.pipeline.runUrl, title: "Pipeline Run" });
    }
    links.push({ url: event.commit.url, title: `Commit ${event.commit.sha.slice(0, 7)}` });
    links.push({ url: event.repository.url, title: "Repository" });
    if (event.pullRequest) {
      links.push({ url: event.pullRequest.url, title: `PR #${event.pullRequest.number}` });
    }
    setField(ctx, "externalLinks", links, "deterministic");

    // Merge custom metadata into fields
    if (event.metadata && Object.keys(event.metadata).length > 0) {
      const existingFields = (ctx.fields.customFields as Record<string, any>) || {};
      setField(
        ctx,
        "customFields",
        { ...existingFields, ...event.metadata },
        "deterministic",
      );
    }
  },
};
