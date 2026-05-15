import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendSlack } from "../slack.js";
import type { NotificationPayload, SlackConfig } from "../types.js";

const payload: NotificationPayload = {
  title: "npm install failed",
  summary: "npm ERESOLVE peer dep conflict",
  severity: "Critical",
  priority: "Highest",
  jiraKey: "PIQ-42",
  jiraUrl: "https://acme.atlassian.net/browse/PIQ-42",
  repo: "my-org/api",
  pipeline: "build-and-test",
  branch: "main",
  isNewTicket: true,
  metrics: { mttrHours: 3.5, blastRadius: 2 },
};

const config: SlackConfig = {
  webhookUrl: "https://hooks.slack.com/T123/B456/abc",
  includeMetrics: true,
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

describe("sendSlack", () => {
  it("POSTs to the webhookUrl", async () => {
    await sendSlack(payload, config);
    expect(fetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/T123/B456/abc",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns success: true on HTTP 200", async () => {
    const result = await sendSlack(payload, config);
    expect(result.success).toBe(true);
  });

  it("returns success: false with error on HTTP 4xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "Forbidden" }),
    );
    const result = await sendSlack(payload, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("403");
  });

  it("returns success: false when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const result = await sendSlack(payload, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  it("includes metrics row when includeMetrics is true", async () => {
    await sendSlack(payload, config);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    const allText = JSON.stringify(body);
    expect(allText).toContain("3.5");
    expect(allText).toContain("2 repos");
  });

  it("omits metrics row when includeMetrics is false", async () => {
    await sendSlack(payload, { ...config, includeMetrics: false });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    const allText = JSON.stringify(body);
    expect(allText).not.toContain("3.5");
  });

  it("uses 🔴 emoji for Critical severity", async () => {
    await sendSlack(payload, config);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("🔴");
  });

  it("respects channel override", async () => {
    await sendSlack(payload, { ...config, channel: "#incidents" });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.channel).toBe("#incidents");
  });
});
