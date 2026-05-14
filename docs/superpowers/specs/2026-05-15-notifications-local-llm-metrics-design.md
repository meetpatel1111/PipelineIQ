# Design: Notifications, Local LLM Support & Operational Metrics

**Date:** 2026-05-15  
**Status:** Approved  
**Scope:** Three cohesive features that make PipelineIQ actionable, air-gap friendly, and metrics-aware.

---

## 1. Overview

This spec covers three features shipped as a single release:

| Feature | What it does | Entry point |
|---|---|---|
| **Notification Channels** | Sends Slack/Teams alerts after a Jira ticket is created or updated | Post-ticket stage in `pipeline.ts` |
| **Local LLM Support** | Completes `LocalAIProvider` to work with any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM) | `src/core/ai/providers.ts` |
| **Operational Metrics** | Computes MTTR + blast radius from Jira history; surfaces in ticket description, notifications, and return value | `HistoryService` + `EnrichmentContext` |

All three are **optional and configurable** — existing callers with no config changes see identical behaviour.

---

## 2. Architecture & Data Flow

```
processFailureEvent(event, config)
  │
  ├─ EnrichmentContext created
  │
  ├─ [Enricher chain]
  │   ├─ deterministic enricher   (no I/O — derives labels, projectKey, summary)
  │   ├─ computed enricher        (signature matching, severity, dedup hash)
  │   ├─ history enricher         ← getHistory() + getMetrics() → ctx.history + ctx.metrics
  │   └─ AI enricher              ← LocalAIProvider now functional
  │
  ├─ renderer.ts                  ← ctx.metrics rendered in Reliability Context section
  │
  ├─ Jira create/update           (unchanged)
  │
  └─ NotificationService.send()   ← NEW: reads ctx.fields + ctx.metrics + jiraResult
       ├─ SlackSender
       └─ TeamsSender
```

**New files:**
- `src/core/notifications/types.ts`
- `src/core/notifications/slack.ts`
- `src/core/notifications/teams.ts`
- `src/core/notifications/index.ts`

**Modified files:**
- `src/core/ai/providers.ts` — implement `LocalAIProvider.enrich()`
- `src/core/ai/types.ts` — add `local` provider config shape
- `src/core/jira/history.ts` — add `getMetrics()`
- `src/core/enrichers/history.ts` — populate `ctx.metrics`
- `src/core/enrichers/types.ts` — add `metrics?` to `EnrichmentContext`
- `src/core/types/config.ts` — add `notifications?` + `local` AI config
- `src/core/types/operational-metrics.ts` — flesh out with computed fields
- `src/core/renderer.ts` — surface MTTR + blast radius in Reliability Context
- `src/core/pipeline.ts` — call `NotificationService` after ticket creation; add metrics to return value
- `src/core/index.ts` — export new public types

---

## 3. Local LLM Support

### 3.1 Config

```typescript
// src/core/types/config.ts — addition to AIConfig
local?: {
  baseURL: string;   // e.g. "http://localhost:11434/v1" for Ollama
  model: string;     // e.g. "llama3.2", "mistral", "codellama"
  apiKey?: string;   // "ollama" for Ollama; omit for unauthenticated endpoints
};
```

`AIConfig.provider` already accepts `"local"` — no change needed there.

### 3.2 Implementation

`LocalAIProvider` is initialised with `OpenAI({ baseURL, apiKey })` from the `openai` SDK. It reuses the **exact same prompt-building and response-parsing logic** as `OpenAIProvider` — no duplicate prompt authoring.

Behaviour:
- If `config.local` is absent when `provider = "local"`, throws `JiraConfigError` with a descriptive message before any network call.
- Requests `response_format: { type: "json_object" }` — if the local model ignores this header, the existing JSON parse + graceful fallback in `AIEngine` handles it.
- Confidence gating (`minConfidence`) applies identically to cloud providers — low-confidence responses fall back to `DeterministicFallbackEngine`.

### 3.3 Ollama quick-start (user-facing)

```typescript
const config: PipelineIQConfig = {
  ai: {
    provider: "local",
    local: {
      baseURL: "http://localhost:11434/v1",
      model: "llama3.2",
      apiKey: "ollama",
    },
  },
  // ...
};
```

---

## 4. Operational Metrics

### 4.1 `HistoryService.getMetrics()`

New method on `HistoryService` in `src/core/jira/history.ts`:

```typescript
async getMetrics(signature: string, windowDays?: number): Promise<OperationalMetrics>
```

**MTTR calculation:**
- Fetch resolved issues with same signature label using `advancedSearch`, requesting `created`, `resolutiondate` fields.
- For each resolved issue: `duration = resolutionDate - createdDate` (milliseconds → hours).
- `mttrHours = average(durations)`, rounded to one decimal place.
- `sampleSize = count of resolved issues used`.
- If no resolved issues exist, `mttrHours` is `undefined`.

**Blast radius calculation:**
- From the same issue set, collect all labels matching `piq-repo:*`.
- `blastRadius = count of distinct piq-repo:* label values`.
- The `deterministic enricher` already writes `piq-repo:<repoName>` labels when creating tickets, so this requires no new Jira data.
- Only shown in output when `blastRadius > 1`.

### 4.2 `EnrichmentContext` addition

```typescript
// src/core/enrichers/types.ts
metrics?: {
  mttrHours?: number;
  blastRadius?: number;
  sampleSize: number;
};
```

Populated by `history enricher` alongside `ctx.history`.

### 4.3 Renderer output

Added to the existing **Reliability Context** section in `renderer.ts`:

```
📊 Reliability Context
- Seen 5 times in last 30 days
- Trend: 📈 Worsening
- Flaky: Yes
- MTTR: 4.2h avg (from 3 incidents)     ← new, omitted if no resolved tickets
- Blast radius: 2 repos affected          ← new, omitted if blastRadius ≤ 1
```

### 4.4 Return value

`processFailureEvent()` return type gains:

```typescript
metrics?: {
  mttrHours?: number;
  blastRadius?: number;
  sampleSize: number;
};
```

Callers can use this to feed their own dashboards or alerting without parsing the Jira description string.

---

## 5. Notification Channels

### 5.1 Config

```typescript
// src/core/types/config.ts — addition to PipelineIQConfig
notifications?: {
  enabled?: boolean;          // master switch; default true when block is present
  slack?: {
    webhookUrl: string;
    channel?: string;         // overrides the webhook's default channel
    notifyOn?: Severity[];    // which severities trigger a notification; default: all
    includeMetrics?: boolean; // include MTTR/blast radius row; default: true
    username?: string;        // bot display name in Slack
  };
  teams?: {
    webhookUrl: string;
    notifyOn?: Severity[];
    includeMetrics?: boolean;
  };
};
```

### 5.2 Notification payload (internal)

```typescript
// src/core/notifications/types.ts
export type NotificationPayload = {
  title: string;           // e.g. "npm install failed"
  summary: string;         // one-line AI/deterministic summary
  severity: Severity;
  priority: Priority;
  jiraKey: string;         // e.g. "PIQ-142"
  jiraUrl: string;
  repo: string;
  pipeline: string;
  branch: string;
  category: FailureCategory;
  isNewTicket: boolean;    // false = existing ticket updated (deduped)
  dedupCount?: number;     // total occurrences if existing ticket
  metrics?: {
    mttrHours?: number;
    blastRadius?: number;
  };
};

export type NotificationResult = {
  slack?: { success: boolean; error?: string };
  teams?: { success: boolean; error?: string };
};
```

### 5.3 Slack message format (Block Kit)

```
🔴 [CRITICAL] npm install failed — my-org/api-service
Pipeline: build-and-test  ·  Branch: main
Jira: PIQ-142 (new ticket)  ·  Priority: P1

Root cause: npm ERESOLVE — peer dependency conflict on react@19
Remediation: Pin react to ^18.2.0 in package.json

📊  Seen 5×  |  MTTR 4.2h  |  2 repos affected
```

Severity maps to emoji: `critical → 🔴`, `high → 🟠`, `medium → 🟡`, `low → 🔵`.  
Metrics row is omitted when `includeMetrics: false` or when no metrics are available.  
`isNewTicket: false` renders as "existing ticket · seen N times".

### 5.4 Teams message format (Adaptive Card)

Same fields as Slack, rendered as an Adaptive Card with:
- Header block: severity badge + title
- Fact set: pipeline, branch, Jira key (linked), priority
- Text block: root cause + remediation
- Metrics row (conditional)

### 5.5 `NotificationService`

```typescript
// src/core/notifications/index.ts
class NotificationService {
  constructor(private config: NotificationsConfig) {}
  async send(payload: NotificationPayload): Promise<NotificationResult>
}
```

- Checks `enabled` flag first; returns empty result if false.
- Filters each channel by `notifyOn` severity list before dispatching.
- Dispatches enabled channels in parallel via `Promise.allSettled` — one channel failing does not block the other.
- **Notification failures are non-fatal**: errors are captured into `NotificationResult` and a `console.warn` is emitted. `processFailureEvent()` still resolves successfully.

### 5.6 Pipeline integration

```typescript
// src/core/pipeline.ts — after Jira create/update
if (config.notifications) {
  const service = new NotificationService(config.notifications);
  const notifResult = await service.send(buildNotificationPayload(ctx, jiraResult));
  result.notifications = notifResult;
}
```

`buildNotificationPayload()` is a pure function that maps `EnrichmentContext + JiraResult → NotificationPayload`.

---

## 6. Error Handling

| Scenario | Behaviour |
|---|---|
| `provider: "local"` but `config.local` absent | Throws `JiraConfigError` at startup, before any enrichment runs |
| Local model returns malformed JSON | Existing `AIEngine` JSON-parse fallback handles it; falls back to deterministic engine |
| Local model returns low-confidence response | `AIEngine` confidence gate rejects it; falls back to deterministic engine |
| `HistoryService.getMetrics()` fails | `console.warn` emitted; `ctx.metrics` left undefined; ticket still created without metrics |
| Slack webhook returns 4xx/5xx | `NotificationResult.slack.error` populated; `console.warn` emitted; pipeline resolves normally |
| Teams webhook fails | Same as Slack — non-fatal |
| Both notification channels fail | Both errors captured; `processFailureEvent()` still resolves successfully |

---

## 7. Public API Changes

All additions are **additive** — no existing fields removed or renamed.

### `PipelineIQConfig`
- `ai.local?` — new optional block
- `notifications?` — new optional block

### `processFailureEvent()` return value
- `metrics?` — new optional field
- `notifications?` — new optional field

### New exports from `src/core/index.ts`
- `NotificationPayload`
- `NotificationResult`
- `NotificationsConfig`
- `OperationalMetrics` (was internal, now public)

---

## 8. Out of Scope

- Email notifications (defined in `NotificationFields` type but deferred — requires SMTP config)
- Ownership routing / CODEOWNERS integration (separate feature)
- SLA window configuration
- Notification templates / custom message formatting
- Retry logic for failed webhook deliveries
