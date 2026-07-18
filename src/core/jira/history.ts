import type { EnhancedJiraClient } from "./enhanced-client.js";
import type { FailureEvent, FailureCategory, ComputedMetrics } from "../types/index.js";

export type FailureHistory = {
  similarCount: number;
  isFlaky: boolean;
  previousIncidentKeys: string[];
  lastOccurred?: Date | undefined;
  trend: "improving" | "worsening" | "stable";
  relatedKeys: string[];
};

/**
 * HistoryService — analyzes past incidents to provide context for the current failure.
 * Uses the dedup signature to find identical failures across time.
 */
export class HistoryService {
  constructor(private jira: EnhancedJiraClient, private projectKey: string) {}

  /**
   * Get failure history for a specific signature
   */
  async getHistory(signature: string, windowDays: number = 30): Promise<FailureHistory> {
    const jql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND created >= -${windowDays}d ORDER BY created DESC`;
    
    const result = await this.jira.advancedSearch(jql, {
      maxResults: 50,
      fields: ["created", "status", "resolution"],
    });

    const issues = result.issues;
    const keys = issues.map((i: any) => i.key);
    
    // Simple flakiness heuristic: if it failed, then succeeded (resolved), then failed again.
    // Since we only have failure events here, we look at the resolution state of past failures.
    // If many past failures were resolved quickly, it might be a flaky test or transient infra.
    const resolvedCount = issues.filter((i: any) => i.fields.resolution !== null).length;
    
    return {
      similarCount: result.total,
      isFlaky: result.total > 2 && resolvedCount > 0,
      previousIncidentKeys: keys,
      lastOccurred: issues.length > 0 ? new Date(issues[0].fields.created) : undefined,
      trend: this.calculateTrend(issues),
      relatedKeys: [],
    };
  }

  /**
   * Search for related incidents using fuzzy keyword matching (JQL ~ operator)
   */
  async searchRelatedByKeywords(keywords: string[], windowDays: number = 30): Promise<string[]> {
    if (keywords.length === 0) return [];

    // Filter out very short or generic keywords to avoid noisy results
    const cleanKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 5 && !k.includes(" "))
      .slice(0, 3); // Limit to top 3 for precision

    if (cleanKeywords.length === 0) return [];

    const keywordQuery = cleanKeywords.map(k => `text ~ "${k}"`).join(" OR ");
    const jql = `project = "${this.projectKey}" AND (${keywordQuery}) AND created >= -${windowDays}d ORDER BY created DESC`;

    try {
      const result = await this.jira.advancedSearch(jql, { maxResults: 5 });
      return result.issues.map((i: any) => i.key);
    } catch (error) {
      console.warn(`[PipelineIQ] Keyword search failed: ${error}`);
      return [];
    }
  }

  /**
   * Compute MTTR and blast radius from Jira history.
   *
   * These use different keys on purpose:
   *   - MTTR      → the per-repo dedup `signature` (how long THIS exact failure takes
   *                 to resolve in THIS repo). Resolved tickets only.
   *   - Blast radius → the repo-independent `fingerprint` (how many DISTINCT repos this
   *                 class of failure touches). All tickets in the window, plus the current
   *                 repo, since its ticket does not exist in Jira yet at enrichment time.
   */
  async getMetrics(
    signature: string,
    fingerprint: string,
    currentRepo: string,
    windowDays: number = 30,
  ): Promise<ComputedMetrics> {
    const mttrJql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND resolution != Unresolved AND created >= -${windowDays}d ORDER BY created DESC`;
    const blastJql = `project = "${this.projectKey}" AND labels = "piq-fp:${fingerprint}" AND created >= -${windowDays}d`;

    try {
      const [mttrResult, blastResult] = await Promise.all([
        this.jira.advancedSearch(mttrJql, {
          maxResults: 50, // Increase sample for better metrics
          fields: ["created", "resolutiondate"],
        }),
        this.jira.advancedSearch(blastJql, {
          maxResults: 100,
          fields: ["labels"],
        }),
      ]);

      const durations: number[] = [];
      for (const issue of mttrResult.issues) {
        const created = new Date(issue.fields.created).getTime();
        const resolved = issue.fields.resolutiondate
          ? new Date(issue.fields.resolutiondate).getTime()
          : null;
        if (resolved !== null) {
          durations.push((resolved - created) / (1000 * 60 * 60));
        }
      }

      const repoSet = new Set<string>([currentRepo]);
      for (const issue of blastResult.issues) {
        const labels: string[] = issue.fields.labels ?? [];
        for (const label of labels) {
          if (label.startsWith("piq-repo:")) {
            repoSet.add(label.slice("piq-repo:".length));
          }
        }
      }

      const avg = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : undefined;
      const mttrHours = avg !== undefined ? parseFloat(avg.toFixed(1)) : undefined;

      return {
        ...(mttrHours !== undefined && { mttrHours }),
        ...(repoSet.size > 1 && { blastRadius: repoSet.size }),
        sampleSize: mttrResult.total,
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Metrics computation failed: ${error}`);
      return { sampleSize: 0 };
    }
  }

  private calculateTrend(issues: any[]): "improving" | "worsening" | "stable" {
    if (issues.length < 5) return "stable";
    
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    // Compare frequency: last 7 days vs 7-14 days ago
    const recentWeek = issues.filter(i => {
      const created = new Date(i.fields.created).getTime();
      return created > now - weekMs;
    }).length;
    
    const priorWeek = issues.filter(i => {
      const created = new Date(i.fields.created).getTime();
      return created <= now - weekMs && created > now - 2 * weekMs;
    }).length;
    
    // Heuristic for trend shift
    if (recentWeek > priorWeek + 1) return "worsening";
    if (recentWeek < priorWeek - 1 && priorWeek > 0) return "improving";
    return "stable";
  }
}
