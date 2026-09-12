import { describe, it, expect, vi } from "vitest";
import { processFailureEvent } from "../pipeline.js";
import { PipelineIQConfigSchema } from "../types/config.js";
import type { FailureEvent } from "../types/index.js";
import type { JiraClient } from "../jira/client.js";
import type { EnhancedJiraClient } from "../jira/enhanced-client.js";

describe("pipeline.ts - Contextual Issue Linking and Remote Links", () => {
  const config = PipelineIQConfigSchema.parse({
    jira: {
      baseUrl: "https://acme.atlassian.net",
      email: "bot@acme.com",
      apiToken: "secret",
    },
    jiraProject: "DEVOPS",
    ai: { mode: "disabled" },
    dedup: { enabled: false }, // Force new ticket creation
    linkReferencedIssues: true,
    referencedIssueLinkType: "Blocks",
    commentOnReferencedIssues: true,
    createRemoteLinks: true,
  });

  const event: FailureEvent = {
    source: "github",
    startedAt: "2026-09-13T00:00:00.000Z",
    failedAt: "2026-09-13T00:01:00.000Z",
    branch: "feat/PAY-100-stripe-webhook",
    pipeline: {
      name: "Build & Test",
      runId: "5544",
      runNumber: 12,
      url: "https://github.com/acme/app/actions/runs/5544",
    },
    failure: {
      errorMessage: "Webhook validation failed",
      logs: "Error: Webhook validation failed",
      logsTruncated: false,
    },
    repository: {
      name: "app",
      owner: "acme",
      url: "https://github.com/acme/app",
    },
    commit: {
      sha: "deadbeef1234",
      message: "fix(webhook): address PAY-100 race condition",
      url: "https://github.com/acme/app/commit/deadbeef1234",
    },
    pullRequest: {
      number: 88,
      title: "[PAY-100] Webhook fix",
      url: "https://github.com/acme/app/pull/88",
      author: "developer",
    },
    metadata: {},
    explicitFields: [],
  };

  it("links newly created incident to referenced developer story and posts cross-reference comment", async () => {
    const mockJira = {
      createIssue: vi.fn().mockResolvedValue({ id: "999", key: "DEVOPS-999" }),
      findBySignature: vi.fn().mockResolvedValue(null),
      createRemoteLink: vi.fn().mockResolvedValue(undefined),
      linkIssues: vi.fn().mockResolvedValue(undefined),
      addComment: vi.fn().mockResolvedValue(undefined),
      getIssue: vi.fn().mockResolvedValue({
        fields: {
          assignee: { accountId: "dev-account-123" },
        },
      }),
      assignIssue: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnhancedJiraClient;

    const result = await processFailureEvent(event, config, { jiraClient: mockJira });

    expect(result.action).toBe("created");
    if (result.action === "created") {
      expect(result.issueKey).toBe("DEVOPS-999");
    }

    // Verify remote links were registered
    expect(mockJira.createRemoteLink).toHaveBeenCalledWith(
      "DEVOPS-999",
      "CI Run: Build & Test #12",
      "https://github.com/acme/app/actions/runs/5544",
      "piq:run:5544"
    );

    // Verify bidirectional link was created to PAY-100
    expect(mockJira.linkIssues).toHaveBeenCalledWith(
      "DEVOPS-999",
      "PAY-100",
      "Blocks"
    );

    // Verify notification comment was posted on developer's ticket PAY-100
    expect(mockJira.addComment).toHaveBeenCalledWith(
      "PAY-100",
      expect.stringContaining("CI/CD pipeline **Build & Test** failed on branch `feat/PAY-100-stripe-webhook`")
    );

    // Verify assignee was adopted from PAY-100
    expect(mockJira.assignIssue).toHaveBeenCalledWith(
      "DEVOPS-999",
      "dev-account-123"
    );
  });

  it("registers remote links and links referenced issues on deduplicated issue updates", async () => {
    const dedupConfig = PipelineIQConfigSchema.parse({
      ...config,
      dedup: { enabled: true, windowHours: 24 },
    });

    const mockJira = {
      findBySignature: vi.fn().mockResolvedValue({
        id: "888",
        key: "DEVOPS-888",
        fields: {
          status: { name: "Open" },
          created: new Date().toISOString(),
        },
      }),
      addComment: vi.fn().mockResolvedValue(undefined),
      createRemoteLink: vi.fn().mockResolvedValue(undefined),
      linkIssues: vi.fn().mockResolvedValue(undefined),
      getIssue: vi.fn().mockResolvedValue({
        fields: {
          assignee: { accountId: "dev-account-456" },
        },
      }),
      assignIssue: vi.fn().mockResolvedValue(undefined),
    } as unknown as EnhancedJiraClient;

    const result = await processFailureEvent(event, dedupConfig, { jiraClient: mockJira });

    expect(result.action).toBe("updated");
    if (result.action === "updated") {
      expect(result.issueKey).toBe("DEVOPS-888");
    }

    // Verify remote links were registered for the recurring run
    expect(mockJira.createRemoteLink).toHaveBeenCalledWith(
      "DEVOPS-888",
      "CI Run: Build & Test #12",
      "https://github.com/acme/app/actions/runs/5544",
      "piq:run:5544"
    );

    // Verify bidirectional link was created to PAY-100
    expect(mockJira.linkIssues).toHaveBeenCalledWith(
      "DEVOPS-888",
      "PAY-100",
      "Blocks"
    );
  });
});

