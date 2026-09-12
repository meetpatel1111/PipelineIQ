import type { JiraClient } from "./client.js";
import type { FailureEvent } from "../types/index.js";

export interface RemoteLinkOptions {
  logger?: {
    warn: (obj: any, msg?: string) => void;
    info?: (obj: any, msg?: string) => void;
  };
}

/**
 * Automatically registers native Jira Remote Issue Links for CI/CD runs, Pull Requests, and Commits.
 * These appear directly in Jira's web links and development panel.
 */
export async function registerPipelineRemoteLinks(
  jira: JiraClient,
  issueKey: string,
  event: FailureEvent,
  options: RemoteLinkOptions = {}
): Promise<void> {
  const logWarn = options.logger?.warn ?? ((obj: any, msg?: string) => console.warn(msg || "PipelineIQ warning", obj));

  // 1. CI Pipeline Run Link
  if (event.pipeline?.url) {
    try {
      const runNumber = event.pipeline.runNumber ?? event.pipeline.runId;
      const title = `CI Run: ${event.pipeline.name || "Pipeline"}${runNumber ? ` #${runNumber}` : ""}`;
      const globalId = event.pipeline.runId ? `piq:run:${event.pipeline.runId}` : undefined;
      await jira.createRemoteLink(issueKey, title, event.pipeline.url, globalId);
    } catch (err) {
      logWarn({ err, issueKey }, "Failed to create CI pipeline remote link in Jira");
    }
  }

  // 2. Pull Request Link
  const pr = event.pullRequest || (event.repository as any)?.pullRequest;
  if (pr?.url) {
    try {
      const title = `Pull Request #${pr.number}${pr.title ? `: ${pr.title}` : ""}`;
      const globalId = `piq:pr:${pr.number}`;
      await jira.createRemoteLink(issueKey, title, pr.url, globalId);
    } catch (err) {
      logWarn({ err, issueKey }, "Failed to create PR remote link in Jira");
    }
  }

  // 3. Commit Diff Link
  const commit = event.commit || (event.repository as any)?.commit;
  if (commit?.url && commit.sha) {
    try {
      const shortSha = commit.sha.slice(0, 7);
      const title = `Commit ${shortSha}${commit.message ? ` — ${commit.message.split("\n")[0]}` : ""}`;
      const globalId = `piq:commit:${commit.sha}`;
      await jira.createRemoteLink(issueKey, title, commit.url, globalId);
    } catch (err) {
      logWarn({ err, issueKey }, "Failed to create commit remote link in Jira");
    }
  }
}
