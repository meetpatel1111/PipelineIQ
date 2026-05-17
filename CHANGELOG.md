# Changelog

All notable changes to PipelineIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.15.0] - 2026-05-15

### Added — High-Fidelity Failure Context & Smart Log Summarization

**Outcome:** Reduced Mean Time to Resolution (MTTR) by providing engineers with precise failure context directly in Jira, eliminating manual log hunting.

- **Intelligent Log Summarization** (`src/core/log-parser/smart-excerpt.ts`): Replaces generic log tails with a context-aware extraction engine that identifies the "Signal vs. Noise":
  - **Platform-Aware Extraction**: Automatically detects failure boundaries in GitHub Actions and Azure DevOps to show only the failing step's output.
  - **Execution Breadcrumbs**: Renders a clear visual timeline (e.g., `✓ Build → ✗ Test → ○ Deploy`) so engineers can see exactly where the pipeline stalled.
  - **Error Anchoring**: For unstructured logs (Terraform, K8s, Docker), the engine "zooms in" on error patterns, providing a 60-line window centered on the failure.
- **Visual Error Highlighting**: Failures are now marked with a `▶` prefix in Jira tickets, allowing for sub-second scanning of stack traces and console errors.
- **Advanced Renderer Integration**: The diagnostic engine now dynamically calculates the most relevant failure context based on platform-specific metadata, ensuring Jira descriptions stay within character limits while maximizing diagnostic value.
- **Core Jira Integration Hardening**:
  - **Dynamic Custom Field Mapping**: Introduced configurable mapping for `externalLinks`, `provenance`, `dedupSignature`, and `metrics` custom fields, removing hardcoded dependencies and supporting diverse enterprise Jira configurations.
  - **Operational Metrics Persistence**: `ComputedMetrics` (MTTR, Blast Radius) are now persisted as structured JSON in Jira custom fields for advanced BI reporting and trend analysis.
  - **History Intelligence Upgrades**: Refined `HistoryService` with a robust 7-day window comparison heuristic for more accurate failure trend detection (`improving`/`worsening`/`stable`).
  - **Universal Platform Support**: Standardized API routing and implemented missing generic request handlers for Jira Server/DC, achieving 100% feature parity between Jira Cloud and on-premise environments.
  - **Automatic Lifecycle Management**: Introduced `autoReopen` logic to automatically transition resolved Jira issues back to an active state upon failure recurrence, ensuring no regressions go unnoticed.
  - **Operational Time Tracking**: Added `autoWorklog` support to automatically record pipeline execution duration as Jira worklog entries, providing high-fidelity data for engineering toil analysis.


## [0.14.0] - 2026-05-15

### Added — Operational Visibility: Multi-Channel Alerting & Reliability Metrics

**Outcome:** Improved stakeholder alignment and proactive incident management through real-time notifications and data-driven reliability insights.

#### Multi-Channel Operational Alerting
- **Real-time Slack & Teams Integration**: Immediate alerts for pipeline failures with severity-based prioritization (🔴 Critical to 🔵 Low).
- **Executive Summaries**: Notifications include AI-generated root cause summaries and key metrics, allowing leads to understand impact without leaving their communication platform.
- **Fault-Tolerant Delivery**: The notification orchestrator ensures that communication failures never block the core diagnostic pipeline.

#### Operational Intelligence & Metrics
- **Reliability Performance Tracking**: Automatically calculates core metrics for every failure, including deduplication effectiveness and AI confidence scores.
- **Structured Metric Payloads**: Exposes reliability data as first-class objects for integration with downstream BI tools and custom dashboards.

#### Enterprise-Grade AI Flexibility
- **Local LLM & Custom Provider Support**: Enables organizations to use internal AI models (Ollama, LocalAI) or enterprise-specific endpoints, ensuring data sovereignty and cost management.
- **Provider-Agnostic Core**: Standardized the internal AI bridge to support seamless switching between Google Gemini, OpenAI, Anthropic, and Azure OpenAI.

```typescript
notifications?: {
  enabled?: boolean;
  slack?: { webhookUrl: string; channel?: string; notifyOn?: Severity[]; includeMetrics?: boolean; username?: string };
  teams?: { webhookUrl: string; notifyOn?: Severity[]; includeMetrics?: boolean };
}
```

#### Local LLM Support

- **`LocalAIProvider`** (`src/core/ai/providers.ts`): Fully implemented for any OpenAI-compatible endpoint — Ollama, LM Studio, vLLM, llama.cpp. Uses the `openai` SDK with a configurable `baseURL`. Reuses the same prompt-building and JSON-parse fallback logic as `OpenAIProvider`.
- **New config fields** (`PipelineIQConfig.ai`):

```typescript
ai: {
  provider: "local";     // now accepted alongside openai/anthropic/azure-openai/gemini
  endpoint: string;      // e.g. "http://localhost:11434/v1" for Ollama
  model: string;         // e.g. "llama3.2", "mistral", "codellama"
  apiKey?: string;       // "ollama" for Ollama; omit for unauthenticated endpoints
}
```

- Throws `Error` with a descriptive message at construction time if `endpoint` or `model` is missing — before any network call.
- Confidence gating (`minConfidence`) and the deterministic fallback apply identically to cloud providers.

#### Operational Metrics

- **`HistoryService.getMetrics()`** (`src/core/jira/history.ts`): Computes MTTR and blast radius from resolved Jira issues sharing the same `piq-sig:` label within a configurable window (default 30 days).
  - **MTTR**: `avg(resolutionDate − createdDate)` across resolved issues, rounded to one decimal place (`parseFloat(avg.toFixed(1))`).
  - **Blast radius**: count of distinct `piq-repo:*` label values across those issues; only surfaced when `> 1`.
  - **`sampleSize`**: total issues returned by JQL, regardless of resolution status.
- **`ctx.metrics`** (`EnrichmentContext`): History enricher now fetches `getHistory()` and `getMetrics()` in parallel via `Promise.all`. Failure is non-fatal — `ctx.metrics` is left undefined and the ticket is still created.
- **Reliability Context section** (`src/core/renderer.ts`): Two new conditional lines appended to the existing section:

```
- **MTTR:** 4.2h avg (from 3 incidents)     ← omitted when no resolved tickets
- **Blast radius:** 2 repos affected          ← omitted when blastRadius ≤ 1
```

- **`ProcessResult.metrics`**: Callers receive structured metrics alongside the Jira key — no need to parse the ticket description string.

### Changed

- **`ProcessResult` type** (`src/core/pipeline.ts`): Extended with `metrics?: ComputedMetrics` and `notifications?: NotificationResult`. Both fields are absent (not `undefined`) when the feature is not configured, honouring `exactOptionalPropertyTypes: true`.
- **`renderDescription` signature** (`src/core/renderer.ts`): Accepts an optional 7th `metrics?: ComputedMetrics` parameter. Existing call sites are unaffected.

### New Public Exports (`src/core/index.ts`)

| Export | Type |
|---|---|
| `NotificationService` | class |
| `NotificationPayload` | type |
| `NotificationResult` | type |
| `NotificationsConfig` | type |
| `ComputedMetrics` | type |

### New Files

| Path | Purpose |
|---|---|
| `src/core/notifications/types.ts` | `NotificationPayload`, `NotificationResult`, `ChannelResult`, `NotificationMetrics` |
| `src/core/notifications/slack.ts` | Block Kit webhook sender |
| `src/core/notifications/teams.ts` | Adaptive Card webhook sender |
| `src/core/notifications/index.ts` | `NotificationService` orchestrator |
| `src/core/notifications/__tests__/slack.test.ts` | 8 tests |
| `src/core/notifications/__tests__/teams.test.ts` | 7 tests |
| `src/core/notifications/__tests__/service.test.ts` | 8 tests |

---

## [0.13.0] - 2026-05-15

### Added — Intelligent Root Cause Analysis & Historical Context

**Outcome:** Accelerated engineering onboarding and reduced cognitive load through AI-driven diagnostics and historical reliability tracking.

- **AI-First Diagnostic Strategy**: Re-engineered the analysis engine to prioritize high-fidelity AI insights. Reduces manual troubleshooting by providing plain-English explanations of complex failures.
- **Automated Reliability Benchmarking**: Integrated historical failure tracking to identify chronic issues vs. new regressions. Every incident now includes trend analysis (📈/📉) and flakiness detection.
- **Fuzzy Incident Discovery**: Uses advanced search heuristics to identify "related" historical incidents, preventing duplicate work and enabling teams to leverage existing solutions for similar problems.
- **Enhanced Enterprise Connectivity**: Introduced a standardized integration factory for complex Jira environments, supporting advanced historical queries and reliability context.

### Changed

- **Renderer Overhaul**: The Jira ticket description now includes a dedicated "Reliability Context" section displaying Frequency, Trend, Flakiness, and Related Incidents.
- **Optimized Computed Enrichment**: The `computedEnricher` now skips expensive full-signature matching when AI is active, performing only lightweight category classification for deduplication stability.
- **Factory Pattern Restoration**: Reintroduced the `createEnhancedJiraClient` factory in `pipeline.ts` to maintain consistent developer experience while providing the new history features.

### Fixed

- **Type Safety Hardening**: Resolved 10+ TypeScript errors related to `exactOptionalPropertyTypes` and strict `undefined` checks across the history, AI, and rendering pipelines.
- **ESM Runtime Compatibility**: Fixed module resolution issues in the history enricher by ensuring correct `.js` extensions on all imports.
- **Secret Masking Expansion**: Strengthened redaction coverage for enterprise tokens and environment-specific credentials.

---

## [0.12.0] - 2026-05-14

### Added — Architecture Documentation & Visual Design Overhaul

#### New Files
- **`ARCHITECTURE.md`**: Comprehensive 20-section technical and business architecture document covering system overview, goals, component design, AI architecture, security model, Jira ticket architecture, scalability, deployment models, engineering tradeoffs, and roadmap.
- **`pipelineiq-arch-structural.drawio`**: High-fidelity structural architecture diagram visualizing the Platform Adapter layer (GitHub/ADO/CLI), the ESM Core Pipeline (Normalization → Deterministic → Computed → Deduplicator → AI Engine → Renderer), the Signatures Library, Secret Masking middleware, and the Multi-Provider AI Hub (Gemini, OpenAI, Anthropic) with Jira integration.
- **`pipelineiq-arch-operational-flow.drawio`**: End-to-end operational process flow diagram across four stages: Ingestion & Sanitization, Intelligence & Enrichment, Resolution & Dispatch, and a "Deep Dive Logic" section visualizing the AI Prompt Factory, Fingerprint Stabilizer, and Multi-Platform Renderer sub-flows.
- **`pipelineiq-arch-deployment-topology.drawio`**: Deployment and Security Topology diagram covering Execution Contexts (GitHub Runner, ADO Agent, Local CLI), Network Boundaries (Jira Cloud/HTTPS, Jira Server/VPN, AI Provider egress), Secret Masking Firewall flow, and all four deployment modes including the future SaaS roadmap item.

#### Diagram Design
- All three Draw.io diagrams use a unified ultra-modern "Card" design system: white card nodes with vibrant accent borders, glassmorphism swimlane headers with numbered stage labels, curved connectors (`curved=1`) with color-coded semantic edge labels (YES/NO, FOUND/NEW), and shadow depth for visual hierarchy.
- Color system: Info Blue (`#1c7ed6`) for ingestion/Jira, Success Green (`#37b24d`) for enrichment/output, AI Red (`#f03e3e`) for AI and secrets, Amber (`#f59f00`) for decision gates/fallbacks, Purple (`#ae3ec9`) for deduplication/dispatch.

#### Architecture Content — Verified Against Current Codebase
- **AI Prompt Factory** (`src/core/ai/ai-engine.ts`): Documented the `buildPrompt` method that aggregates log snippets, signature metadata, Git history, and platform context with a Token Limit Guard before dispatching to LLMs.
- **Fingerprint Stabilizer** (`src/core/dedup.ts`): Documented the `normalizeLog` function that strips Timestamps, UUIDs/GUIDs, Hex codes, and absolute paths before computing the SHA-256 deduplication fingerprint.
- **Multi-Platform Renderer** (`src/core/jira/enhanced-client.ts`): Documented the `isCloud` detection logic that branches between Atlassian Document Format (ADF v3) for Jira Cloud and WikiMarkup (v2) for Jira Server/DC.
- **Secret Masking Firewall** (`src/core/secret-mask.ts`): Documented coverage for AWS/GCP/Azure keys, GitHub/ADO PATs, JWTs, Bearer tokens, and DB connection strings — all redacted in-place before any external dispatch.
- **Confidence Gating**: Documented the `>= 0.6` threshold that discards low-confidence AI output and triggers the deterministic fallback engine.

### Changed

- **`ARCHITECTURE.md` Section 3.1 — Visual Architecture Diagrams**: Replaced single-line diagram references with a structured 3-row reference table linking all three diagrams with emoji-coded icons, filenames, and purpose descriptions.
- **`ARCHITECTURE.md` Section 3.1**: Added `[!TIP]` callout highlighting the Deep Dive logic coverage and `[!IMPORTANT]` callout confirming the security guarantee that raw secrets never leave the runner.

### Renamed

- `pipelineiq.drawio` → `pipelineiq-arch-structural.drawio`
- `pipelineiq-flow.drawio` → `pipelineiq-arch-operational-flow.drawio`
- `pipelineiq-2.drawio` → `pipelineiq-arch-deployment-topology.drawio`

---

## [0.11.0] - 2026-05-14

### Added — Enterprise Configuration Hardening & Deep CI/CD Telemetry

**Outcome:** Guaranteed AI accuracy through corrected configuration paths and expanded observability for complex, multi-stage Azure DevOps and GitHub workflows.

- **Enterprise Configuration Hardening**: Resolved critical logic gaps that previously caused AI enrichment to be skipped or misconfigured in certain Azure DevOps environments.
- **Deep CI/CD Observability**: Achieved 100% telemetry parity for both GitHub Actions and Azure DevOps. Incident reports now capture the complete execution context, including:
  - **Pipeline Trigger Chains**: Identify the upstream source of truth for every failure (e.g., "Triggered by upstream build #123").
  - **Full Branch & Ref Transparency**: Detailed visibility into branch refs, tags, and PR merge contexts for precise root-cause mapping.
  - **Strategy & Matrix Metadata**: High-fidelity context for matrix-based runs, including job indexes and strategy totals.
- **Improved AI Sampling Control**: Restored user control over AI "creativity" and "confidence" thresholds by correctly wiring sampling parameters from platform inputs to the core engine.
- **Self-Documenting Metadata**: Updated the diagnostic reporting engine to automatically surface missing runner data and environment flags, ensuring no critical debugging info is hidden.

### Added

- **`temperature` in `AIConfigSchema`** (`src/core/types/config.ts`): The `ai-temperature` / `aiTemperature` input was exposed in both `action.yml` and `task.json` but silently discarded because `AIConfigSchema` had no `temperature` field. Added `temperature: z.number().min(0).max(2).optional()` so user-supplied sampling temperature now reaches the AI engine.
- **`fullSourceBranch` fully wired end-to-end**: `Build.SourceBranch` (the full `refs/heads/main` / `refs/tags/v1.0.0` / `refs/pull/1/merge` ref) was already written by `map-event.ts` but invisible to TypeScript and the renderer because `PipelineSchema` had no matching field. Completed the wiring:
  - Added `fullSourceBranch: z.string().optional()` to `PipelineSchema` in `failure-event.ts`
  - Added `"Source Branch (full ref)"` entry to `renderer.ts` `allFields` array
  - Added `fullSourceBranch` to both pipeline object constructions in `cli/index.ts`

### Changed

- **`aiEnricher` temperature spread** (`src/core/enrichers/ai.ts`): Refactored the engine config construction to destructure `temperature` explicitly before spreading `config.ai`, satisfying `exactOptionalPropertyTypes: true` — `temperature?: number | undefined` cannot be spread directly into a type requiring `temperature: number`.

### Added (continued)

- **4 missing GitHub Actions inputs in `action.yml`**: `runner-workspace`, `job-status`, `strategy-job-index`, and `strategy-job-total` were fully wired in `index.ts`, `GhContext`, and `map-event.ts` but had no corresponding `action.yml` input with a default expression. Added all four so they are automatically populated without user configuration:
  - `runner-workspace` → `${{ runner.workspace }}`
  - `job-status` → `${{ job.status }}`
  - `strategy-job-index` → `${{ strategy.job-index }}`
  - `strategy-job-total` → `${{ strategy.job-total }}`
- **`github-triggering-actor` input in `action.yml`**: Was read via `core.getInput()` in `index.ts` but had no input definition, so it always fell back to `process.env`. Added with `default: ${{ github.triggering_actor }}`.

### Fixed (continued)

- **GitHub failed job name invisible in Jira tickets** (`src/core/renderer.ts`): GitHub Actions sets `pipeline.job` (from `failedJob.name`) but the renderer only had an entry for `pipeline.jobName` — a distinct ADO field. Added a `job` entry to `allFields` so the failed job name now appears in the metadata table for GitHub runs.
- **`runnerEnvironment` and `runnerDebug` missing from renderer** (`src/core/renderer.ts`): Both fields were fully wired through schema → both adapters → map-event but had no `allFields` entry, making them unreachable even with `--display-metadata`. Added both.
- **`prIsFork` redundant `String()` cast** (`src/core/renderer.ts`): `PipelineSchema` defines `prIsFork` as `z.string().optional()` but the renderer applied an unnecessary `String()` conversion. Removed.

### Added (renderer completeness)

- **ADO triggered-by chain fields in renderer** (`src/core/renderer.ts`): Added `allFields` entries for `triggeredByDefinitionName`, `triggeredByBuildNumber`, `triggeredByDefinitionId`, and `triggeredByBuildId` — the four fields that identify which upstream pipeline triggered the current run. These were in `PipelineSchema` and set by the ADO adapter but had no renderer slot.
- **ADO deployment environment fields in renderer** (`src/core/renderer.ts`): Added `environmentResourceName` and `environmentId` entries — relevant for ADO environment-gated deployments.

### Verified

- **Complete ADO predefined variable audit**: Cross-referenced all 91 official Azure DevOps predefined variables (`Agent.*`, `Build.*`, `Common.*`, `Pipeline.*`, `Release.*`, `System.*`, `TF_BUILD`) against both `src/azure-devops/map-event.ts` (task-lib dot notation) and `src/cli/index.ts` (YAML env var underscore notation). All variables confirmed correctly mapped — no gaps found.
- **Complete GitHub Actions context variable audit**: Cross-referenced all official GitHub Actions context and environment variables across three batches (batch 1: `GITHUB_ACTION` → `GITHUB_TRIGGERING_ACTOR`; batch 2: `GITHUB_WORKFLOW_REF` → `RUNNER_TOOL_CACHE`; batch 3: `RUNNER_WORKSPACE` → `inputs.NAME`) against `action.yml`, `index.ts`, `GhContext`, and `map-event.ts`. All fixed-key variables confirmed correctly mapped or intentionally omitted (dynamic contexts: `env.NAME`, `vars.NAME`, `secrets.NAME`, `matrix.NAME`, `steps.<id>.*`, `needs.<job>.*`, `inputs.NAME`). Five gaps found and fixed.

---

## [0.10.0] - 2026-05-14

### Added — Smart Metadata & Context-Aware Reporting

**Outcome:** High-fidelity observability with reduced "Data Fatigue". Improved developer focus by prioritizing actionable insights over technical noise.

- **Intelligent Metadata Filtering**: Implemented a "Value-First" display strategy that highlights essential business context (Commits, Pull Requests, Authors) while neatly categorizing technical runner data.
- **Context-Rich Jira Reports**: Overhauled the reporting engine to provide deep-link transparency to CI/CD platforms, repositories, and specific commits directly from the Jira ticket.
- **Instant Developer Context**: Automatically includes commit messages and author details, allowing teams to immediately identify the "What" and "Who" of a recent change.
- **Customizable Incident Observability**: New high-importance metadata flags allow teams to override default reporting behaviors and pin environment-specific data (e.g., `--env production`) to the top of every ticket.

### Changed
- **Optimized Core Table**: Rebalanced default core fields to include "Triggered By" and "Commit Message" while moving technical runner data to optional diagnostic categories.

### Fixed
- **Cross-Platform Type Safety**: Synchronized the `FailureEvent` schema across GitHub Actions and Azure DevOps mapping logic to ensure robust, platform-agnostic reporting.

## [0.9.0] - 2026-05-14

### Added - Architectural Hardening & Unified Intelligence
- **Unified Signature Library**: Refactored `DeterministicFallbackEngine` to use the central `SIGNATURES` library, ensuring 100% consistency in failure classification, RCA, and remediation across all engine modes.
- **Strict "Unassigned" Policy**: Hardened Jira integration to explicitly initialize assignees as `null` by default, forcing "Unassigned" status and overriding project-level defaults.
- **Enhanced Value Proposition**: Overhauled `README.md` to clearly define the PipelineIQ "Intelligence Gap" and its role in reducing CI/CD noise.

### Changed
- **Codebase Consolidation**: Eliminated redundant regex patterns in the AI fallback engine by centralizing diagnostic logic in `src/core/signatures.ts`.

## [0.8.0] - 2026-05-13

### Added - Production Parity & Resilience
- **Full Platform Parity**: Achieved 100% schema consistency across GitHub Actions and Azure DevOps task definitions.
- **Optional Jira Assignment**: Introduced `--assignee` and `--default-assignee` CLI flags. Ticket assignment is now non-fatal; invalid Account IDs result in warnings rather than pipeline failures.
- **Dynamic AI Model Selection**: First-class support for `--ai-model` (alias `-m`) across all commands.
- **Global CLI Standardization**: Optimized build process for global `npm install -g` deployment.

### Fixed
- **Authentication Hardening**: Implemented automatic trimming for all credential-related CLI inputs (URL, Token, Email) to prevent copy-paste errors.
- **Jira API Reliability**: Standardized summary truncation to 255 characters across all providers to ensure 100% Jira API compliance.
- **Dynamic Versioning**: Fixed the CLI version reporting to correctly track `package.json`.

## [0.7.0] - 2026-05-13

### Fixed
- **Jira Summary Truncation**: Implemented automatic truncation of ticket summaries to 255 characters to prevent "400 Bad Request" errors from Jira APIs.
- **AI Prompt Refinement**: Updated all AI provider prompts to explicitly enforce a 255-character limit for failure summaries.

## [0.6.1] - 2026-05-13
### Added
- **Dynamic AI Model Override**: Introduced `--ai-model` flag to the `analyze` and `test` CLI commands, enabling runtime selection of specific AI models (e.g., switching between Gemini Flash and Pro).
- **CLI Test Enhancements**: The `test` command now supports overriding `ai-provider` and `ai-api-key` via CLI flags for easier troubleshooting.

## [0.6.0] - 2026-05-13

### Added
- **Native Google Gemini Support**: Integrated `@google/generative-ai` as a first-class provider (`gemini-2.5-flash`).
- **Resilient Jira Assignment**: Decoupled `assignee` mapping from issue creation. Analysis no longer fails if the AI suggests an invalid or non-existent Jira user; instead, it logs a warning and proceeds with ticket creation.
- **Enhanced Jira Cloud Formatting**: Fully integrated Atlassian Document Format (ADF) for both `description` and `environment` fields in the Jira Cloud client.
- **Schema Expansion**: Updated `FailureEvent` and `AIConfig` schemas to natively support Gemini and improved token budget management.

### Fixed
- **Jira 400 Bad Request**: Resolved the "Specify a valid value for assignee" error that previously halted pipelines when AI providers suggested incorrect user metadata.
- **AI Token Management**: Fixed an issue where `maxLogTokens` wasn't correctly propagated to the AI engine, potentially causing context window overflows.
- **Gemini JSON Parsing**: Hardened the Gemini response parser to handle non-structured text and markdown blocks more gracefully.

### Changed
- **Default AI Provider**: Switched default AI provider to `gemini` for improved performance and cost-efficiency.
- **Fallback Engine**: Hardened the `DeterministicFallbackEngine` to provide high-fidelity reports even during AI service interruptions.

## [0.5.0] - 2025-05-13

### Added
- **AI-Driven Diagnostic Integration**: Integrated AI-powered Root Cause Analysis (RCA) and Remediation steps into the Jira reporting pipeline.
- **AI Token Optimization**: Implemented intelligent log truncation and budget management to fit large diagnostic data within 8k token context windows.
- **Enhanced Jira Schema**: Added native `rca` and `remediationSteps` fields to the Jira ticket specification for cleaner rendering.
- **Production-Grade Diagnostic Parity**: Achieved 100% metadata synchronization between GitHub Actions and Azure DevOps.
- **Exhaustive Variable Support**: Added over 100+ platform-specific variables as optional, overrideable inputs:
  - **GitHub Actions**: Actor IDs, Triggering Actors, Ref Protection status, GraphQL URL, visibility, and 40+ default environment variables.
  - **Azure DevOps**: Predefined Build, Agent, System, Environment, and Strategy variables, including detailed path diagnostics and "Triggered By" relationships.
- **Input-First Override Architecture**: Standardized `action.yml` and `task.json` to prioritize manual YAML inputs over automated environment defaults for maximum flexibility.
- **Expanded Normalized Schema**: The unified `FailureEvent` Zod-validated schema now supports high-fidelity diagnostics for complex enterprise CI/CD scenarios (canary deployments, multi-pipeline triggers, etc.).
- **Jira Server Support**: Enhanced Jira reporting to correctly handle Jira Server authentication and platform-specific fields.

### Fixed
- **Log Retrieval Hardening**: Resolved a critical bug where binary log responses from GitHub/Azure DevOps were not correctly decoded to UTF-8, ensuring logs are fully populated in Jira tickets.
- **Job Discovery Logic**: Implemented robust job identification that automatically fallbacks to the failed build job if the specific job-name match fails.
- **Jira Error Observability**: Enhanced error reporting for Jira Cloud/Server to provide descriptive API failure reasons instead of generic errors.
- **CLI Flag Consistency**: Fixed the `analyze` command to correctly use `--pipeline` instead of `--workflow-name`.

### Changed
- **Unified Versioning**: Synchronized versioning across all project manifests (`package.json`, `task.json`, `action.yml`) to v0.5.0.
- **Refactored aiEnricher**: Completely overhauled the AI enrichment pipeline to support high-fidelity failure summaries with 100% deterministic fallbacks.

## [0.3.2] - 2025-05-13

### Fixed
- **Jira Search API**: Migrated from deprecated `/rest/api/3/search` to the new `/rest/api/3/search/jql` endpoint to resolve `410 Gone` errors.
- **CLI Validation**: Fixed boot-up crashes by deferring configuration validation until after CLI flag overrides are merged.
- **GitHub Action Path**: Corrected the `main` entry point in `action.yml` to point to the built artifact.

### Added
- **Automated Log Fetching**: CLI and GitHub Action now automatically retrieve logs from platform APIs (GitHub/Azure DevOps) when no local log path is provided.
- **Jira Connectivity Check**: The CLI now verifies Jira credentials and connectivity before starting analysis to provide immediate feedback.
- **Enhanced Job Linking**: GitHub Action now constructs direct links to the specific failing Job/Step in Jira tickets.
- **Improved Spinner UI**: Added granular feedback in the CLI for log fetching, Jira initialization, and analysis stages.

### Changed
- **Refactored Jira Clients**: Centralized field mapping logic to eliminate code duplication and implemented missing generic `request` methods for Jira Server.
- **Improved Branch Detection**: Leverages `GITHUB_REF_NAME` for cleaner branch labeling in failure events.

## [0.3.1] - 2025-05-13

### Added
- **Comprehensive CI/CD environment variable support** across all platforms:
  - **CLI**: Added 60+ environment variables from GitHub Actions and Azure DevOps
    - GitHub Actions: GITHUB_ACTOR_ID, GITHUB_API_URL, GITHUB_BASE_REF, GITHUB_HEAD_REF, GITHUB_JOB, GITHUB_REF_NAME, GITHUB_REF_PROTECTED, GITHUB_REF_TYPE, GITHUB_REPOSITORY_ID, GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY_OWNER_ID, GITHUB_RETENTION_DAYS, GITHUB_RUN_ATTEMPT, GITHUB_TRIGGERING_ACTOR, GITHUB_WORKFLOW_REF, GITHUB_WORKFLOW_SHA, GITHUB_WORKSPACE, RUNNER_ARCH, RUNNER_DEBUG, RUNNER_ENVIRONMENT, RUNNER_NAME, RUNNER_OS, RUNNER_TEMP, RUNNER_TOOL_CACHE
    - Azure DevOps: BUILD_SOURCEVERSIONMESSAGE, BUILD_REASON, BUILD_BUILDURI, BUILD_REPOSITORY_URI, BUILD_REPOSITORY_ID, BUILD_REPOSITORY_PROVIDER, BUILD_SOURCEBRANCHNAME, SYSTEM_COLLECTIONID, SYSTEM_DEFINITIONID, SYSTEM_TEAMPROJECTID, SYSTEM_TIMELINEID, ENVIRONMENT_NAME, ENVIRONMENT_ID, ENVIRONMENT_RESOURCENAME, ENVIRONMENT_RESOURCEID, SYSTEM_PULLREQUEST_ISFORK, SYSTEM_PULLREQUEST_PULLREQUESTID, SYSTEM_PULLREQUEST_PULLREQUESTNUMBER, SYSTEM_PULLREQUEST_TARGETBRANCHNAME, SYSTEM_PULLREQUEST_SOURCEBRANCH, SYSTEM_PULLREQUEST_SOURCECOMMITID, SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
  - **Azure DevOps integration**: Updated map-event to use comprehensive variables with pull request detection
  - **GitHub Action integration**: Extended GhContext type and populated all additional environment variables
- **Enhanced Jira ticket links**: Added workflow/pipeline URLs, repository URL, commit URL, and pull request URL to ticket description
- **Pull request detection**: Automatic PR detection and context for both GitHub Actions and Azure DevOps
- **Platform-specific URL construction**: Dynamic URL building based on detected platform (GitHub vs Azure DevOps)
- **PR branch handling**: Uses PR source branch instead of target branch for PR builds

### Changed
- **CLI data acquisition**: Multi-tier data collection (CLI options > Environment variables > Interactive prompts)
- **Azure DevOps map-event**: Added repository ID, provider, commit message, and PR information to event
- **GitHub Action map-event**: Added repository ID, PR branch handling, and triggering actor support
- **GitHub Action index**: Populates comprehensive environment variables from process.env

---

## [0.3.0] - 2025-05-13

### Breaking Changes
- **Major restructuring**: Consolidated 4 separate packages into single unified `pipelineiq` package
- Removed monorepo structure (packages/core, packages/cli, packages/github-action, packages/azure-devops-extension)
- All functionality now available in single npm package: `npm install pipelineiq`

### Changed
- **Unified package structure**: All source code moved to `src/` directory
  - `src/core/` - Core library functionality
  - `src/cli/` - CLI implementation
  - `src/github-action/` - GitHub Actions integration
  - `src/azure-devops/` - Azure DevOps integration
- **Single package.json**: Unified dependencies and build configuration
- **Simplified build process**: Single build command produces all artifacts
- **Updated imports**: All imports now use relative paths instead of package dependencies
- **Platform metadata**: `action.yml` and `task.json` moved to root directory
- **CLI binary**: Added `bin/pipelineiq` executable for CLI usage
- **Removed monorepo files**: Cleaned up `pnpm-workspace.yaml`, `turbo.json`, `.turbo/` directory

### Added
- **Unified entry point**: `src/index.ts` exports all core functionality
- **Multi-platform support**: Single package supports CLI, library, GitHub Actions, and Azure DevOps
- **Simplified installation**: One `npm install pipelineiq` gets all functionality
- **Unified versioning**: Single version for all components

### Migration Guide
- **Previous structure**: Required installing multiple packages (`pipelineiq-core`, `pipelineiq-cli`, etc.)
- **New structure**: Single package installation: `npm install pipelineiq`
- **CLI usage**: `pipelineiq analyze --log-file build.log` (unchanged)
- **Library usage**: `import { processFailureEvent } from 'pipelineiq'` (unchanged)
- **GitHub Actions**: Use CLI approach or install package in workflow
- **Azure DevOps**: Use CLI approach or install package in pipeline

---

## [0.2.3] - 2025-05-13

### Changed
- Updated root package to version 0.2.3
- Maintained sub-packages at version 0.2.2 for consistency
- Updated documentation and examples to use unscoped package names
- Fixed TypeScript path mappings in tsconfig.base.json
- Updated private package imports to use new package names
- Fixed GitHub Actions workflow installation commands
- Updated Azure DevOps pipeline to use correct package names

---

## [0.2.2] - 2025-05-13

### Changed
- Updated all sub-package versions to 0.2.2 for consistency
- Added `publishConfig.access: "public"` to enable unscoped publishing
- Updated import statements across all packages
- Synchronized dependency versions across all packages

### Added
- Support for unscoped npm package publishing
- Enhanced workspace dependency management
- Updated build system for new package structure
- First public release of `pipelineiq-core` and `pipelineiq-cli` packages
- Complete migration from scoped to unscoped package names
- Updated CI/CD workflows for new package structure
- Fixed TypeScript path mappings in tsconfig.base.json
- Updated private package imports to use new package names
- Fixed GitHub Actions workflow installation commands
- Updated Azure DevOps pipeline to use correct package names

### Added
- Support for unscoped npm package publishing
- Enhanced workspace dependency management
- Updated build system for new package structure
- First public release of `pipelineiq-core` and `pipelineiq-cli` packages
- Complete migration from scoped to unscoped package names
- Updated CI/CD workflows for new package structure
- Fixed TypeScript path mappings in tsconfig.base.json
- Updated private package imports to use new package names
- Fixed GitHub Actions workflow installation commands
- Updated Azure DevOps pipeline to use correct package names

### Added
- Support for unscoped npm package publishing
- Enhanced workspace dependency management
- Updated build system for new package structure
- First public release of `pipelineiq-core` and `pipelineiq-cli` packages
- Complete migration from scoped to unscoped package names
- Updated CI/CD workflows for new package structure
- Fixed TypeScript path mappings in tsconfig.base.json
- Updated private package imports to use new package names
- Fixed GitHub Actions workflow installation commands
- Updated Azure DevOps pipeline to use correct package names

### Added
- Support for unscoped npm package publishing
- Enhanced workspace dependency management
- Updated build system for new package structure
- First public release of `pipelineiq-core` and `pipelineiq-cli` packages
- Complete migration from scoped to unscoped package names
- Updated CI/CD workflows for new package structure
- Fixed TypeScript path mappings in tsconfig.base.json
- Updated private package imports to use new package names
- Fixed GitHub Actions workflow installation commands
- Updated Azure DevOps pipeline to use correct package names
- Enhanced workspace dependency management
- Updated build system for new package structure
- First public release of `pipelineiq-core` and `pipelineiq-cli` packages
- Complete migration from scoped to unscoped package names
- Updated CI/CD workflows for new package structure

---

## [0.2.1] - 2025-05-13

### Fixed
- Fixed TypeScript compilation errors in Jira client
- Resolved JiraClient interface export issues
- Fixed EnhancedJiraClient to use composition instead of inheritance
- Corrected CLI JiraClient instantiation to use factory function
- Fixed bulkFetchIssues API compatibility issues
- Resolved getCreateIssueMeta parameter type issues

### Changed
- Updated all package versions to 0.2.1
- Updated GitHub Action version from @0.2.0 to @0.2.1
- Updated Azure DevOps task from PipelineIQ@0.2.0 to PipelineIQ@0.2.1
- Improved Jira client error handling and API compatibility

### Added
- Enhanced build system compatibility
- Improved TypeScript type safety across packages
- Better error handling in Jira integration

---

## [0.2.0] - 2025-05-13

### Changed
- Updated all package versions to 0.2.0
- Updated GitHub Action version from @v1 to @v2
- Updated Azure DevOps task from PipelineIQ@1 to PipelineIQ@2

### Added
- Version bump for enhanced stability and compatibility
- Improved documentation consistency across platforms

### Fixed
- Version alignment across all packages in monorepo

---

## [0.1.0] - 2024-01-XX

### Added
- Initial PipelineIQ implementation with comprehensive CI/CD failure intelligence
- Complete monorepo structure with 8 packages
- GitHub Actions integration with automatic failure detection
- Azure DevOps extension with pipeline context mapping
- AI-powered enrichment with deterministic fallbacks
- Multi-format log parsing (GitHub Actions, Azure DevOps, Terraform, Kubernetes, Docker, JUnit)
- Rich Jira ticket creation with 80-120 operational fields
- Command-line interface for local analysis
- Comprehensive documentation and examples
- Enhanced AI engine configuration with support for custom endpoints and deployments
- Support for multiple AI providers (OpenAI, Anthropic, Azure OpenAI, local models)

### Core Features
- **PipelineIQ Core Engine**: 3-stage enrichment pipeline (deterministic → computed → AI)
- **Signature Library**: 30+ failure patterns with RCA and remediation
- **Deduplication Engine**: Smart signature matching with configurable time windows
- **Secret Masking**: Automatic detection and redaction of sensitive data
- **Markdown Renderer**: Rich ticket descriptions with structured metadata

### AI Engine
- **Multiple Providers**: OpenAI, Anthropic, Azure OpenAI, local models
- **Deterministic Fallbacks**: Template-based summaries, pattern-matched RCA, rule-based severity
- **Confidence Scoring**: Configurable thresholds with fallback logic
- **Mode-based Configuration**: disabled/assist/full modes

### Jira Integration
- **ADF Conversion**: Markdown to Atlassian Document Format
- **Enhanced Client**: Support for custom fields, bulk operations, advanced search
- **Deduplication**: JQL-based duplicate detection and issue updates
- **Error Handling**: Comprehensive error types and retry logic

### Platform Integrations
- **GitHub Actions**: Full context mapping, log fetching, failure step detection
- **Azure DevOps**: Complete pipeline integration with build timeline parsing
- **CLI**: Interactive configuration, log analysis, connectivity testing

### Documentation
- **README**: Comprehensive getting started guide and feature overview
- **PRD**: Complete product requirements document
- **CONTRIBUTING**: Development guidelines and contribution process
- **Examples**: GitHub workflow and usage patterns
- **License**: MIT license for open source distribution

## [0.1.0] - 2024-01-XX

### Added
- Initial release of PipelineIQ
- Complete implementation of all PRD-specified features
- Production-ready CI/CD failure intelligence platform

### Changed
- N/A - Initial release

### Fixed
- N/A - Initial release

### Security
- Secret masking for all common patterns (API keys, tokens, passwords)
- Secure credential handling in configuration
- Input validation and sanitization

---

## Migration Guide

### From Previous Versions
N/A - This is the initial release.

### To This Version
Follow the installation guide in README.md. No breaking changes expected.

### Configuration Changes
New configuration options added:
- `ai.mode`: disabled/assist/full
- `ai.provider`: openai/anthropic/azure-openai/local
- `dedup.windowHours`: Configurable deduplication time window
- `maskSecrets`: Enable/disable secret masking

---

**PipelineIQ** - Transforming CI/CD failures into operational intelligence.
