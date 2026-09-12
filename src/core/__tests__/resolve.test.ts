import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolvePipelineSuccess } from "../resolve.js";
import { PipelineIQConfigSchema, type FailureEvent, type PipelineIQConfig } from "../types/index.js";
import type { EnhancedJiraClient } from "../jira/enhanced-client.js";

describe("resolvePipelineSuccess", () => {
  const dummyEvent: FailureEvent = {
    source: "github",
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
    repository: {
      owner: "test-owner",
      name: "test-repo",
      url: "https://github.com/test-owner/test-repo",
    },
    branch: "main",
    commit: {
      sha: "abcdef1234567890",
      url: "https://github.com/test-owner/test-repo/commit/abcdef1234567890",
      message: "fix: resolve failing test",
    },
    pipeline: {
      name: "CI Pipeline",
      url: "https://github.com/test-owner/test-repo/actions/runs/999",
      runId: "999",
      runNumber: 42,
    },
    explicitFields: [],
    metadata: {},
    failure: {
      logs: "All tests passed successfully",
      logsTruncated: false,
    },
  };

  const baseConfig: PipelineIQConfig = PipelineIQConfigSchema.parse({
    jira: {
      type: "cloud",
      baseUrl: "https://example.atlassian.net",
      email: "ci@example.com",
      apiToken: "secret-token",
    },
    jiraProject: "PROJ",
    issueType: "Bug",
    dedup: {
      enabled: true,
      autoResolveOnSuccess: true,
      resolveTransition: "Done",
    },
  });

  let mockJira: Partial<EnhancedJiraClient>;

  beforeEach(() => {
    mockJira = {
      advancedSearch: vi.fn(),
      addComment: vi.fn().mockResolvedValue(undefined),
      transitionIssue: vi.fn().mockResolvedValue(undefined),
      updateIssue: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("skips resolution when autoResolveOnSuccess is false", async () => {
    const config: PipelineIQConfig = {
      ...baseConfig,
      dedup: {
        ...baseConfig.dedup,
        autoResolveOnSuccess: false,
      },
    };

    const result = await resolvePipelineSuccess(dummyEvent, config, {
      jiraClient: mockJira as EnhancedJiraClient,
    });

    expect(result.action).toBe("noop");
    expect(result.resolvedKeys).toEqual([]);
    expect(mockJira.advancedSearch).not.toHaveBeenCalled();
  });

  it("returns noop when no matching open incidents are found", async () => {
    (mockJira.advancedSearch as any).mockResolvedValue({ issues: [], total: 0 });

    const result = await resolvePipelineSuccess(dummyEvent, baseConfig, {
      jiraClient: mockJira as EnhancedJiraClient,
    });

    expect(result.action).toBe("noop");
    expect(result.resolvedKeys).toEqual([]);
    expect(mockJira.advancedSearch).toHaveBeenCalledTimes(1);
    expect(mockJira.transitionIssue).not.toHaveBeenCalled();
  });

  it("auto-resolves matching open incidents, transitions them and adds retry label", async () => {
    (mockJira.advancedSearch as any).mockResolvedValue({
      issues: [
        {
          key: "PROJ-101",
          fields: {
            summary: "CI failure in build step",
            status: { name: "Open" },
            labels: ["piq-sig:abc123", "pipelineiq"],
          },
        },
        {
          key: "PROJ-102",
          fields: {
            summary: "Flaky test failure",
            status: { name: "In Progress" },
            labels: ["piq-sig:def456"],
          },
        },
      ],
      total: 2,
    });

    const result = await resolvePipelineSuccess(dummyEvent, baseConfig, {
      jiraClient: mockJira as EnhancedJiraClient,
    });

    expect(result.action).toBe("resolved");
    expect(result.resolvedKeys).toEqual(["PROJ-101", "PROJ-102"]);

    // Added resolution comment to both
    expect(mockJira.addComment).toHaveBeenCalledTimes(2);
    expect(mockJira.addComment).toHaveBeenCalledWith(
      "PROJ-101",
      expect.stringContaining("✅ *Pipeline Succeeded — Incident Auto-Resolved*"),
    );

    // Transitioned to "Done"
    expect(mockJira.transitionIssue).toHaveBeenCalledWith("PROJ-101", "Done");
    expect(mockJira.transitionIssue).toHaveBeenCalledWith("PROJ-102", "Done");

    // Tagged with piq-resolved-by-retry
    expect(mockJira.updateIssue).toHaveBeenCalledWith(
      "PROJ-101",
      expect.objectContaining({
        labels: expect.arrayContaining(["piq-sig:abc123", "pipelineiq", "piq-resolved-by-retry"]),
      }),
    );
    expect(mockJira.updateIssue).toHaveBeenCalledWith(
      "PROJ-102",
      expect.objectContaining({
        labels: expect.arrayContaining(["piq-sig:def456", "piq-resolved-by-retry"]),
      }),
    );
  });

  it("respects custom transition name from config", async () => {
    (mockJira.advancedSearch as any).mockResolvedValue({
      issues: [
        {
          key: "PROJ-105",
          fields: {
            summary: "Failure",
            status: { name: "Open" },
            labels: [],
          },
        },
      ],
      total: 1,
    });

    const config: PipelineIQConfig = {
      ...baseConfig,
      dedup: {
        ...baseConfig.dedup,
        resolveTransition: "Resolved",
      },
    };

    const result = await resolvePipelineSuccess(dummyEvent, config, {
      jiraClient: mockJira as EnhancedJiraClient,
    });

    expect(result.action).toBe("resolved");
    expect(mockJira.transitionIssue).toHaveBeenCalledWith("PROJ-105", "Resolved");
  });

  it("handles transition errors gracefully without failing other tickets", async () => {
    (mockJira.advancedSearch as any).mockResolvedValue({
      issues: [
        { key: "PROJ-FAIL", fields: { summary: "Fails transition", labels: [] } },
        { key: "PROJ-OK", fields: { summary: "Succeeds transition", labels: [] } },
      ],
      total: 2,
    });

    (mockJira.transitionIssue as any).mockImplementation((key: string) => {
      if (key === "PROJ-FAIL") {
        throw new Error("Transition Done not available in current workflow step");
      }
      return Promise.resolve();
    });

    const result = await resolvePipelineSuccess(dummyEvent, baseConfig, {
      jiraClient: mockJira as EnhancedJiraClient,
    });

    expect(result.action).toBe("resolved");
    expect(result.resolvedKeys).toEqual(["PROJ-OK"]);
  });
});
