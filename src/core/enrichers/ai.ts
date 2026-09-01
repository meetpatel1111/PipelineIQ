import type { Enricher, EnrichmentContext } from "./types.js";
import { setField } from "./types.js";
import { AIEngine } from "../ai/ai-engine.js";
import { maskSecrets } from "../secret-mask.js";

/**
 * AIEnricher — uses the AIEngine to provide high-fidelity diagnostics.
 * This should run after deterministic and computed enrichers.
 */
export const aiEnricher: Enricher = {
  name: "ai",
  source: "ai",

  async enrich(ctx: EnrichmentContext) {
    const { event, config } = ctx;

    if (config.ai.mode === "disabled") {
      return;
    }

    const { temperature, ...restAiConfig } = config.ai;
    const aiEngine = AIEngine.create(config.ai.mode as any, {
      ...restAiConfig,
      maxTokens: config.ai.maxLogTokens,
      ...(temperature !== undefined ? { temperature } : {}),
    });
    
    if (!aiEngine.isAvailable()) {
      return;
    }

    try {
      // Security: Sanitize secrets from logs and error messages before uploading to AI providers
      const sanitizedEvent = config.maskSecrets !== false
        ? {
            ...event,
            failure: {
              ...event.failure,
              logs: maskSecrets(event.failure.logs || ""),
              errorMessage: event.failure.errorMessage ? maskSecrets(event.failure.errorMessage) : undefined,
              stackTrace: event.failure.stackTrace ? maskSecrets(event.failure.stackTrace) : undefined,
            },
          }
        : event;

      // Cast to any to bypass the minor type discrepancies between the unified config and engine-specific config
      const results = await aiEngine.enrich(sanitizedEvent, config.ai as any, ctx.history);
      
      for (const result of results) {
        if (result.aiUsed && result.value) {
          // Map internal result fields to Jira ticket fields
          let fieldName = result.field;
          
          if (fieldName === "rootCause") {
            setField(ctx, "rca", result.value as string, "ai", true);
          } else if (fieldName === "remediation") {
            setField(ctx, "remediationSteps", result.value as string[], "ai", true);
          } else if (fieldName === "classification") {
            const currentLabels = (ctx.fields.labels as string[]) || [];
            const newLabels = Array.isArray(result.value) ? result.value : [String(result.value)];
            setField(ctx, "labels", Array.from(new Set([...currentLabels, ...newLabels])), "ai");
          } else {
            setField(ctx, fieldName as any, result.value, "ai", true);
          }
        }
      }
    } catch (error) {
      console.warn(`AI Enrichment failed: ${error}`);
    }
  },
};
