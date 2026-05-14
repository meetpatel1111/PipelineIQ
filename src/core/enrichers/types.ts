import type {
  FailureEvent,
  JiraTicketSpec,
  PipelineIQConfig,
  FieldProvenance,
  ComputedMetrics,
} from "../types/index.js";

/**
 * The mutable context that flows through the enrichment pipeline.
 * Each enricher reads from `event` and writes into `fields`, recording its
 * source in `provenance` so we can audit which stage produced what.
 */
export type EnrichmentContext = {
  event: FailureEvent;
  config: PipelineIQConfig;
  fields: Partial<JiraTicketSpec>;
  provenance: Record<string, FieldProvenance>;
  history?: {
    similarCount: number;
    isFlaky: boolean;
    previousIncidentKeys: string[];
    trend?: "improving" | "worsening" | "stable" | undefined;
    relatedKeys: string[];
  };
  metrics?: ComputedMetrics;
};

export interface Enricher {
  readonly name: string;
  readonly source: FieldProvenance;
  enrich(ctx: EnrichmentContext): Promise<void> | void;
}

/**
 * Set a field on the spec and record its provenance in one step.
 * If the field is already populated by an earlier enricher, this is a no-op
 * unless `override` is set — letting AI override deterministic values, but
 * preventing accidental clobbers between same-stage enrichers.
 */
export function setField<K extends keyof JiraTicketSpec>(
  ctx: EnrichmentContext,
  key: K,
  value: JiraTicketSpec[K],
  source: FieldProvenance,
  override = false,
): void {
  if (!override && ctx.fields[key] !== undefined) return;
  ctx.fields[key] = value;
  ctx.provenance[String(key)] = source;
}
