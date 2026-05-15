import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationService } from "../index.js";
import type { NotificationPayload } from "../types.js";

const payload: NotificationPayload = {
  title: "Build failed",
  severity: "Critical",
  priority: "Highest",
  jiraKey: "PIQ-1",
  jiraUrl: "https://acme.atlassian.net/browse/PIQ-1",
  repo: "org/repo",
  pipeline: "ci",
  branch: "main",
  isNewTicket: true,
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: async () => "ok" }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationService.send()", () => {
  it("returns empty result when enabled is false", async () => {
    const service = new NotificationService({ enabled: false, slack: { webhookUrl: "https://hooks.slack.com/x" } });
    const result = await service.send(payload);
    expect(result.slack).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends to slack when configured", async () => {
    const service = new NotificationService({
      slack: { webhookUrl: "https://hooks.slack.com/T123" },
    });
    const result = await service.send(payload);
    expect(result.slack?.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends to teams when configured", async () => {
    const service = new NotificationService({
      teams: { webhookUrl: "https://outlook.office.com/webhook/x" },
    });
    const result = await service.send(payload);
    expect(result.teams?.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends to both channels in parallel when both configured", async () => {
    const service = new NotificationService({
      slack: { webhookUrl: "https://hooks.slack.com/T123" },
      teams: { webhookUrl: "https://outlook.office.com/webhook/x" },
    });
    const result = await service.send(payload);
    expect(result.slack?.success).toBe(true);
    expect(result.teams?.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("skips slack when severity is not in notifyOn", async () => {
    const service = new NotificationService({
      slack: {
        webhookUrl: "https://hooks.slack.com/T123",
        notifyOn: ["Critical"],
      },
    });
    const lowPayload = { ...payload, severity: "Low" };
    const result = await service.send(lowPayload);
    expect(result.slack).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends when severity matches notifyOn filter", async () => {
    const service = new NotificationService({
      slack: {
        webhookUrl: "https://hooks.slack.com/T123",
        notifyOn: ["Critical", "High"],
      },
    });
    const result = await service.send(payload); // severity is "Critical"
    expect(result.slack?.success).toBe(true);
  });

  it("captures slack error without throwing when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const service = new NotificationService({
      slack: { webhookUrl: "https://hooks.slack.com/T123" },
    });
    const result = await service.send(payload);
    expect(result.slack?.success).toBe(false);
    expect(result.slack?.error).toContain("timeout");
  });

  it("one channel failure does not prevent the other from sending", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (url.includes("slack")) throw new Error("Slack down");
      return { ok: true, text: async () => "" };
    }));

    const service = new NotificationService({
      slack: { webhookUrl: "https://hooks.slack.com/T123" },
      teams: { webhookUrl: "https://outlook.office.com/webhook/x" },
    });
    const result = await service.send(payload);

    expect(result.slack?.success).toBe(false);
    expect(result.teams?.success).toBe(true);
    expect(callCount).toBe(2);
  });
});
