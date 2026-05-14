import type { Enricher, EnrichmentContext } from "./types.js";
import { HistoryService, type FailureHistory } from "../jira/history.js";
import { EnhancedJiraClient } from "../jira/enhanced-client.js";

/**
 * HistoryEnricher — queries Jira to find past incidents with the same signature.
 * Populates ctx.history with similarCount, isFlaky, and trend data.
 */
export function createHistoryEnricher(jira: EnhancedJiraClient): Enricher {
  return {
    name: "history",
    source: "history",

    async enrich(ctx: EnrichmentContext) {
      const signature = ctx.fields.dedupSignature;
      const historyService = new HistoryService(jira, ctx.config.jiraProject);
      
      const logs = ctx.event.failure.logs || "";
      const errorMessage = ctx.event.failure.errorMessage || "";
      
      // Extract keywords for fuzzy search
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
          relatedKeys: relatedKeys.filter(k => !history?.previousIncidentKeys.includes(k)),
        };
      } catch (error) {
        console.warn(`[PipelineIQ] History enrichment failed: ${error}`);
      }
    },
  };
}
