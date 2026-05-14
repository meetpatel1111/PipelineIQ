import { describe, it, expect, vi } from "vitest";
import { HistoryService } from "../history.js";
import type { EnhancedJiraClient } from "../enhanced-client.js";

function makeJira(issues: any[]): EnhancedJiraClient {
  return {
    advancedSearch: vi.fn().mockResolvedValue({ issues, total: issues.length }),
  } as unknown as EnhancedJiraClient;
}

describe("HistoryService.getMetrics()", () => {
  it("returns mttrHours averaged across resolved issues", async () => {
    const now = new Date();
    const issues = [
      {
        fields: {
          created: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          resolutiondate: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          labels: ["piq-repo:my-org/api"],
        },
      },
      {
        fields: {
          created: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          resolutiondate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          labels: ["piq-repo:my-org/api"],
        },
      },
    ];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123");

    expect(metrics.mttrHours).toBe(2);
    expect(metrics.sampleSize).toBe(2);
  });

  it("returns undefined mttrHours when no resolved issues", async () => {
    const service = new HistoryService(makeJira([]), "PIQ");
    const metrics = await service.getMetrics("abc123");

    expect(metrics.mttrHours).toBeUndefined();
    expect(metrics.sampleSize).toBe(0);
  });

  it("returns blastRadius when multiple distinct repos are affected", async () => {
    const now = new Date();
    const issues = [
      {
        fields: {
          created: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          resolutiondate: now.toISOString(),
          labels: ["piq-repo:my-org/api", "piq-repo:my-org/worker"],
        },
      },
    ];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123");

    expect(metrics.blastRadius).toBe(2);
  });

  it("returns undefined blastRadius when only one repo is affected", async () => {
    const now = new Date();
    const issues = [
      {
        fields: {
          created: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          resolutiondate: now.toISOString(),
          labels: ["piq-repo:my-org/api"],
        },
      },
    ];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123");

    expect(metrics.blastRadius).toBeUndefined();
  });

  it("queries only resolved issues (JQL contains 'resolution != Unresolved')", async () => {
    const jira = makeJira([]);
    const service = new HistoryService(jira, "PIQ");
    await service.getMetrics("abc123");

    const calledJql: string = (jira.advancedSearch as any).mock.calls[0][0];
    expect(calledJql).toContain("resolution != Unresolved");
  });

  it("returns sampleSize 0 and no mttrHours on Jira error", async () => {
    const jira = {
      advancedSearch: vi.fn().mockRejectedValue(new Error("Jira down")),
    } as unknown as EnhancedJiraClient;

    const service = new HistoryService(jira, "PIQ");
    const metrics = await service.getMetrics("abc123");

    expect(metrics.sampleSize).toBe(0);
    expect(metrics.mttrHours).toBeUndefined();
  });
});
