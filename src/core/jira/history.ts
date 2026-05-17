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

  async getMetrics(signature: string, windowDays: number = 30): Promise<ComputedMetrics> {
    // Only resolved tickets provide MTTR
    const jql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND resolution != Unresolved AND created >= -${windowDays}d ORDER BY created DESC`;

    try {
      const result = await this.jira.advancedSearch(jql, {
        maxResults: 50, // Increase sample for better metrics
        fields: ["created", "resolutiondate", "labels"],
      });

      const durations: number[] = [];
      const repoSet = new Set<string>();

      for (const issue of result.issues) {
        const created = new Date(issue.fields.created).getTime();
        const resolved = issue.fields.resolutiondate
          ? new Date(issue.fields.resolutiondate).getTime()
          : null;

        if (resolved !== null) {
          durations.push((resolved - created) / (1000 * 60 * 60));
        }

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
        sampleSize: result.total,
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
