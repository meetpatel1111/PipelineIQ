import { pino, type Logger } from "pino";
import type { FailureEvent, PipelineIQConfig } from "./types/index.js";
import { createEnhancedJiraClient, type EnhancedJiraClient } from "./jira/index.js";
import { NotificationService } from "./notifications/index.js";
import { computeDedupSignature } from "./dedup.js";

export type ResolveResult = {
  action: "resolved" | "noop";
  resolvedKeys: string[];
  message: string;
};

export type ResolveOptions = {
  jiraClient?: EnhancedJiraClient;
  logger?: Logger;
  failureCategories?: string[];
};

/**
 * Automatically transitions open Jira incident tickets to "Done" / "Resolved"
 * when a pipeline succeeds on a retry or subsequent commit.
 */
export async function resolvePipelineSuccess(
  event: FailureEvent,
  config: PipelineIQConfig,
  options: ResolveOptions = {},
): Promise<ResolveResult> {
  const logger = options.logger ?? pino({ level: "info" });
  if (config.dedup.autoResolveOnSuccess === false) {
    logger.info("autoResolveOnSuccess is disabled — skipping resolution");
    return { action: "noop", resolvedKeys: [], message: "autoResolveOnSuccess is disabled" };
  }

  const jira = options.jiraClient ?? createEnhancedJiraClient(config.jira, config.jiraCustomFields);
  const projectKey = config.jiraProject;
  const resolveTransition = config.dedup.resolveTransition || "Done";

  // Build candidate signatures across common failure categories to find matching open tickets
  const categoriesToCheck = options.failureCategories ?? [
    "Test", "Build", "Dependency", "Infrastructure", "Deployment", "Unknown"
  ];

  const candidateSignatures = new Set<string>();
  for (const cat of categoriesToCheck) {
    candidateSignatures.add(computeDedupSignature(event, cat as any));
  }

  const sigConditions = Array.from(candidateSignatures)
    .map((sig) => `labels = "piq-sig:${sig}"`)
    .join(" OR ");

  const jql = `project = "${projectKey}" AND (${sigConditions}) AND resolution = Unresolved`;
  logger.info({ jql }, "Searching for open incident tickets to auto-resolve");

  let searchResult: { issues: any[] };
  try {
    searchResult = await jira.advancedSearch(jql, {
      maxResults: 20,
      fields: ["key", "status", "summary", "labels"],
    });
  } catch (searchError) {
    logger.warn({ err: searchError }, "Failed to query Jira for open incident tickets");
    return { action: "noop", resolvedKeys: [], message: `Jira search failed: ${searchError}` };
  }

  const openIssues = searchResult.issues ?? [];
  if (openIssues.length === 0) {
    logger.info("No matching open incident tickets found to auto-resolve");
    return { action: "noop", resolvedKeys: [], message: "No matching open incidents found" };
  }

  const resolvedKeys: string[] = [];
  const runIdentifier = event.pipeline.runNumber ?? event.pipeline.runId;
  const commitSnippet = event.commit.sha ? ` (Commit ${event.commit.sha.slice(0, 7)})` : "";

  for (const issue of openIssues) {
    const issueKey = issue.key;
    logger.info({ issueKey, status: issue.fields?.status?.name }, "Auto-resolving open issue");

    try {
      // 1. Add resolution comment
      const comment = [
        `✅ *Pipeline Succeeded — Incident Auto-Resolved*`,
        `Pipeline *${event.pipeline.name}* succeeded on branch \`${event.branch}\` at Run #${runIdentifier}${commitSnippet}.`,
        `Direct Run URL: ${event.pipeline.url}`,
        `Automatically transitioning issue to *${resolveTransition}* and tagging as \`piq-resolved-by-retry\`.`,
      ].join("\n");
      await jira.addComment(issueKey, comment);

      // 2. Transition issue
      await jira.transitionIssue(issueKey, resolveTransition);

      // 3. Update labels to track flakiness / retry resolution
      const currentLabels: string[] = issue.fields?.labels ?? [];
      const updatedLabels = Array.from(new Set([...currentLabels, "piq-resolved-by-retry"]));
      await jira.updateIssue(issueKey, {
        summary: issue.fields?.summary ?? "Pipeline Failure",
        labels: updatedLabels,
      } as any);

      resolvedKeys.push(issueKey);
    } catch (transError) {
      logger.warn({ err: transError, issueKey }, "Failed to auto-resolve Jira issue");
    }
  }

  // Trigger notification if configured
  if (config.notifications && resolvedKeys.length > 0) {
    try {
      const service = new NotificationService(config.notifications);
      await service.send({
        title: `✅ Pipeline Succeeded: ${event.pipeline.name} (Resolved ${resolvedKeys.join(", ")})`,
        summary: `Pipeline succeeded at Run #${runIdentifier} on ${event.branch}. Auto-closed ${resolvedKeys.length} open incident(s).`,
        severity: "Low",
        priority: "Low",
        jiraKey: resolvedKeys.join(", "),
        jiraUrl: `${config.jira.baseUrl}/browse/${resolvedKeys[0]}`,
        repo: event.repository.name,
        pipeline: event.pipeline.name,
        branch: event.branch,
        isNewTicket: false,
      });
    } catch (notifErr) {
      logger.warn({ err: notifErr }, "Failed to dispatch resolution notification");
    }
  }

  return {
    action: resolvedKeys.length > 0 ? "resolved" : "noop",
    resolvedKeys,
    message: `Successfully resolved ${resolvedKeys.length} incident(s): ${resolvedKeys.join(", ")}`,
  };
}
