import type { Enricher, EnrichmentContext } from "./types.js";
import { HistoryService, type FailureHistory } from "../jira/history.js";
import { EnhancedJiraClient } from "../jira/enhanced-client.js";

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
          history = await historyService.getHistory(signature);
        }

        const relatedKeys = await historyService.searchRelatedByKeywords(keywords);

        ctx.history = {
          similarCount: history?.similarCount ?? 0,
          isFlaky: history?.isFlaky ?? false,
          previousIncidentKeys: history?.previousIncidentKeys ?? [],
          trend: history?.trend,
          relatedKeys: relatedKeys.filter((k) => !history?.previousIncidentKeys.includes(k)),
        };

        if (signature) {
          ctx.metrics = await historyService.getMetrics(signature);
        }
      } catch (error) {
        console.warn(`[PipelineIQ] History enrichment failed: ${error}`);
      }
    },
  };
}
