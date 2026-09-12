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
import { findReferencedIssueKeys } from "./jira/key-extractor.js";
import { registerPipelineRemoteLinks } from "./jira/remote-links.js";
import { extractReleaseVersions, matchJiraVersion } from "./jira/version-extractor.js";

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

  // Release Version / FixVersion synchronization from branch or tag
  if (config.syncReleaseVersions !== false) {
    const candidateVersions = extractReleaseVersions(event.branch, config.releaseVersionPattern);
    if (candidateVersions.length > 0) {
      try {
        const projectVersions = await (jira as EnhancedJiraClient).getProjectVersions(config.jiraProject);
        let matched = matchJiraVersion(candidateVersions, projectVersions);
        if (!matched && config.autoCreateReleaseVersions && candidateVersions[0]) {
          const createdVer = await (jira as EnhancedJiraClient).createProjectVersion(config.jiraProject, candidateVersions[0]);
          if (createdVer) {
            matched = createdVer.name;
          }
        }
        if (matched) {
          ctx.fields.fixVersions = [matched];
          ctx.fields.affectsVersions = [matched];
          logger.info({ fixVersion: matched }, "associated Jira release fixVersion");
        }
      } catch (verErr) {
        logger.debug({ verErr }, "failed to sync project release version");
      }
    }
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
  let closedDuplicateKey: string | undefined;
  let closedDuplicateStatus: string | undefined;

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
        closedDuplicateKey = existing.key;
        closedDuplicateStatus = existing.status;
        // Continue to creation block, and link the newly created ticket to this closed ticket
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

        // Register native Jira remote links (pipeline, PR, commit)
        if (config.createRemoteLinks !== false) {
          await registerPipelineRemoteLinks(jira, existing.key, event, { logger });
        }

        // Link to referenced developer issues on recurrence if not already linked
        if (config.linkReferencedIssues !== false) {
          const referencedKeys = findReferencedIssueKeys(event, config.jiraProject);
          for (const refKey of referencedKeys) {
            try {
              const linkType = config.referencedIssueLinkType || "Blocks";
              await (jira as EnhancedJiraClient).linkIssues(existing.key, refKey, linkType);
              logger.info({ existingKey: existing.key, refKey, linkType }, "linked recurring incident to referenced issue");
            } catch (linkErr) {
              logger.debug({ linkErr, existingKey: existing.key, refKey }, "failed to link referenced issue on recurrence");
            }
          }
        }

        let selfHealingResult: SelfHealingResult | undefined;
        if (config.selfHealing?.enabled && config.selfHealing.healOnRecurrence !== false) {
          selfHealingResult = await maybeRunSelfHealing(existing.key);
        }

        const notifications = await maybeNotify(existing.key, false);
        return {
          action: "updated",
          issueKey: existing.key,
          spec,
          ...(metrics !== undefined && { metrics }),
          ...(notifications !== undefined && { notifications }),
          ...(selfHealingResult !== undefined && { selfHealing: selfHealingResult }),
        };
      }
    }
  }

  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");

  // Register native Jira remote links (pipeline, PR, commit)
  if (config.createRemoteLinks !== false) {
    await registerPipelineRemoteLinks(jira, created.key, event, { logger });
  }

  // Bidirectional linking to developer tickets referenced in branch, commit, or PR
  if (config.linkReferencedIssues !== false) {
    const referencedKeys = findReferencedIssueKeys(event, config.jiraProject);
    for (const refKey of referencedKeys) {
      try {
        const linkType = config.referencedIssueLinkType || "Blocks";
        await (jira as EnhancedJiraClient).linkIssues(created.key, refKey, linkType);
        logger.info({ createdKey: created.key, refKey, linkType }, "linked incident to referenced issue");

        if (config.commentOnReferencedIssues !== false) {
          const runNumber = event.pipeline.runNumber ?? event.pipeline.runId;
          const incidentUrl = `${config.jira.baseUrl.replace(/\/+$/, "")}/browse/${created.key}`;
          const commentBody = `⚠️ CI/CD pipeline **${event.pipeline.name || "Pipeline"}** failed on branch \`${event.branch}\`${runNumber ? ` (Run #${runNumber})` : ""}.\nFailure incident: [${created.key}|${incidentUrl}]`;
          await jira.addComment(refKey, commentBody);
        }

        // Optionally adopt developer's assignee identity if incident ticket is unassigned
        if (config.assignFromReferencedIssue !== false && !spec.assignee) {
          try {
            const refIssue = await jira.getIssue(refKey);
            const refAssigneeId = refIssue?.fields?.assignee?.accountId ?? refIssue?.fields?.assignee?.name;
            if (refAssigneeId) {
              await jira.assignIssue(created.key, refAssigneeId);
              logger.info({ createdKey: created.key, assignee: refAssigneeId }, "assigned incident ticket to referenced issue owner");
            }
          } catch (assignErr) {
            logger.debug({ assignErr, refKey }, "could not adopt assignee from referenced issue");
          }
        }
      } catch (linkErr) {
        logger.warn({ linkErr, createdKey: created.key, refKey }, "failed to link referenced issue");
      }
    }
  }

  // If this was a "create-new" dedup hit, link to the old closed issue
  if (closedDuplicateKey) {
    try {
      await (jira as EnhancedJiraClient).linkIssues(created.key, closedDuplicateKey, "Relates");
      await jira.addComment(
        created.key,
        `ℹ️ This failure was previously tracked in ${closedDuplicateKey} (Status: ${closedDuplicateStatus ?? "Closed"}). A new ticket has been opened to track the fresh effort.`
      );
    } catch (e) {
      logger.warn({ err: e, closedDuplicateKey }, "failed to link new issue to previous one");
    }
  }

  if (config.autoWorklog && event.durationMs) {
    const seconds = Math.floor(event.durationMs / 1000);
    if (seconds > 0) {
      await (jira as EnhancedJiraClient).addWorklog(created.key, seconds, `Initial failure duration: ${seconds}s`);
    }
  }

  // ── Self-Healing: attempt autonomous fix ────────────────────────────────
  const selfHealingResult = await maybeRunSelfHealing(created.key);

  const notifications = await maybeNotify(created.key, true);
  return {
    action: "created",
    issueKey: created.key,
    spec,
    ...(metrics !== undefined && { metrics }),
    ...(notifications !== undefined && { notifications }),
    ...(selfHealingResult !== undefined && { selfHealing: selfHealingResult }),
  };

  async function maybeRunSelfHealing(targetIssueKey: string): Promise<SelfHealingResult | undefined> {
    if (!config.selfHealing?.enabled) return undefined;
    logger.info({ issueKey: targetIssueKey }, "self-healing enabled — attempting fix");
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
        jira as any,
      );

      const rootCause = (ctx.fields.rca as string) ?? "";
      const remediation = Array.isArray(ctx.fields.remediationSteps)
        ? (ctx.fields.remediationSteps as string[])
        : [];
      const category = (ctx.fields.category as string) ?? "Unknown";

      const result = await healEngine.attemptFix(
        event,
        rootCause,
        remediation,
        category,
        targetIssueKey,
        ctx.codeowners
      );

      if (result.success && result.prUrl) {
        logger.info(
          { issueKey: targetIssueKey, prUrl: result.prUrl },
          "self-healing PR created",
        );
      } else if (result.attempted) {
        logger.info(
          { issueKey: targetIssueKey, reason: result.reason },
          "self-healing attempted but did not produce a PR",
        );
      }
      return result;
    } catch (error) {
      logger.warn({ err: error }, "self-healing stage failed");
      return {
        attempted: true,
        success: false,
        reason: `Self-healing engine error: ${error}`,
        dryRun: config.selfHealing.dryRun ?? false,
      };
    }
  }
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
