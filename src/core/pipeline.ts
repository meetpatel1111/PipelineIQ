import { pino, type Logger } from "pino";
import {
  type FailureEvent,
  type JiraTicketSpec,
  type PipelineIQConfig,
  JiraTicketSpecSchema,
} from "./types/index.js";
import { createJiraClient, type JiraClient } from "./jira/index.js";
import { computedEnricher } from "./enrichers/computed.js";
import { deterministicEnricher } from "./enrichers/deterministic.js";
import type { Enricher, EnrichmentContext } from "./enrichers/types.js";
import { renderDescription } from "./renderer.js";

export type ProcessResult =
  | { action: "created"; issueKey: string; spec: JiraTicketSpec }
  | { action: "updated"; issueKey: string; spec: JiraTicketSpec }
  | { action: "skipped"; reason: string; spec: JiraTicketSpec };

export type ProcessOptions = {
  /** Inject extra enrichers (e.g., AI enricher) between computed and rendering. */
  extraEnrichers?: Enricher[];
  /** Pre-built Jira client (mainly for tests). */
  jiraClient?: JiraClient;
  /** Pino logger (defaults to silent in production-like envs). */
  logger?: Logger;
};

/**
 * The spine of PipelineIQ.
 *
 * Pipeline (in order):
 *   1. DeterministicEnricher  — always runs, pulls fields from event payload.
 *   2. ComputedEnricher       — heuristics: signature match, dedup hash, severity.
 *   3. extraEnrichers         — optional (typically AI). Can override prior values.
 *   4. renderDescription      — builds the final markdown ticket description.
 *   5. JiraClient.findBySignature → updateIssue OR createIssue.
 */
export async function processFailureEvent(
  event: FailureEvent,
  config: PipelineIQConfig,
  options: ProcessOptions = {},
): Promise<ProcessResult> {
  const logger = options.logger ?? pino({ level: "info" });
  const ctx: EnrichmentContext = {
    event,
    config,
    fields: {},
    provenance: {},
  };

  const enrichers: Enricher[] = [
    deterministicEnricher,
    computedEnricher,
    ...(options.extraEnrichers ?? []),
  ];

  for (const enricher of enrichers) {
    logger.debug({ enricher: enricher.name }, "running enricher");
    await enricher.enrich(ctx);
  }

  // Render description AFTER all enrichers have populated fields.
  ctx.fields.description = renderDescription(
    event,
    ctx.fields,
    config.logExcerptLines,
    config.maskSecrets,
    config.displayMetadata,
  );
  ctx.fields.provenance = ctx.provenance;

  const spec = JiraTicketSpecSchema.parse(ctx.fields);
  const jira = options.jiraClient ?? createJiraClient(config.jira);

  // Dedup path
  if (config.dedup.enabled) {
    const existing = await jira.findBySignature(
      config.jiraProject,
      spec.dedupSignature,
      config.dedup.windowHours,
    );
    if (existing) {
      logger.info(
        { existingKey: existing.key, signature: spec.dedupSignature },
        "dedup hit — updating existing issue",
      );
      await jira.addComment(
        existing.key,
        `Failure recurred at ${new Date().toISOString()} — ${event.pipeline.url}`,
      );
      return { action: "updated", issueKey: existing.key, spec };
    }
  }

  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");
  return { action: "created", issueKey: created.key, spec };
}
