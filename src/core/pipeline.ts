import { pino, type Logger } from "pino";
import {
  type FailureEvent,
  type JiraTicketSpec,
  type PipelineIQConfig,
  JiraTicketSpecSchema,
} from "./types/index.js";
import { createEnhancedJiraClient, EnhancedJiraClient } from "./jira/index.js";
import { JiraClient } from "./jira/client.js";
import { createHistoryEnricher } from "./enrichers/history.js";
import { computedEnricher } from "./enrichers/computed.js";
import { deterministicEnricher } from "./enrichers/deterministic.js";
import type { Enricher, EnrichmentContext } from "./enrichers/types.js";
import type { ComputedMetrics } from "./types/index.js";
import { renderDescription } from "./renderer.js";
import { NotificationService } from "./notifications/index.js";
import type { NotificationResult, NotificationPayload } from "./notifications/index.js";

type ProcessResultBase = {
  spec: JiraTicketSpec;
  metrics?: ComputedMetrics;
  notifications?: NotificationResult;
};

export type ProcessResult =
  | ({ action: "created"; issueKey: string } & ProcessResultBase)
  | ({ action: "updated"; issueKey: string } & ProcessResultBase)
  | ({ action: "skipped"; reason: string } & ProcessResultBase);

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

  const jira = options.jiraClient ?? createEnhancedJiraClient(config.jira);

  const enrichers: Enricher[] = [
    deterministicEnricher,
    computedEnricher,
    createHistoryEnricher(jira as EnhancedJiraClient),
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
    ctx.history,
    ctx.metrics,
  );
  ctx.fields.provenance = ctx.provenance;

  const spec = JiraTicketSpecSchema.parse(ctx.fields);

  const metrics = ctx.metrics;

  async function maybeNotify(issueKey: string, isNewTicket: boolean): Promise<NotificationResult | undefined> {
    if (!config.notifications) return undefined;
    const service = new NotificationService(config.notifications);
    const notifPayload = buildNotificationPayload(ctx, issueKey, isNewTicket, config.jira.baseUrl);
    try {
      return await service.send(notifPayload);
    } catch (error) {
      console.warn(`[PipelineIQ] Notification stage failed: ${error}`);
      return undefined;
    }
  }

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
      const notifications = await maybeNotify(existing.key, false);
      return {
        action: "updated",
        issueKey: existing.key,
        spec,
        ...(metrics !== undefined && { metrics }),
        ...(notifications !== undefined && { notifications }),
      };
    }
  }

  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");
  const notifications = await maybeNotify(created.key, true);
  return {
    action: "created",
    issueKey: created.key,
    spec,
    ...(metrics !== undefined && { metrics }),
    ...(notifications !== undefined && { notifications }),
  };
}

function buildNotificationPayload(
  ctx: EnrichmentContext,
  issueKey: string,
  isNewTicket: boolean,
  jiraBaseUrl: string,
): NotificationPayload {
  return {
    title: ctx.fields.summary ?? "Pipeline failure",
    ...(ctx.fields.rca !== undefined && { summary: ctx.fields.rca }),
    severity: (ctx.fields.severity as string) ?? "Medium",
    priority: (ctx.fields.priority as string) ?? "Medium",
    jiraKey: issueKey,
    jiraUrl: `${jiraBaseUrl}/browse/${issueKey}`,
    repo: ctx.event.repository.name,
    pipeline: ctx.event.pipeline.name,
    branch: ctx.event.branch,
    isNewTicket,
    ...(ctx.history?.similarCount !== undefined && { dedupCount: ctx.history.similarCount }),
    ...(ctx.metrics !== undefined && {
      metrics: {
        ...(ctx.metrics.mttrHours !== undefined && { mttrHours: ctx.metrics.mttrHours }),
        ...(ctx.metrics.blastRadius !== undefined && { blastRadius: ctx.metrics.blastRadius }),
      },
    }),
  };
}
