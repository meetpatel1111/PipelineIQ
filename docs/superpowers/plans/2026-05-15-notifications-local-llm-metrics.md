# Notifications, Local LLM & Operational Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Slack/Teams post-ticket notifications, a working local LLM provider (Ollama/LM Studio/vLLM), and MTTR + blast-radius metrics — all optional, all configurable, no breaking changes.

**Architecture:** Three features plug into the existing enrichment pipeline at distinct points: `LocalAIProvider` completes the existing stub using the OpenAI SDK with a configurable `baseURL`; `HistoryService.getMetrics()` computes MTTR and blast radius from already-fetched Jira data; and `NotificationService` runs as a post-ticket stage in `pipeline.ts`, reading from `EnrichmentContext` and the Jira result. All additions are additive — callers with no config changes see identical behaviour.

**Tech Stack:** TypeScript, Vitest, OpenAI SDK (`openai` npm package — already a dependency), native `fetch` (Node 18+) for webhook delivery.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/core/types/config.ts` | Add `"local"` to provider enum + `endpoint?` field + `NotificationsConfigSchema` |
| Modify | `src/core/ai/providers.ts` | Implement `LocalAIProvider.generateInsights()` |
| Modify | `src/core/jira/history.ts` | Add `getMetrics()` method |
| Modify | `src/core/enrichers/types.ts` | Add `metrics?` to `EnrichmentContext` + define `ComputedMetrics` type |
| Modify | `src/core/enrichers/history.ts` | Call `getMetrics()`, write `ctx.metrics` |
| Modify | `src/core/renderer.ts` | Accept `metrics?` param, render MTTR + blast radius |
| Create | `src/core/notifications/types.ts` | `NotificationPayload`, `NotificationResult`, channel config types |
| Create | `src/core/notifications/slack.ts` | `sendSlack()` — Block Kit webhook sender |
| Create | `src/core/notifications/teams.ts` | `sendTeams()` — Adaptive Card webhook sender |
| Create | `src/core/notifications/index.ts` | `NotificationService` — orchestrates channels |
| Modify | `src/core/pipeline.ts` | Wire `ctx.metrics` into return value; call `NotificationService` after ticket creation |
| Modify | `src/core/index.ts` | Export new public types |
| Create | `src/core/types/__tests__/config.test.ts` | Config schema validation tests |
| Create | `src/core/ai/__tests__/local-provider.test.ts` | `LocalAIProvider` unit tests |
| Create | `src/core/jira/__tests__/history-metrics.test.ts` | `getMetrics()` unit tests |
| Create | `src/core/notifications/__tests__/slack.test.ts` | Slack sender tests |
| Create | `src/core/notifications/__tests__/teams.test.ts` | Teams sender tests |
| Create | `src/core/notifications/__tests__/service.test.ts` | `NotificationService` orchestration tests |
| Create | `src/core/__tests__/renderer-metrics.test.ts` | Renderer metrics section tests |

---

## Task 1: Config — local LLM endpoint + notifications schema

**Files:**
- Modify: `src/core/types/config.ts`
- Create: `src/core/types/__tests__/config.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/types/__tests__/config.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { AIConfigSchema, PipelineIQConfigSchema } from "../config.js";

describe("AIConfigSchema", () => {
  it('accepts "local" as a provider', () => {
    const result = AIConfigSchema.safeParse({
      mode: "full",
      provider: "local",
      endpoint: "http://localhost:11434/v1",
      model: "llama3.2",
    });
    expect(result.success).toBe(true);
  });

  it("stores endpoint field", () => {
    const cfg = AIConfigSchema.parse({
      mode: "full",
      provider: "local",
      endpoint: "http://localhost:11434/v1",
      model: "llama3.2",
    });
    expect(cfg.endpoint).toBe("http://localhost:11434/v1");
  });
});

describe("PipelineIQConfigSchema - notifications", () => {
  const base = {
    jira: { baseUrl: "https://acme.atlassian.net", email: "a@b.com", apiToken: "tok" },
    jiraProject: "PIQ",
  };

  it("accepts config without notifications (backward compat)", () => {
    expect(PipelineIQConfigSchema.safeParse(base).success).toBe(true);
  });

  it("accepts slack-only notifications config", () => {
    const result = PipelineIQConfigSchema.safeParse({
      ...base,
      notifications: { slack: { webhookUrl: "https://hooks.slack.com/T123/B456/abc" } },
    });
    expect(result.success).toBe(true);
  });

  it("accepts teams-only notifications config", () => {
    const result = PipelineIQConfigSchema.safeParse({
      ...base,
      notifications: { teams: { webhookUrl: "https://outlook.office.com/webhook/xxx" } },
    });
    expect(result.success).toBe(true);
  });

  it("accepts notifyOn severity filter", () => {
    const result = PipelineIQConfigSchema.safeParse({
      ...base,
      notifications: {
        slack: {
          webhookUrl: "https://hooks.slack.com/T123",
          notifyOn: ["critical", "high"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects notifyOn with invalid severity", () => {
    const result = PipelineIQConfigSchema.safeParse({
      ...base,
      notifications: {
        slack: { webhookUrl: "https://hooks.slack.com/T123", notifyOn: ["emergency"] },
      },
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/types/__tests__/config.test.ts
```

Expected: FAIL — `"local"` not in provider enum, `endpoint` not in schema, `notifications` not in config.

- [ ] **Step 3: Implement config changes**

Replace `src/core/types/config.ts` with:

```typescript
import { z } from "zod";

export const AIModeSchema = z.enum(["disabled", "assist", "full"]);
export type AIMode = z.infer<typeof AIModeSchema>;

export const JiraAuthSchema = z.object({
  baseUrl: z.string().url(),
  type: z.enum(["cloud", "server"]).default("cloud"),
  email: z.string().email().optional(),
  apiToken: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  accessToken: z.string().optional(),
  strictGDPR: z.boolean().optional(),
});
export type JiraAuth = z.infer<typeof JiraAuthSchema>;

export const DedupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  windowHours: z.number().int().positive().default(24),
  minSimilarity: z.number().min(0).max(1).default(0.85),
});
export type DedupConfig = z.infer<typeof DedupConfigSchema>;

export const AIConfigSchema = z.object({
  mode: AIModeSchema.default("disabled"),
  provider: z.enum(["openai", "anthropic", "azure-openai", "gemini", "local"]).optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  endpoint: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  minConfidence: z.number().min(0).max(1).default(0.6),
  maxLogTokens: z.number().int().positive().default(8000),
});
export type AIConfig = z.infer<typeof AIConfigSchema>;

const SeverityFilterSchema = z.enum(["critical", "high", "medium", "low"]);

export const SlackConfigSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string().optional(),
  notifyOn: z.array(SeverityFilterSchema).optional(),
  includeMetrics: z.boolean().optional(),
  username: z.string().optional(),
});
export type SlackConfig = z.infer<typeof SlackConfigSchema>;

export const TeamsConfigSchema = z.object({
  webhookUrl: z.string().url(),
  notifyOn: z.array(SeverityFilterSchema).optional(),
  includeMetrics: z.boolean().optional(),
});
export type TeamsConfig = z.infer<typeof TeamsConfigSchema>;

export const NotificationsConfigSchema = z.object({
  enabled: z.boolean().optional(),
  slack: SlackConfigSchema.optional(),
  teams: TeamsConfigSchema.optional(),
});
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;

export const PipelineIQConfigSchema = z.object({
  jira: JiraAuthSchema,
  jiraProject: z.string().min(1),
  issueType: z.string().default("Bug"),
  defaultAssignee: z.string().optional(),
  defaultLabels: z.array(z.string()).default(["pipelineiq", "ci-failure"]),
  ai: AIConfigSchema.default({ mode: "disabled" }),
  dedup: DedupConfigSchema.default({}),
  maskSecrets: z.boolean().default(true),
  logExcerptLines: z.number().int().positive().default(80),
  displayMetadata: z.array(z.string()).optional(),
  notifications: NotificationsConfigSchema.optional(),
});
export type PipelineIQConfig = z.infer<typeof PipelineIQConfigSchema>;
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/core/types/__tests__/config.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Run full typecheck**

```
npx tsc --noEmit
```

Expected: No new errors.

- [ ] **Step 6: Commit**

```
git add src/core/types/config.ts src/core/types/__tests__/config.test.ts
git commit -m "feat: add local LLM endpoint + notifications to config schema"
```

---

## Task 2: LocalAIProvider — implement generateInsights()

**Files:**
- Modify: `src/core/ai/providers.ts`
- Create: `src/core/ai/__tests__/local-provider.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/ai/__tests__/local-provider.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { LocalAIProvider } from "../providers.js";
import type { AIEngineConfig } from "../types.js";

const baseConfig: AIEngineConfig = {
  provider: "local",
  endpoint: "http://localhost:11434/v1",
  model: "llama3.2",
  apiKey: "ollama",
  maxTokens: 1000,
  temperature: 0.1,
  timeout: 30000,
  retryAttempts: 3,
  minConfidence: 0.6,
};

describe("LocalAIProvider constructor", () => {
  it("throws JiraConfigError when endpoint is missing", () => {
    expect(() => new LocalAIProvider({ ...baseConfig, endpoint: undefined })).toThrow(
      /endpoint/i,
    );
  });

  it("throws when model is missing", () => {
    expect(() => new LocalAIProvider({ ...baseConfig, model: undefined })).toThrow(/model/i);
  });

  it("constructs successfully with valid config", () => {
    expect(() => new LocalAIProvider(baseConfig)).not.toThrow();
  });
});

describe("LocalAIProvider.generateInsights()", () => {
  const request = {
    logs: "npm ERR! peer dep conflict",
    pipelineName: "build",
    repositoryName: "my-org/api",
    branch: "main",
  };

  it("parses a valid JSON response from the local model", async () => {
    const mockResponse = {
      summary: "npm peer dep conflict",
      rootCause: "react version mismatch",
      remediation: ["Pin react to ^18"],
      severity: "High",
      classification: "Dependency",
      confidence: 0.85,
    };

    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(mockResponse) } }],
            }),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.summary).toBe("npm peer dep conflict");
    expect(result.confidence).toBe(0.85);

    vi.resetModules();
  });

  it("returns low-confidence fallback when model returns malformed JSON", async () => {
    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: "sorry, I cannot help with that" } }],
            }),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.confidence).toBe(0.5);

    vi.resetModules();
  });

  it("throws a descriptive error when the HTTP call fails", async () => {
    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error("Connection refused")),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    await expect(provider.generateInsights(request)).rejects.toThrow(/local ai error/i);

    vi.resetModules();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/ai/__tests__/local-provider.test.ts
```

Expected: FAIL — `LocalAIProvider` throws "not yet implemented".

- [ ] **Step 3: Replace LocalAIProvider in providers.ts**

Find the `LocalAIProvider` class at the bottom of `src/core/ai/providers.ts` (lines 469–493) and replace it entirely:

```typescript
/**
 * Local AI provider — any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, llama.cpp).
 * Set endpoint to the server's base URL, e.g. "http://localhost:11434/v1" for Ollama.
 */
export class LocalAIProvider implements AIProviderInterface {
  name = "local";
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private apiKey: string;

  constructor(config: AIEngineConfig) {
    if (!config.endpoint) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.endpoint (e.g. 'http://localhost:11434/v1')",
      );
    }
    if (!config.model) {
      throw new Error(
        "[PipelineIQ] Local AI provider requires config.ai.model (e.g. 'llama3.2')",
      );
    }
    this.baseURL = config.endpoint;
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? 1000;
    this.temperature = config.temperature ?? 0.1;
    this.apiKey = config.apiKey ?? "local";
  }

  isAvailable(): boolean {
    return true;
  }

  async generateInsights(request: AIRequest): Promise<AIResponse> {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ baseURL: this.baseURL, apiKey: this.apiKey });

    try {
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a CI/CD failure analysis expert. Analyze the provided failure context and provide structured insights.

Return a JSON object with the following fields:
- summary: Brief human-readable failure description (max 255 characters)
- rootCause: Most likely cause of the failure
- remediation: Array of specific remediation steps
- severity: Critical/High/Medium/Low based on impact
- classification: Infrastructure/Build/Deployment/Test/Dependency/Security/Authentication/Timeout/Network/CloudProvider/Unknown
- confidence: 0-1 confidence score in your analysis
- riskAssessment: Brief risk assessment for the deployment

Be concise but thorough. Focus on actionable insights.`,
          },
          { role: "user", content: this.buildPrompt(request) },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No response from local AI");
      return this.parseResponse(content);
    } catch (error) {
      throw new Error(`Local AI error: ${error}`);
    }
  }

  private buildPrompt(request: AIRequest): string {
    return `Pipeline Failure Analysis Request:

Pipeline: ${request.pipelineName}
Repository: ${request.repositoryName}
Branch: ${request.branch}
Environment: ${request.environment ?? "Not specified"}
Exit Code: ${request.exitCode ?? "Not specified"}
Failed Command: ${request.failedCommand ?? "Not specified"}

Error Message:
${request.errorMessage ?? "No error message provided"}

Stack Trace:
${request.stackTrace ?? "No stack trace provided"}

Logs:
${request.logs}

Historical Context:
${request.historicalContext ?? "No historical context available"}

Current Category: ${request.category ?? "Not classified yet"}`;
  }

  private parseResponse(content: string): AIResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          remediation: Array.isArray(parsed.remediation)
            ? parsed.remediation
            : [parsed.remediation],
          severity: parsed.severity,
          classification: parsed.classification,
          confidence: parsed.confidence,
          riskAssessment: parsed.riskAssessment,
        };
      }
    } catch {
      // fall through to low-confidence default
    }
    return { confidence: 0.5 };
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/core/ai/__tests__/local-provider.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Typecheck**

```
npx tsc --noEmit
```

Expected: No new errors.

- [ ] **Step 6: Commit**

```
git add src/core/ai/providers.ts src/core/ai/__tests__/local-provider.test.ts
git commit -m "feat: implement LocalAIProvider for OpenAI-compatible local endpoints"
```

---

## Task 3: ComputedMetrics type + HistoryService.getMetrics()

**Files:**
- Modify: `src/core/enrichers/types.ts` (add `ComputedMetrics` type)
- Modify: `src/core/jira/history.ts` (add `getMetrics()`)
- Create: `src/core/jira/__tests__/history-metrics.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/jira/__tests__/history-metrics.test.ts`:

```typescript
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
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const issues = [
      {
        fields: {
          created: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          resolutiondate: fourHoursAgo,
          labels: ["piq-repo:my-org/api"],
        },
      },
      {
        fields: {
          created: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          resolutiondate: twoHoursAgo,
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

  it("queries only resolved issues (resolution != Unresolved)", async () => {
    const jira = makeJira([]);
    const service = new HistoryService(jira, "PIQ");
    await service.getMetrics("abc123");

    const calledJql: string = (jira.advancedSearch as any).mock.calls[0][0];
    expect(calledJql).toContain("resolution != Unresolved");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/jira/__tests__/history-metrics.test.ts
```

Expected: FAIL — `getMetrics` does not exist.

- [ ] **Step 3: Add `ComputedMetrics` type to enrichers/types.ts**

Add after the `EnrichmentContext` type (before `Enricher` interface) in `src/core/enrichers/types.ts`:

```typescript
export type ComputedMetrics = {
  mttrHours?: number;
  blastRadius?: number;
  sampleSize: number;
};
```

Then add `metrics?` to `EnrichmentContext`:

```typescript
export type EnrichmentContext = {
  event: FailureEvent;
  config: PipelineIQConfig;
  fields: Partial<JiraTicketSpec>;
  provenance: Record<string, FieldProvenance>;
  history?: {
    similarCount: number;
    isFlaky: boolean;
    previousIncidentKeys: string[];
    trend?: "improving" | "worsening" | "stable" | undefined;
    relatedKeys: string[];
  };
  metrics?: ComputedMetrics;
};
```

- [ ] **Step 4: Add `getMetrics()` to HistoryService in `src/core/jira/history.ts`**

Add this method to the `HistoryService` class, after `searchRelatedByKeywords()`:

```typescript
async getMetrics(signature: string, windowDays: number = 30): Promise<ComputedMetrics> {
  const jql = `project = "${this.projectKey}" AND labels = "piq-sig:${signature}" AND resolution != Unresolved AND created >= -${windowDays}d ORDER BY created DESC`;

  try {
    const result = await this.jira.advancedSearch(jql, {
      maxResults: 20,
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

    const mttrHours =
      durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : undefined;

    return {
      mttrHours,
      blastRadius: repoSet.size > 1 ? repoSet.size : undefined,
      sampleSize: durations.length,
    };
  } catch (error) {
    console.warn(`[PipelineIQ] Metrics computation failed: ${error}`);
    return { sampleSize: 0 };
  }
}
```

Add the import at the top of `src/core/jira/history.ts`:

```typescript
import type { ComputedMetrics } from "../enrichers/types.js";
```

- [ ] **Step 5: Run tests to confirm they pass**

```
npx vitest run src/core/jira/__tests__/history-metrics.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Typecheck**

```
npx tsc --noEmit
```

Expected: No new errors.

- [ ] **Step 7: Commit**

```
git add src/core/enrichers/types.ts src/core/jira/history.ts src/core/jira/__tests__/history-metrics.test.ts
git commit -m "feat: add ComputedMetrics type and HistoryService.getMetrics()"
```

---

## Task 4: History enricher — call getMetrics() and populate ctx.metrics

**Files:**
- Modify: `src/core/enrichers/history.ts`

- [ ] **Step 1: Update the history enricher**

Replace `src/core/enrichers/history.ts` with:

```typescript
import type { Enricher, EnrichmentContext } from "./types.js";
import { HistoryService, type FailureHistory } from "../jira/history.js";
import { EnhancedJiraClient } from "../jira/enhanced-client.js";

export function createHistoryEnricher(jira: EnhancedJiraClient): Enricher {
  return {
    name: "history",
    source: "history",

    async enrich(ctx: EnrichmentContext) {
      const signature = ctx.fields.dedupSignature;
      const historyService = new HistoryService(jira, ctx.config.jiraProject);

      const errorMessage = ctx.event.failure.errorMessage ?? "";
      const keywords = [
        ...(ctx.event.failure.failedCommand ? [ctx.event.failure.failedCommand] : []),
        ...(errorMessage ? [errorMessage.split(":")[0]!] : []),
      ];

      try {
        let history: FailureHistory | undefined;
        if (signature) {
          [history] = await Promise.all([
            historyService.getHistory(signature),
          ]);
        }

        const relatedKeys = await historyService.searchRelatedByKeywords(keywords);

        ctx.history = {
          similarCount: history?.similarCount ?? 0,
          isFlaky: history?.isFlaky ?? false,
          previousIncidentKeys: history?.previousIncidentKeys ?? [],
          trend: history?.trend,
          relatedKeys: relatedKeys.filter((k) => !history?.previousIncidentKeys.includes(k)),
        };

        if (signature) {
          ctx.metrics = await historyService.getMetrics(signature);
        }
      } catch (error) {
        console.warn(`[PipelineIQ] History enrichment failed: ${error}`);
      }
    },
  };
}
```

- [ ] **Step 2: Run full tests**

```
npx vitest run
```

Expected: All previously passing tests still PASS. No regressions.

- [ ] **Step 3: Typecheck**

```
npx tsc --noEmit
```

Expected: No new errors.

- [ ] **Step 4: Commit**

```
git add src/core/enrichers/history.ts
git commit -m "feat: populate ctx.metrics from HistoryService.getMetrics() in history enricher"
```

---

## Task 5: Renderer — surface MTTR and blast radius

**Files:**
- Modify: `src/core/renderer.ts`
- Create: `src/core/__tests__/renderer-metrics.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/__tests__/renderer-metrics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { renderDescription } from "../renderer.js";
import type { FailureEvent } from "../types/index.js";
import type { ComputedMetrics } from "../enrichers/types.js";

const minEvent: FailureEvent = {
  source: "github-actions",
  pipeline: { name: "build", url: "https://github.com/org/repo/actions", id: "1" },
  repository: { name: "org/repo", url: "https://github.com/org/repo", fullName: "org/repo" },
  branch: "main",
  commit: { sha: "abc", message: "fix: something" },
  failure: { logs: "", errorMessage: "test error" },
  triggeredAt: new Date().toISOString(),
};

const history = {
  similarCount: 3,
  isFlaky: false,
  previousIncidentKeys: [],
  relatedKeys: [],
};

describe("renderDescription — metrics section", () => {
  it("renders MTTR when present", () => {
    const metrics: ComputedMetrics = { mttrHours: 4.2, sampleSize: 3 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).toContain("4.2h");
    expect(desc).toContain("3 incidents");
  });

  it("omits MTTR line when sampleSize is 0", () => {
    const metrics: ComputedMetrics = { sampleSize: 0 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).not.toContain("MTTR");
  });

  it("renders blast radius when > 1", () => {
    const metrics: ComputedMetrics = { blastRadius: 3, sampleSize: 2 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).toContain("3 repos");
  });

  it("omits blast radius line when undefined", () => {
    const metrics: ComputedMetrics = { sampleSize: 2 };
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, metrics);
    expect(desc).not.toContain("Blast radius");
  });

  it("renders nothing new when metrics is undefined", () => {
    const desc = renderDescription(minEvent, {}, 10, false, undefined, history, undefined);
    expect(desc).not.toContain("MTTR");
    expect(desc).not.toContain("Blast radius");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/__tests__/renderer-metrics.test.ts
```

Expected: FAIL — `renderDescription` does not accept a 7th argument.

- [ ] **Step 3: Update renderer signature and add metrics section**

In `src/core/renderer.ts`:

1. Add import at the top:
```typescript
import type { ComputedMetrics } from "./enrichers/types.js";
```

2. Update function signature (add `metrics?` as 7th param):
```typescript
export function renderDescription(
  event: FailureEvent,
  fields: Partial<JiraTicketSpec>,
  logExcerptLines: number,
  maskLogs: boolean,
  displayMetadata?: string[],
  history?: {
    similarCount: number;
    isFlaky: boolean;
    previousIncidentKeys: string[];
    trend?: "improving" | "worsening" | "stable" | undefined;
    relatedKeys: string[];
  },
  metrics?: ComputedMetrics,
): string {
```

3. After the existing `history.relatedKeys` block (around line 79, before the closing `out.push("---")`), add the metrics lines inside the `if (history)` block:

```typescript
    if (metrics) {
      if (metrics.mttrHours !== undefined && metrics.sampleSize > 0) {
        out.push(`- **MTTR:** ${metrics.mttrHours}h avg (${metrics.sampleSize} incidents)`);
      }
      if (metrics.blastRadius !== undefined) {
        out.push(`- **Blast radius:** ${metrics.blastRadius} repos affected`);
      }
    }
```

- [ ] **Step 4: Update call site in pipeline.ts**

In `src/core/pipeline.ts`, update the `renderDescription` call to pass `ctx.metrics`:

```typescript
ctx.fields.description = renderDescription(
  event,
  ctx.fields,
  config.logExcerptLines,
  config.maskSecrets,
  config.displayMetadata,
  ctx.history,
  ctx.metrics,
);
```

- [ ] **Step 5: Run tests to confirm they pass**

```
npx vitest run src/core/__tests__/renderer-metrics.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Run full test suite**

```
npx vitest run
```

Expected: All PASS.

- [ ] **Step 7: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```
git add src/core/renderer.ts src/core/pipeline.ts src/core/__tests__/renderer-metrics.test.ts
git commit -m "feat: render MTTR and blast radius in Reliability Context section"
```

---

## Task 6: Notification types

**Files:**
- Create: `src/core/notifications/types.ts`

- [ ] **Step 1: Create the notifications directory and types file**

Create `src/core/notifications/types.ts`:

```typescript
import type { SlackConfig, TeamsConfig, NotificationsConfig } from "../types/config.js";

export type { SlackConfig, TeamsConfig, NotificationsConfig };

export type ChannelResult = {
  success: boolean;
  error?: string;
};

export type NotificationResult = {
  slack?: ChannelResult;
  teams?: ChannelResult;
};

export type NotificationMetrics = {
  mttrHours?: number;
  blastRadius?: number;
};

export type NotificationPayload = {
  title: string;
  summary?: string;
  severity: string;
  priority: string;
  jiraKey: string;
  jiraUrl: string;
  repo: string;
  pipeline: string;
  branch: string;
  isNewTicket: boolean;
  dedupCount?: number;
  metrics?: NotificationMetrics;
};
```

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```
git add src/core/notifications/types.ts
git commit -m "feat: add notification payload and result types"
```

---

## Task 7: Slack sender

**Files:**
- Create: `src/core/notifications/slack.ts`
- Create: `src/core/notifications/__tests__/slack.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/notifications/__tests__/slack.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/notifications/__tests__/slack.test.ts
```

Expected: FAIL — `sendSlack` does not exist.

- [ ] **Step 3: Implement slack.ts**

Create `src/core/notifications/slack.ts`:

```typescript
import type { NotificationPayload, SlackConfig, ChannelResult } from "./types.js";

const SEVERITY_EMOJI: Record<string, string> = {
  Critical: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🔵",
};

export async function sendSlack(
  payload: NotificationPayload,
  config: SlackConfig,
): Promise<ChannelResult> {
  const emoji = SEVERITY_EMOJI[payload.severity] ?? "⚪";
  const ticketStatus = payload.isNewTicket
    ? "new ticket"
    : `seen ${payload.dedupCount ?? 1}×`;

  const metricsText =
    config.includeMetrics !== false && payload.metrics
      ? buildMetricsText(payload.metrics)
      : null;

  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} [${payload.severity.toUpperCase()}] ${payload.title} — ${payload.repo}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Pipeline:* ${payload.pipeline}` },
        { type: "mrkdwn", text: `*Branch:* ${payload.branch}` },
        {
          type: "mrkdwn",
          text: `*Jira:* <${payload.jiraUrl}|${payload.jiraKey}> (${ticketStatus})`,
        },
        { type: "mrkdwn", text: `*Priority:* ${payload.priority}` },
      ],
    },
  ];

  if (payload.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Root cause:* ${payload.summary}` },
    });
  }

  if (metricsText) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `📊  ${metricsText}` }],
    });
  }

  const body: Record<string, unknown> = { blocks };
  if (config.channel) body.channel = config.channel;
  if (config.username) body.username = config.username;

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function buildMetricsText(metrics: { mttrHours?: number; blastRadius?: number }): string {
  const parts: string[] = [];
  if (metrics.mttrHours !== undefined) parts.push(`MTTR ${metrics.mttrHours}h`);
  if (metrics.blastRadius !== undefined) parts.push(`${metrics.blastRadius} repos affected`);
  return parts.join("  |  ");
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/core/notifications/__tests__/slack.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```
git add src/core/notifications/slack.ts src/core/notifications/__tests__/slack.test.ts
git commit -m "feat: implement Slack Block Kit notification sender"
```

---

## Task 8: Teams sender

**Files:**
- Create: `src/core/notifications/teams.ts`
- Create: `src/core/notifications/__tests__/teams.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/notifications/__tests__/teams.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/notifications/__tests__/teams.test.ts
```

Expected: FAIL — `sendTeams` does not exist.

- [ ] **Step 3: Implement teams.ts**

Create `src/core/notifications/teams.ts`:

```typescript
import type { NotificationPayload, TeamsConfig, ChannelResult } from "./types.js";

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "attention",
  High: "warning",
  Medium: "accent",
  Low: "good",
};

export async function sendTeams(
  payload: NotificationPayload,
  config: TeamsConfig,
): Promise<ChannelResult> {
  const color = SEVERITY_COLOR[payload.severity] ?? "accent";
  const ticketStatus = payload.isNewTicket
    ? "New ticket"
    : `Seen ${payload.dedupCount ?? 1}×`;

  const facts: Array<{ title: string; value: string }> = [
    { title: "Pipeline", value: payload.pipeline },
    { title: "Branch", value: payload.branch },
    { title: "Jira", value: `[${payload.jiraKey}](${payload.jiraUrl}) — ${ticketStatus}` },
    { title: "Priority", value: payload.priority },
  ];

  if (config.includeMetrics !== false && payload.metrics) {
    if (payload.metrics.mttrHours !== undefined) {
      facts.push({ title: "MTTR", value: `${payload.metrics.mttrHours}h avg` });
    }
    if (payload.metrics.blastRadius !== undefined) {
      facts.push({ title: "Blast radius", value: `${payload.metrics.blastRadius} repos` });
    }
  }

  const bodyBlocks: object[] = [
    {
      type: "TextBlock",
      text: `[${payload.severity.toUpperCase()}] ${payload.title}`,
      weight: "Bolder",
      size: "Medium",
      color,
    },
    { type: "TextBlock", text: payload.repo, isSubtle: true },
    { type: "FactSet", facts },
  ];

  if (payload.summary) {
    bodyBlocks.push({ type: "TextBlock", text: payload.summary, wrap: true });
  }

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: bodyBlocks,
        },
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/core/notifications/__tests__/teams.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```
git add src/core/notifications/teams.ts src/core/notifications/__tests__/teams.test.ts
git commit -m "feat: implement Teams Adaptive Card notification sender"
```

---

## Task 9: NotificationService orchestrator

**Files:**
- Create: `src/core/notifications/index.ts`
- Create: `src/core/notifications/__tests__/service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/core/notifications/__tests__/service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationService } from "../index.js";
import type { NotificationPayload, NotificationsConfig } from "../types.js";

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
        notifyOn: ["critical"],
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
        notifyOn: ["critical", "high"],
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/core/notifications/__tests__/service.test.ts
```

Expected: FAIL — `NotificationService` does not exist.

- [ ] **Step 3: Implement NotificationService**

Create `src/core/notifications/index.ts`:

```typescript
import type { NotificationPayload, NotificationsConfig, NotificationResult } from "./types.js";
import { sendSlack } from "./slack.js";
import { sendTeams } from "./teams.js";

export { NotificationService };
export type { NotificationPayload, NotificationResult, NotificationsConfig };

class NotificationService {
  constructor(private config: NotificationsConfig) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.config.enabled === false) return {};

    const result: NotificationResult = {};
    const tasks: Promise<void>[] = [];

    if (this.config.slack) {
      const cfg = this.config.slack;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendSlack(payload, cfg).then((r) => { result.slack = r; }));
      }
    }

    if (this.config.teams) {
      const cfg = this.config.teams;
      const notifyOn = cfg.notifyOn?.map((s) => s.toLowerCase());
      if (!notifyOn || notifyOn.includes(payload.severity.toLowerCase())) {
        tasks.push(sendTeams(payload, cfg).then((r) => { result.teams = r; }));
      }
    }

    const settled = await Promise.allSettled(tasks);
    for (const s of settled) {
      if (s.status === "rejected") {
        console.warn(`[PipelineIQ] Notification dispatch error: ${s.reason}`);
      }
    }

    return result;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/core/notifications/__tests__/service.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Run full test suite**

```
npx vitest run
```

Expected: All PASS.

- [ ] **Step 6: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```
git add src/core/notifications/index.ts src/core/notifications/__tests__/service.test.ts
git commit -m "feat: implement NotificationService with parallel channel dispatch"
```

---

## Task 10: Pipeline integration — return metrics + call notifications

**Files:**
- Modify: `src/core/pipeline.ts`

- [ ] **Step 1: Update ProcessResult type to include metrics and notifications**

In `src/core/pipeline.ts`, replace the `ProcessResult` type:

```typescript
import type { NotificationResult } from "./notifications/index.js";
import type { ComputedMetrics } from "./enrichers/types.js";
import { NotificationService } from "./notifications/index.js";

type ProcessResultBase = {
  spec: JiraTicketSpec;
  metrics?: ComputedMetrics;
  notifications?: NotificationResult;
};

export type ProcessResult =
  | ({ action: "created"; issueKey: string } & ProcessResultBase)
  | ({ action: "updated"; issueKey: string } & ProcessResultBase)
  | ({ action: "skipped"; reason: string } & ProcessResultBase);
```

- [ ] **Step 2: Add buildNotificationPayload helper at the bottom of pipeline.ts**

Add this function after `processFailureEvent`:

```typescript
function buildNotificationPayload(
  ctx: import("./enrichers/types.js").EnrichmentContext,
  issueKey: string,
  isNewTicket: boolean,
  jiraBaseUrl: string,
): import("./notifications/index.js").NotificationPayload {
  return {
    title: ctx.fields.summary ?? "Pipeline failure",
    summary: ctx.fields.rca ?? undefined,
    severity: (ctx.fields.severity as string) ?? "Medium",
    priority: (ctx.fields.priority as string) ?? "Medium",
    jiraKey: issueKey,
    jiraUrl: `${jiraBaseUrl}/browse/${issueKey}`,
    repo: ctx.event.repository.name,
    pipeline: ctx.event.pipeline.name,
    branch: ctx.event.branch,
    isNewTicket,
    dedupCount: ctx.history?.similarCount,
    metrics: ctx.metrics
      ? { mttrHours: ctx.metrics.mttrHours, blastRadius: ctx.metrics.blastRadius }
      : undefined,
  };
}
```

- [ ] **Step 3: Wire metrics and notifications into processFailureEvent return values**

Replace the dedup + create section of `processFailureEvent` (from `if (config.dedup.enabled)` to the end of the function) with:

```typescript
  const metrics = ctx.metrics;

  async function maybeNotify(issueKey: string, isNewTicket: boolean): Promise<NotificationResult | undefined> {
    if (!config.notifications) return undefined;
    const service = new NotificationService(config.notifications);
    const notifPayload = buildNotificationPayload(ctx, issueKey, isNewTicket, config.jira.baseUrl);
    try {
      return await service.send(notifPayload);
    } catch (error) {
      console.warn(`[PipelineIQ] Notification stage failed: ${error}`);
      return undefined;
    }
  }

  // Dedup path
  if (config.dedup.enabled) {
    const existing = await jira.findBySignature(
      config.jiraProject,
      spec.dedupSignature,
      config.dedup.windowHours,
    );
    if (existing) {
      logger.info(
        { existingKey: existing.key, signature: spec.dedupSignature },
        "dedup hit — updating existing issue",
      );
      await jira.addComment(
        existing.key,
        `Failure recurred at ${new Date().toISOString()} — ${ctx.event.pipeline.url}`,
      );
      const notifications = await maybeNotify(existing.key, false);
      return { action: "updated", issueKey: existing.key, spec, metrics, notifications };
    }
  }

  const created = await jira.createIssue(spec);
  logger.info({ key: created.key, signature: spec.dedupSignature }, "created Jira issue");
  const notifications = await maybeNotify(created.key, true);
  return { action: "created", issueKey: created.key, spec, metrics, notifications };
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: All PASS.

- [ ] **Step 5: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```
git add src/core/pipeline.ts
git commit -m "feat: add metrics and notifications to ProcessResult; wire NotificationService into pipeline"
```

---

## Task 11: Public exports + build verification

**Files:**
- Modify: `src/core/index.ts`

- [ ] **Step 1: Add new exports to index.ts**

Add to `src/core/index.ts`:

```typescript
// Notifications
export { NotificationService } from "./notifications/index.js";
export type { NotificationPayload, NotificationResult, NotificationsConfig } from "./notifications/index.js";

// Enricher types (ComputedMetrics is used in ProcessResult)
export type { ComputedMetrics } from "./enrichers/types.js";
```

- [ ] **Step 2: Run full test suite**

```
npx vitest run
```

Expected: All PASS.

- [ ] **Step 3: Typecheck**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Build**

```
npm run build:core
```

Expected: Successful build, no type errors, `.d.ts` files generated in `dist/`.

- [ ] **Step 5: Commit**

```
git add src/core/index.ts
git commit -m "feat: export NotificationService, NotificationResult, ComputedMetrics from public API"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Local LLM: `LocalAIProvider.generateInsights()` implemented in Task 2
- [x] `config.ai.endpoint` + `"local"` provider in Task 1
- [x] `getMetrics()` returning MTTR + blast radius in Task 3
- [x] `ctx.metrics` populated by history enricher in Task 4
- [x] Renderer surfaces MTTR + blast radius in Task 5
- [x] `NotificationsConfig` (slack + teams, `notifyOn`, `includeMetrics`, `enabled`) in Task 1
- [x] Slack Block Kit sender in Task 7
- [x] Teams Adaptive Card sender in Task 8
- [x] `NotificationService` with `Promise.allSettled` parallel dispatch in Task 9
- [x] Notification failures non-fatal in Task 9 + Task 10
- [x] `processFailureEvent` returns `metrics?` + `notifications?` in Task 10
- [x] `jiraUrl` = `${config.jira.baseUrl}/browse/${issueKey}` — correct construction
- [x] Public exports in Task 11

**Type consistency across tasks:**
- `ComputedMetrics` defined in Task 3, used in Task 4 (enricher), Task 5 (renderer), Task 10 (pipeline)
- `NotificationPayload` defined in Task 6, used in Task 7, 8, 9, 10 — consistent shape
- `NotificationResult` defined in Task 6, returned by `NotificationService.send()` in Task 9, stored in `ProcessResult` in Task 10
- `ProcessResultBase` uses `ComputedMetrics` and `NotificationResult` — both defined before Task 10
- `sendSlack` / `sendTeams` return `ChannelResult`, assigned to `result.slack` / `result.teams` which are both `ChannelResult | undefined` — consistent
