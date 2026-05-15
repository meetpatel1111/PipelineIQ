import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendTeams } from "../teams.js";
import type { NotificationPayload, TeamsConfig } from "../types.js";

const payload: NotificationPayload = {
  title: "Docker pull failed",
  summary: "ImagePullBackOff on k8s node",
  severity: "High",
  priority: "High",
  jiraKey: "PIQ-99",
  jiraUrl: "https://acme.atlassian.net/browse/PIQ-99",
  repo: "my-org/worker",
  pipeline: "deploy-prod",
  branch: "main",
  isNewTicket: false,
  dedupCount: 4,
  metrics: { mttrHours: 1.5 },
};

const config: TeamsConfig = {
  webhookUrl: "https://outlook.office.com/webhook/xxx",
  includeMetrics: true,
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: async () => "" }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendTeams", () => {
  it("POSTs to the webhookUrl", async () => {
    await sendTeams(payload, config);
    expect(fetch).toHaveBeenCalledWith(
      "https://outlook.office.com/webhook/xxx",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns success: true on HTTP 200", async () => {
    const result = await sendTeams(payload, config);
    expect(result.success).toBe(true);
  });

  it("returns success: false on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "Error" }),
    );
    const result = await sendTeams(payload, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });

  it("returns success: false when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS failure")));
    const result = await sendTeams(payload, config);
    expect(result.success).toBe(false);
  });

  it("includes MTTR fact when includeMetrics is true", async () => {
    await sendTeams(payload, config);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    const allText = JSON.stringify(body);
    expect(allText).toContain("1.5");
  });

  it("omits metrics facts when includeMetrics is false", async () => {
    await sendTeams(payload, { ...config, includeMetrics: false });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(JSON.stringify(body)).not.toContain("MTTR");
  });

  it("shows dedupCount in existing ticket label", async () => {
    await sendTeams(payload, config);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain("4");
  });
});
