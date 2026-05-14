import { describe, it, expect } from "vitest";
import { AIConfigSchema, PipelineIQConfigSchema } from "../config.js";

describe("AIConfigSchema", () => {
  it('accepts "local" as a provider', () => {
    const result = AIConfigSchema.safeParse({ mode: "full", provider: "local", endpoint: "http://localhost:11434/v1", model: "llama3.2" });
    expect(result.success).toBe(true);
  });

  it("stores endpoint field", () => {
    const cfg = AIConfigSchema.parse({ mode: "full", provider: "local", endpoint: "http://localhost:11434/v1", model: "llama3.2" });
    expect(cfg.endpoint).toBe("http://localhost:11434/v1");
  });
});

describe("PipelineIQConfigSchema - notifications", () => {
  const base = { jira: { baseUrl: "https://acme.atlassian.net", email: "a@b.com", apiToken: "tok" }, jiraProject: "PIQ" };

  it("accepts config without notifications (backward compat)", () => {
    expect(PipelineIQConfigSchema.safeParse(base).success).toBe(true);
  });

  it("accepts slack-only notifications config", () => {
    const result = PipelineIQConfigSchema.safeParse({ ...base, notifications: { slack: { webhookUrl: "https://hooks.slack.com/T123/B456/abc" } } });
    expect(result.success).toBe(true);
  });

  it("accepts teams-only notifications config", () => {
    const result = PipelineIQConfigSchema.safeParse({ ...base, notifications: { teams: { webhookUrl: "https://outlook.office.com/webhook/xxx" } } });
    expect(result.success).toBe(true);
  });

  it("accepts notifyOn severity filter", () => {
    const result = PipelineIQConfigSchema.safeParse({ ...base, notifications: { slack: { webhookUrl: "https://hooks.slack.com/T123", notifyOn: ["critical", "high"] } } });
    expect(result.success).toBe(true);
  });

  it("rejects notifyOn with invalid severity", () => {
    const result = PipelineIQConfigSchema.safeParse({ ...base, notifications: { slack: { webhookUrl: "https://hooks.slack.com/T123", notifyOn: ["emergency"] } } });
    expect(result.success).toBe(false);
  });
});
