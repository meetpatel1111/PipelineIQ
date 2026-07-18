import { pino, type Logger } from "pino";
import {
  type JiraTicketSpec,
  type FailureEvent,
  type PipelineIQConfig,
  JiraTicketSpecSchema,
  type ComputedMetrics,
  type SelfHealingResult,
} from "./types/index.js";
import { createEnhancedJiraClient, EnhancedJiraClient } from "./jira/index.js";
import { JiraClient } from "./jira/client.js";
import { createHistoryEnricher } from "./enrichers/history.js";
import { computedEnricher } from "./enrichers/computed.js";
import { deterministicEnricher } from "./enrichers/deterministic.js";
import { codeOwnerEnricher } from "./enrichers/codeowners.js";
import type { Enricher, EnrichmentContext } from "./enrichers/types.js";
import { renderDescription } from "./renderer.js";
import { NotificationService } from "./notifications/index.js";
import type { NotificationResult, NotificationPayload } from "./notifications/index.js";
import { SelfHealingEngine } from "./self-healing/index.js";

type ProcessResultBase = {
  spec: JiraTicketSpec;
  metrics?: ComputedMetrics;
  notifications?: NotificationResult;
  selfHealing?: SelfHealingResult;
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
 *   4. codeOwnerEnricher      — runs after AI to map failingFiles to CODEOWNERS.
 *   5. renderDescription      — builds the final markdown ticket description.
 *   6. JiraClient.findBySignature → updateIssue OR createIssue.
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

  const jira = options.jiraClient ?? createEnhancedJiraClient(config.jira, config.jiraCustomFields);

  const enrichers: Enricher[] = [
    deterministicEnricher,
    computedEnricher,
    createHistoryEnricher(jira as EnhancedJiraClient),
    ...(options.extraEnrichers ?? []),
    codeOwnerEnricher,
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
  
  // Propagate computed metrics to fields for Jira custom field mapping
  if (ctx.metrics) {
    ctx.fields.metrics = ctx.metrics;
  }

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
      spec.dedupSignature as string,
      config.dedup.windowHours,
    );
    if (existing) {
      const isClosed = config.dedup.closedStatuses.includes(existing.status);

      if (isClosed && config.dedup.onClosedHit === "create-new") {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "closed duplicate found — creating new ticket as per strategy",
        );
        // We continue to creation block, but we'll link it later
      } else if (isClosed && config.dedup.onClosedHit === "skip") {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "closed duplicate found — skipping as per strategy",
        );
        return {
          action: "skipped",
          reason: `Duplicate closed issue: ${existing.key}`,
          spec,
          ...(metrics !== undefined && { metrics }),
        };
      } else {
        logger.info(
          { existingKey: existing.key, signature: spec.dedupSignature },
          "dedup hit — updating existing issue",
        );

        // Auto-reopen if closed and strategy is reopen
        if (isClosed && config.dedup.onClosedHit === "reopen") {
          logger.info({ issueKey: existing.key, status: existing.status }, "re-opening closed issue");
          try {
            await (jira as EnhancedJiraClient).transitionIssue(existing.key, config.dedup.reopenTransition);
            await jira.addComment(
              existing.key,
              `⚠️ Failure re-occurred while issue was ${existing.status}. Re-opening for investigation.`
            );
          } catch (e) {
            logger.warn({ err: e, issueKey: existing.key }, "failed to re-open issue");
          }
        }

        await jira.addComment(
          existing.key,
          `Failure recurred at ${new Date().toISOString()} — ${event.pipeline.url}`,
        );

        if (config.autoWorklog && event.durationMs) {
          const seconds = Math.floor(event.durationMs / 1000);
          if (seconds > 0) {
            await (jira as EnhancedJiraClient).addWorklog(existing.key, seconds, `Pipeline recurrence duration: ${seconds}s`);
          }
        }

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
  }

  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");

  // If this was a "create-new" dedup hit, link to the old one
  if (config.dedup.enabled) {
    // Re-check for existing issue (or pass it down)
    const existing = await jira.findBySignature(
      config.jiraProject,
      spec.dedupSignature as string,
      config.dedup.windowHours,
    );
    // Find the one that ISN'T the one we just created
    if (existing && existing.key !== created.key && config.dedup.closedStatuses.includes(existing.status) && config.dedup.onClosedHit === "create-new") {
       try {
         await (jira as EnhancedJiraClient).linkIssues(created.key, existing.key, "Relates");
         await jira.addComment(
           created.key,
           `ℹ️ This failure was previously tracked in ${existing.key} (Status: ${existing.status}). A new ticket has been opened to track the fresh effort.`
         );
       } catch (e) {
         logger.warn({ err: e }, "failed to link new issue to previous one");
       }
    }
  }

  if (config.autoWorklog && event.durationMs) {
    const seconds = Math.floor(event.durationMs / 1000);
    if (seconds > 0) {
      await (jira as EnhancedJiraClient).addWorklog(created.key, seconds, `Initial failure duration: ${seconds}s`);
    }
  }

  // ── Self-Healing: attempt autonomous fix ────────────────────────────────
  let selfHealingResult: SelfHealingResult | undefined;
  if (config.selfHealing?.enabled) {
    logger.info({ issueKey: created.key }, "self-healing enabled — attempting fix");
    try {
      const healEngine = new SelfHealingEngine(
        config.selfHealing,
        {
          provider: config.ai.provider as any,
          apiKey: config.ai.apiKey,
          model: config.ai.model,
          endpoint: config.ai.endpoint,
          maxTokens: 8192,
          temperature: 0.2,
          timeout: 60000,
          retryAttempts: 2,
          minConfidence: config.selfHealing.minConfidence,
          enableThinking: config.ai.enableThinking ?? false,
          thinkingBudget: config.ai.thinkingBudget ?? 8000,
        },
      );

      const rootCause = (ctx.fields.rca as string) ?? "";
      const remediation = Array.isArray(ctx.fields.remediationSteps)
        ? (ctx.fields.remediationSteps as string[])
        : [];
      const category = (ctx.fields.category as string) ?? "Unknown";

      selfHealingResult = await healEngine.attemptFix(
        event,
        rootCause,
        remediation,
        category,
        created.key,
        ctx.codeowners
      );

      if (selfHealingResult.success && selfHealingResult.prUrl) {
        logger.info(
          { issueKey: created.key, prUrl: selfHealingResult.prUrl },
          "self-healing PR created",
        );
        // Add a comment on the Jira ticket linking to the PR
        await jira.addComment(
          created.key,
          `🤖 **Self-Healing Fix Available**\n\n` +
            `PipelineIQ has generated an automated fix and opened a Pull Request for review:\n\n` +
            `🔗 [${selfHealingResult.prUrl}](${selfHealingResult.prUrl})\n\n` +
            `| Field | Value |\n| --- | --- |\n` +
            `| Confidence | ${Math.round((selfHealingResult.fix?.confidence ?? 0) * 100)}% |\n` +
            `| Risk | ${selfHealingResult.fix?.riskLevel ?? "unknown"} |\n` +
            `| Files Changed | ${selfHealingResult.fix?.changes.length ?? 0} |\n\n` +
            `> ⚠️ This fix requires human review and approval before merging.`,
        );
      } else if (selfHealingResult.attempted) {
        logger.info(
          { issueKey: created.key, reason: selfHealingResult.reason },
          "self-healing attempted but did not produce a PR",
        );
      }
    } catch (error) {
      logger.warn({ err: error }, "self-healing stage failed");
      selfHealingResult = {
        attempted: true,
        success: false,
        reason: `Self-healing engine error: ${error}`,
        dryRun: config.selfHealing.dryRun ?? false,
      };
    }
  }

  const notifications = await maybeNotify(created.key, true);
  return {
    action: "created",
    issueKey: created.key,
    spec,
    ...(metrics !== undefined && { metrics }),
    ...(notifications !== undefined && { notifications }),
    ...(selfHealingResult !== undefined && { selfHealing: selfHealingResult }),
  };
}

function buildNotificationPayload(
  ctx: EnrichmentContext,
  issueKey: string,
  isNewTicket: boolean,
  jiraBaseUrl: string,
): NotificationPayload {
  return {
    title: (ctx.fields.summary as string) ?? "Pipeline failure",
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
