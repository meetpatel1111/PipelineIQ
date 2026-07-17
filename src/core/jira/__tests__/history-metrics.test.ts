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
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.mttrHours).toBe(2);
    expect(metrics.sampleSize).toBe(2);
  });

  it("returns undefined mttrHours when no resolved issues", async () => {
    const service = new HistoryService(makeJira([]), "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.mttrHours).toBeUndefined();
    expect(metrics.sampleSize).toBe(0);
  });

  it("counts distinct repos (from the piq-fp query) as blast radius", async () => {
    const issues = [
      { fields: { labels: ["piq-repo:my-org/api"] } },
      { fields: { labels: ["piq-repo:my-org/worker"] } },
    ];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.blastRadius).toBe(2);
  });

  it("includes the current repo in blast radius even with no matching history", async () => {
    // One historical repo differs from the current repo → 2 distinct repos.
    const issues = [{ fields: { labels: ["piq-repo:my-org/api"] } }];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/web");

    expect(metrics.blastRadius).toBe(2);
  });

  it("returns undefined blastRadius when only one repo is affected", async () => {
    const issues = [{ fields: { labels: ["piq-repo:my-org/api"] } }];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.blastRadius).toBeUndefined();
  });

  it("queries MTTR by signature (resolved only) and blast radius by fingerprint", async () => {
    const jira = makeJira([]);
    const service = new HistoryService(jira, "PIQ");
    await service.getMetrics("sig123", "fp456", "my-org/api");

    const calls = (jira.advancedSearch as any).mock.calls;
    const mttrJql: string = calls[0][0];
    const blastJql: string = calls[1][0];

    expect(mttrJql).toContain('piq-sig:sig123');
    expect(mttrJql).toContain("resolution != Unresolved");
    expect(blastJql).toContain('piq-fp:fp456');
    expect(blastJql).not.toContain("resolution != Unresolved");
  });

  it("rounds MTTR to one decimal place correctly", async () => {
    const now = new Date();
    // Two issues: 1h and 1.1h duration = avg 1.05h → should be 1.1, not 1.0
    const issues = [
      {
        fields: {
          created: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          resolutiondate: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1h
          labels: [],
        },
      },
      {
        fields: {
          created: new Date(now.getTime() - 2.1 * 60 * 60 * 1000).toISOString(),
          resolutiondate: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1.1h
          labels: [],
        },
      },
    ];

    const service = new HistoryService(makeJira(issues), "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.mttrHours).toBe(1.1);
  });

  it("returns sampleSize 0 and no mttrHours on Jira error", async () => {
    const jira = {
      advancedSearch: vi.fn().mockRejectedValue(new Error("Jira down")),
    } as unknown as EnhancedJiraClient;

    const service = new HistoryService(jira, "PIQ");
    const metrics = await service.getMetrics("abc123", "fp123", "my-org/api");

    expect(metrics.sampleSize).toBe(0);
    expect(metrics.mttrHours).toBeUndefined();
  });
});
