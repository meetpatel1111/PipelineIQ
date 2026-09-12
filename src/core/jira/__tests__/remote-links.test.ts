import { describe, it, expect, vi } from "vitest";
import { registerPipelineRemoteLinks } from "../remote-links.js";
import type { FailureEvent } from "../../types/index.js";
import type { JiraClient } from "../client.js";

describe("registerPipelineRemoteLinks", () => {
  const event: FailureEvent = {
    source: "github",
    startedAt: "2026-09-13T00:00:00.000Z",
    failedAt: "2026-09-13T00:01:00.000Z",
    branch: "main",
    pipeline: {
      name: "Deploy Production",
      runId: "987654",
      runNumber: 120,
      url: "https://github.com/acme/app/actions/runs/987654",
    },
    failure: {
      errorMessage: "Deployment failed",
      logs: "",
      logsTruncated: false,
    },
    repository: {
      name: "app",
      owner: "acme",
      url: "https://github.com/acme/app",
    },
    commit: {
      sha: "1a2b3c4d5e6f",
      message: "feat: update stripe SDK",
      url: "https://github.com/acme/app/commit/1a2b3c4d5e6f",
    },
    pullRequest: {
      number: 44,
      title: "Stripe SDK Upgrade",
      url: "https://github.com/acme/app/pull/44",
      author: "dev",
    },
    metadata: {},
    explicitFields: [],
  };

  it("registers remote links for pipeline, pull request, and commit diff", async () => {
    const mockJiraClient = {
      createRemoteLink: vi.fn().mockResolvedValue(undefined),
    } as unknown as JiraClient;

    await registerPipelineRemoteLinks(mockJiraClient, "PROJ-100", event);

    expect(mockJiraClient.createRemoteLink).toHaveBeenCalledTimes(3);

    // 1. Pipeline run link
    expect(mockJiraClient.createRemoteLink).toHaveBeenCalledWith(
      "PROJ-100",
      "CI Run: Deploy Production #120",
      "https://github.com/acme/app/actions/runs/987654",
      "piq:run:987654"
    );

    // 2. Pull Request link
    expect(mockJiraClient.createRemoteLink).toHaveBeenCalledWith(
      "PROJ-100",
      "Pull Request #44: Stripe SDK Upgrade",
      "https://github.com/acme/app/pull/44",
      "piq:pr:44"
    );

    // 3. Commit link
    expect(mockJiraClient.createRemoteLink).toHaveBeenCalledWith(
      "PROJ-100",
      "Commit 1a2b3c4 — feat: update stripe SDK",
      "https://github.com/acme/app/commit/1a2b3c4d5e6f",
      "piq:commit:1a2b3c4d5e6f"
    );
  });

  it("handles remote link creation errors gracefully without throwing", async () => {
    const mockJiraClient = {
      createRemoteLink: vi.fn().mockRejectedValue(new Error("Remote links disabled")),
    } as unknown as JiraClient;

    await expect(
      registerPipelineRemoteLinks(mockJiraClient, "PROJ-100", event)
    ).resolves.not.toThrow();
  });
});
