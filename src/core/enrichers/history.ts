import type { Enricher, EnrichmentContext } from "./types.js";
import type { FailureCategory } from "../types/index.js";
import { HistoryService, type FailureHistory } from "../jira/history.js";
import { EnhancedJiraClient } from "../jira/enhanced-client.js";
import { computeFailureFingerprint } from "../dedup.js";

export function createHistoryEnricher(jira: EnhancedJiraClient): Enricher {
  return {
    name: "history",
    source: "history",

    async enrich(ctx: EnrichmentContext) {
      const signature = ctx.fields.dedupSignature;
      const historyService = new HistoryService(jira, ctx.config.jiraProject);

      const errorMessage = ctx.event.failure.errorMessage ?? "";
      const keywords = [
        ...(ctx.event.failure.failedCommand ? [ctx.event.failure.failedCommand] : []),
        ...(errorMessage ? [errorMessage.split(":")[0]!] : []),
      ];

      try {
        let history: FailureHistory | undefined;
        if (signature) {
          const category = (ctx.fields.category as FailureCategory | undefined) ?? "Unknown";
          const fingerprint = computeFailureFingerprint(ctx.event, category);
          const currentRepo = `${ctx.event.repository.owner}/${ctx.event.repository.name}`;
          const [fetchedHistory, metrics] = await Promise.all([
            historyService.getHistory(signature),
            historyService.getMetrics(signature, fingerprint, currentRepo),
          ]);
          history = fetchedHistory;
          ctx.metrics = metrics;
        }

        const relatedKeys = await historyService.searchRelatedByKeywords(keywords);

        ctx.history = {
          similarCount: history?.similarCount ?? 0,
          isFlaky: history?.isFlaky ?? false,
          previousIncidentKeys: history?.previousIncidentKeys ?? [],
          trend: history?.trend,
          relatedKeys: relatedKeys.filter((k) => !history?.previousIncidentKeys.includes(k)),
        };
      } catch (error) {
        console.warn(`[PipelineIQ] History enrichment failed: ${error}`);
      }
    },
  };
}
