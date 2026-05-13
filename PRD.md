# PipelineIQ — Comprehensive Product Requirements Document (PRD)

## Product Name

# PipelineIQ

## Tagline

### AI-Powered CI/CD Failure Intelligence for GitHub, Azure DevOps & Jira

---

# 1. Executive Summary

PipelineIQ is a developer-native DevOps intelligence platform that automatically detects CI/CD failures from:

* [GitHub Actions](https://github.com/features/actions?utm_source=chatgpt.com)
* [Azure DevOps Pipelines](https://azure.microsoft.com/en-us/products/devops/pipelines/?utm_source=chatgpt.com)

and creates intelligent Jira issues enriched with:

* workflow metadata
* pipeline context
* failure logs
* AI summaries
* root-cause suggestions
* remediation guidance
* failure categorization
* deduplication

Unlike existing Jira integrations that focus on metadata synchronization or simple automation, PipelineIQ focuses on:

# operational intelligence.

Existing integrations:

* [Atlassian GitHub-Jira Integration](https://support.atlassian.com/jira-cloud-administration/docs/link-github-workflows-and-deployments-to-jira-issues/?utm_source=chatgpt.com)
* [GitHub Marketplace Jira Action](https://github.com/marketplace/actions/jira-issue-creation?utm_source=chatgpt.com)

mainly provide:

* issue linking
* workflow references
* simple ticket creation

PipelineIQ provides:

* CI/CD-aware intelligence
* AI-assisted debugging
* failure correlation
* engineering reliability insights

---

# 2. Product Vision

PipelineIQ becomes:

# “the intelligence layer for CI/CD operations.”

The long-term vision expands into:

* DevOps copilots
* SRE intelligence
* deployment risk scoring
* AI remediation
* reliability analytics
* autonomous operations

---

# 3. Problem Statement

Engineering organizations experience major operational inefficiencies because:

* CI/CD failures are noisy
* debugging is manual
* logs are difficult to understand
* Jira tickets are inconsistent
* duplicate incidents flood teams
* MTTR is high
* GitHub + Azure DevOps + Jira lack operational intelligence

Current integrations solve:

# “connectivity”

They do NOT solve:

# “failure understanding.”

---

# 4. Product Goals

## Primary Goals

* Reduce MTTR
* Reduce operational toil
* Standardize incident reporting
* Improve debugging efficiency
* Reduce duplicate Jira tickets

## Secondary Goals

* Reliability analytics
* Failure trend visibility
* Engineering productivity improvements
* AI-assisted troubleshooting

---

# 5. Target Users

| Persona              | Use Cases                   |
| -------------------- | --------------------------- |
| DevOps Engineers     | Pipeline failure management |
| Platform Engineers   | Reliability optimization    |
| Developers           | Faster debugging            |
| SRE Teams            | Incident reduction          |
| QA Teams             | Deployment tracking         |
| Engineering Managers | Reliability metrics         |
| Release Managers     | Deployment governance       |

---

# 6. Product Distribution Strategy

PipelineIQ is NOT initially a heavy SaaS platform.

PipelineIQ is distributed as:

| Distribution           | Purpose                |
| ---------------------- | ---------------------- |
| npm package            | Core engine            |
| GitHub Action          | GitHub integration     |
| Azure DevOps Extension | Azure integration      |
| CLI                    | Local analysis         |
| Docker image           | Enterprise/self-hosted |
| Optional SaaS later    | Analytics/intelligence |

---

# 7. Technology Decision

## Primary Language

# TypeScript

## Runtime

# Node.js 20+

---

# Why TypeScript?

GitHub Actions officially support JavaScript/TypeScript natively.

Azure DevOps extensions/tasks heavily use the npm ecosystem and Microsoft’s SDKs are npm-based.

Benefits:

* native CI/CD ecosystem compatibility
* easier GitHub Marketplace distribution
* easier Azure DevOps integration
* unified runtime
* strong typing
* simpler packaging
* better developer adoption

---

# 8. Product Architecture

# High-Level Architecture

```txt
GitHub Action / Azure DevOps Extension
                    |
                    v
           PipelineIQ Core Engine
                    |
        +-----------+------------+
        |           |            |
        v           v            v
   Log Parser   AI Engine   Dedup Engine
                    |
                    v
             Jira REST Client
                    |
                    v
                Jira Issues
```

---

# 9. Unified Package Architecture

```txt
pipelineiq/
├── src/
│   ├── core/                 # Main processing engine
│   │   ├── pipeline/         # Pipeline processing logic
│   │   ├── jira/             # Jira REST API client
│   │   ├── ai/               # AI enrichment with fallbacks
│   │   ├── parser/           # Multi-format log parsing
│   │   ├── enrichers/        # Deterministic and computed enrichers
│   │   ├── signatures/      # Failure pattern library
│   │   └── markdown/         # Markdown to ADF conversion
│   ├── cli/                  # Command-line interface
│   ├── github-action/        # GitHub Actions integration
│   ├── azure-devops/         # Azure DevOps integration
│   └── index.ts              # Main entry point
├── bin/pipelineiq           # CLI executable
├── action.yml               # GitHub Action metadata
├── task.json                # Azure DevOps task metadata
├── examples/                # Usage examples
└── docs/                    # Documentation
```

---

# 10. Supported Platforms

## CI/CD Platforms

* [GitHub Actions](https://github.com/features/actions?utm_source=chatgpt.com)
* [Azure DevOps Pipelines](https://azure.microsoft.com/en-us/products/devops/pipelines/?utm_source=chatgpt.com)

## Ticketing

* [Jira Cloud](https://www.atlassian.com/software/jira?utm_source=chatgpt.com)
* Jira Data Center

## Notifications

* Slack
* Microsoft Teams
* Discord
* Email
* Custom Webhooks

---

# 11. Installation Experience

# GitHub Actions

```yaml
- uses: meetpatel1111/PipelineIQ@v0.8.0
  if: failure()
  with:
    jira-url: ${{ secrets.JIRA_URL }}
    jira-email: ${{ secrets.JIRA_EMAIL }}
    jira-token: ${{ secrets.JIRA_TOKEN }}
    jira-project: DEVOPS
```

---

# Azure DevOps

```yaml
- task: PipelineIQ@0
  condition: failed()
  inputs:
    jiraUrl: $(JIRA_URL)
    jiraEmail: $(JIRA_EMAIL)
    jiraToken: $(JIRA_TOKEN)
    jiraProject: DEVOPS
```

---

# 12. Core Features (75 Features)

# A. Failure Detection

| #  | Feature                         |
| -- | ------------------------------- |
| 1  | Detect failed GitHub workflows  |
| 2  | Detect failed ADO pipelines     |
| 3  | Detect failed deployment stages |
| 4  | Detect cancelled jobs           |
| 5  | Detect timeout failures         |
| 6  | Detect flaky jobs               |
| 7  | Detect retry loops              |
| 8  | Detect infra failures           |
| 9  | Detect build failures           |
| 10 | Detect test failures            |

---

# B. Workflow Context

| #  | Feature              |
| -- | -------------------- |
| 11 | Workflow name        |
| 12 | Pipeline name        |
| 13 | Repository name      |
| 14 | Branch name          |
| 15 | Commit SHA           |
| 16 | Commit URL           |
| 17 | Pull Request details |
| 18 | Triggered by user    |
| 19 | Runner information   |
| 20 | Environment details  |

---

# C. Failure Context

| #  | Feature                     |
| -- | --------------------------- |
| 21 | Failed step name            |
| 22 | Failed stage                |
| 23 | Exit code extraction        |
| 24 | Stack trace extraction      |
| 25 | Relevant log extraction     |
| 26 | Error signature detection   |
| 27 | Duration tracking           |
| 28 | Deployment target detection |
| 29 | Dependency error extraction |
| 30 | Security error extraction   |

---

# D. Jira Features

| #  | Feature                     |
| -- | --------------------------- |
| 31 | Auto-create Jira issues     |
| 32 | Auto-update existing issues |
| 33 | Add labels automatically    |
| 34 | Add severity automatically  |
| 35 | Add markdown formatting     |
| 36 | Add hyperlinks              |
| 37 | Attach logs                 |
| 38 | Add environment metadata    |
| 39 | Add custom Jira fields      |
| 40 | Auto-assign owners          |

---

# E. AI Features

| #  | Feature                      |
| -- | ---------------------------- |
| 41 | AI log summarization         |
| 42 | AI root-cause suggestions    |
| 43 | AI remediation guidance      |
| 44 | AI-generated titles          |
| 45 | Failure categorization       |
| 46 | Infra issue detection        |
| 47 | Deployment issue detection   |
| 48 | Test failure understanding   |
| 49 | Dependency conflict analysis |
| 50 | AI-generated postmortems     |

---

# F. Deduplication Features

| #  | Feature                    |
| -- | -------------------------- |
| 51 | Duplicate issue detection  |
| 52 | Similar failure grouping   |
| 53 | Failure frequency tracking |
| 54 | Existing issue updates     |
| 55 | Noise reduction logic      |

---

# G. Reliability Analytics

| #  | Feature                  |
| -- | ------------------------ |
| 56 | MTTR analytics           |
| 57 | Failure trend analysis   |
| 58 | Top failing repos        |
| 59 | Failure heatmaps         |
| 60 | Team reliability scoring |

---

# H. Notification Features

| #  | Feature               |
| -- | --------------------- |
| 61 | Slack notifications   |
| 62 | Teams notifications   |
| 63 | Email alerts          |
| 64 | Discord notifications |
| 65 | Custom webhooks       |

---

# I. Enterprise Features

| #  | Feature          |
| -- | ---------------- |
| 66 | RBAC             |
| 67 | Audit logging    |
| 68 | Tenant isolation |
| 69 | SSO/SAML         |
| 70 | Secret masking   |

---

# J. Advanced Features

| #  | Feature                        |
| -- | ------------------------------ |
| 71 | Deployment risk scoring        |
| 72 | Historical failure correlation |
| 73 | Release reliability insights   |
| 74 | AI-generated remediation plans |
| 75 | Flaky test intelligence        |

---

# 13. Jira Ticket Structure — Complete Data Model

PipelineIQ's biggest differentiator is **rich operational context**.

Most tools only create:

* title
* description

PipelineIQ creates:

# "fully operationalized incident records."

> **Important:** AI is **optional**. Every AI-enriched field has a **deterministic fallback** (template-based summary, pattern-matched RCA, category-based remediation hints from a static knowledge base, heuristic severity, etc.). Tickets must remain useful and rich even when AI is disabled or unavailable. See Section 14 for the fallback strategy.

## Field Source Categories

Every field belongs to one of three producer categories:

| Source              | How it's populated                                                 |
| ------------------- | ------------------------------------------------------------------ |
| **Deterministic**   | Pulled directly from CI/CD event payload (GitHub/ADO webhooks/API) |
| **Computed**        | Derived from history, dedup engine, or log parsing heuristics      |
| **AI-Enriched**     | Generated by AI engine — **with deterministic fallback**           |

---

## 1. Core Jira Fields

| Field            | Description                     | Source         |
| ---------------- | ------------------------------- | -------------- |
| Issue Type       | Bug / Incident / Task / Problem | Computed       |
| Project Key      | Jira project                    | Deterministic  |
| Summary          | Failure title                   | AI-Enriched\*  |
| Description      | Detailed markdown summary       | AI-Enriched\*  |
| Priority         | Critical / High / Medium / Low  | Computed       |
| Severity         | Operational severity            | AI-Enriched\*  |
| Labels           | Auto-generated labels           | Computed       |
| Assignee         | Suggested owner                 | AI-Enriched\*  |
| Reporter         | PipelineIQ service account      | Deterministic  |
| Components       | Affected services/components    | Computed       |
| Environment      | Dev/Test/Stage/Prod             | Deterministic  |
| Due Date         | Optional SLA                    | Computed       |
| Epic Link        | Optional release epic           | Deterministic  |
| Sprint           | Optional sprint mapping         | Deterministic  |
| Affected Version | Release version                 | Deterministic  |
| Fix Version      | Planned fix version             | Deterministic  |

\* AI-Enriched fields have deterministic fallbacks (see Section 14).

---

## 2. Pipeline Metadata

| Field              | Description           | Source        |
| ------------------ | --------------------- | ------------- |
| Pipeline Name      | Azure DevOps pipeline | Deterministic |
| Workflow Name      | GitHub workflow       | Deterministic |
| Pipeline URL       | Direct pipeline link  | Deterministic |
| Workflow URL       | Direct workflow link  | Deterministic |
| Run ID             | Unique execution ID   | Deterministic |
| Run Number         | Build number          | Deterministic |
| Stage Name         | Failed stage          | Deterministic |
| Job Name           | Failed job            | Deterministic |
| Step Name          | Failed step           | Deterministic |
| Task Name          | Failed task           | Deterministic |
| Execution Duration | Total runtime         | Deterministic |
| Queue Time         | Wait time             | Deterministic |
| Start Time         | Execution start       | Deterministic |
| Failure Time       | Failure timestamp     | Deterministic |
| Retry Count        | Retry attempts        | Deterministic |
| Runner Type        | GitHub/Azure runner   | Deterministic |
| Agent Pool         | ADO agent pool        | Deterministic |

---

## 3. Repository Metadata

| Field               | Description         | Source        |
| ------------------- | ------------------- | ------------- |
| Repository Name     | Repo name           | Deterministic |
| Repository URL      | Repo URL            | Deterministic |
| Repository Owner    | Org/user            | Deterministic |
| Branch Name         | Failed branch       | Deterministic |
| Default Branch      | Repo default branch | Deterministic |
| Commit SHA          | Commit hash         | Deterministic |
| Commit URL          | Commit link         | Deterministic |
| Commit Message      | Commit message      | Deterministic |
| Commit Author       | Commit author       | Deterministic |
| Pull Request Number | PR number           | Deterministic |
| Pull Request URL    | PR link             | Deterministic |
| Pull Request Title  | PR title            | Deterministic |
| Pull Request Author | PR creator          | Deterministic |
| Release Tag         | Release version/tag | Deterministic |

---

## 4. Failure Intelligence Fields

| Field                   | Description                  | Source        |
| ----------------------- | ---------------------------- | ------------- |
| Failure Type            | Build/Test/Infra/etc         | Computed      |
| Failure Category        | Infrastructure/Test/Security | AI-Enriched\* |
| Failure Signature       | Unique error signature       | Computed      |
| Error Message           | Primary error                | Computed      |
| Exit Code               | Process exit code            | Deterministic |
| Stack Trace             | Parsed stack trace           | Computed      |
| Failed Command          | Command executed             | Computed      |
| Failure Pattern         | Recognized issue pattern     | Computed      |
| Root Cause Guess        | RCA explanation              | AI-Enriched\* |
| Confidence Score        | AI confidence (0 if no AI)   | AI-Enriched   |
| Similar Failures Count  | Historical count             | Computed      |
| Previous Incident Links | Related Jira issues          | Computed      |
| Flaky Detection         | Flaky job indicator          | Computed      |
| Deployment Risk Score   | Risk analysis                | AI-Enriched\* |
| Blast Radius            | Services affected            | Computed      |

\* Deterministic fallback uses regex/signature matching against a known-pattern library.

---

## 5. AI-Generated Fields (All have deterministic fallbacks)

| Field                  | Description                | Fallback when AI disabled                          |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| AI Summary             | Human-readable explanation | Template: "`{workflow}` failed at `{step}` on `{branch}` (exit `{code}`)" |
| AI Remediation         | Suggested fixes            | Static knowledge-base lookup by category           |
| AI Recommendations     | Best next steps            | Generic category playbook                          |
| AI Severity Prediction | Suggested severity         | Rule: prod env + outage signature → High/Critical  |
| AI Owner Suggestion    | Suggested assignee         | CODEOWNERS / commit author                         |
| AI Tags                | Generated labels           | Category + branch + repo labels                    |
| AI Postmortem Summary  | Incident narrative         | Omitted when AI disabled                           |
| AI Classification      | Infra/Test/etc             | Pattern-matched from log signatures                |
| AI Timeline            | Failure sequence           | Step durations from CI payload                     |
| AI Risk Assessment     | Deployment risk            | Heuristic: branch + env + recent failure rate      |

---

## 6. Log & Diagnostic Fields

| Field                  | Description         | Source        |
| ------------------------| ---------------------| ---------------|
| Relevant Logs          | Filtered logs       | Computed      |
| Full Logs Attachment   | Complete logs       | Deterministic |
| Stack Trace Attachment | Parsed traces       | Computed      |
| Terraform Logs         | Infra-specific logs | Computed      |
| Kubernetes Events      | K8s event logs      | Computed      |
| Helm Output            | Helm failure logs   | Computed      |
| Docker Logs            | Container logs      | Computed      |
| Test Reports           | JUnit/NUnit/etc     | Deterministic |
| Coverage Reports       | Optional            | Deterministic |
| Artifact URLs          | Build artifacts     | Deterministic |
| Screenshot Attachments | Optional            | Deterministic |
| Video Recording Links  | E2E test videos     | Deterministic |

---

## 7. Deployment Metadata

| Field                   | Description          | Source        |
| ----------------------- | -------------------- | ------------- |
| Deployment Environment  | Dev/Test/Prod        | Deterministic |
| Region                  | Azure/AWS region     | Deterministic |
| Cluster Name            | Kubernetes cluster   | Deterministic |
| Namespace               | Kubernetes namespace | Deterministic |
| Helm Release            | Helm deployment      | Deterministic |
| Terraform Workspace     | Infra workspace      | Deterministic |
| Infrastructure Provider | Azure/AWS/GCP        | Deterministic |
| Service Name            | Affected service     | Deterministic |
| Microservice Name       | Related microservice | Deterministic |
| API Version             | API release version  | Deterministic |

---

## 8. Security & Compliance Fields

| Field                    | Description           | Source        |
| ------------------------ | --------------------- | ------------- |
| Secret Exposure Detected | Yes/No                | Computed      |
| Security Scan Failure    | Security issue        | Computed      |
| Compliance Failure       | Governance issue      | Computed      |
| CVE Reference            | Vulnerability mapping | Computed      |
| Dependency Vulnerability | Dependency issue      | Computed      |
| License Violation        | OSS license issue     | Computed      |
| Policy Violation         | Internal policy       | Computed      |
| Audit Reference          | Audit trail           | Deterministic |

---

## 9. Operational Metrics

| Field                      | Description           | Source        |
| -------------------------- | --------------------- | ------------- |
| MTTR Estimate              | Estimated resolution  | Computed      |
| Incident Frequency         | Recurrence count      | Computed      |
| Failure Trend              | Increasing/decreasing | Computed      |
| Team Reliability Score     | Team metric           | Computed      |
| Pipeline Reliability Score | Pipeline metric       | Computed      |
| Failure Duration           | Downtime impact       | Computed      |
| SLA Impact                 | SLA breach            | Computed      |
| SLO Impact                 | Reliability impact    | Computed      |
| Downtime Estimate          | Impact duration       | Computed      |

---

## 10. Ownership & Routing Fields

| Field              | Description             | Source        |
| ------------------ | ----------------------- | ------------- |
| Suggested Team     | Owning team             | Computed      |
| Suggested Assignee | Responsible engineer    | AI-Enriched\* |
| Escalation Policy  | Incident routing        | Deterministic |
| On-Call Engineer   | Current on-call         | Deterministic |
| Service Owner      | Service ownership       | Deterministic |
| Team Slack Channel | Communication channel   | Deterministic |
| Teams Channel      | Microsoft Teams mapping | Deterministic |

\* Fallback: CODEOWNERS file → commit author → repo admin.

---

## 11. Correlation & Deduplication Fields

| Field                     | Description           | Source   |
| ------------------------- | --------------------- | -------- |
| Duplicate Detection ID    | Unique signature      | Computed |
| Correlated Incidents      | Related issues        | Computed |
| Parent Incident           | Parent Jira issue     | Computed |
| Child Incidents           | Linked failures       | Computed |
| Incident Cluster ID       | Grouping ID           | Computed |
| Root Incident             | Initial trigger       | Computed |
| Cross-Repo Correlation    | Multi-repo linkage    | Computed |
| Cross-Service Correlation | Multi-service linkage | Computed |

---

## 12. Notification & Communication Fields

| Field                  | Description     | Source        |
| ---------------------- | --------------- | ------------- |
| Slack Notification URL | Slack thread    | Deterministic |
| Teams Notification URL | Teams message   | Deterministic |
| Incident Channel       | Incident room   | Deterministic |
| Stakeholders           | Mentioned users | Computed      |
| Notification Status    | Sent/delivered  | Deterministic |
| Pager Reference        | Optional paging | Deterministic |

---

## 13. Advanced Future Fields (Phase 5+)

| Field                       | Description             | Source       |
| --------------------------- | ----------------------- | ------------ |
| AI Rollback Suggestion      | Rollback recommendation | AI-Enriched  |
| AI Retry Suggestion         | Retry guidance          | AI-Enriched  |
| AI Infra Fix Suggestion     | Infra remediation       | AI-Enriched  |
| AI Cost Impact              | Estimated cloud impact  | AI-Enriched  |
| AI Predictive Failure Score | Future risk             | AI-Enriched  |
| AI Confidence Trend         | Confidence history      | Computed     |
| Autonomous Fix Proposal     | Generated patch         | AI-Enriched  |
| Generated PR URL            | Auto-fix PR             | Deterministic |

These fields are AI-only — they are simply **omitted** from tickets when AI is disabled (no fallback).

---

## Example FULL Jira Ticket

### Summary

```txt
Terraform deployment failed in production due to backend state lock
```

### Description

````markdown
## PipelineIQ Failure Report

### Failure Summary
Terraform apply failed because the backend state lock could not be acquired.

### Root Cause
Another deployment is likely holding the Terraform state lock.

### Suggested Remediation
1. Verify active deployments
2. Unlock stale Terraform state
3. Retry pipeline

---

## Pipeline Metadata
| Field        | Value           |
|--------------|-----------------|
| Pipeline     | deploy-prod     |
| Repository   | infra-platform  |
| Branch       | main            |
| Commit       | a1b2c3d         |
| Environment  | Production      |
| Failed Step  | terraform apply |

---

## Failure Details
| Field             | Value          |
|-------------------|----------------|
| Failure Type      | Infrastructure |
| Exit Code         | 1              |
| Retry Count       | 2              |
| Similar Failures  | 7              |

---

## Relevant Logs
```log
Error acquiring state lock
Lock Info:
  ID: 8d7a6
  Operation: apply
```

---

## Links
* Pipeline URL
* Commit URL
* PR URL
* Related Jira Issues
````

---

## Recommended Jira Issue Type Mapping

| Scenario          | Jira Type         |
| ----------------- | ----------------- |
| Build failure     | Bug               |
| Deployment outage | Incident          |
| Infra drift       | Problem           |
| Security issue    | Security Incident |
| Test failure      | Bug               |
| Retry issue       | Task              |

---

## Strategic Insight

Most integrations today populate:

* 5–10 fields

PipelineIQ populates:

# 80–120 operational fields intelligently.

That becomes:

# the competitive moat.

Because enterprises care about:

* context
* traceability
* operational intelligence
* MTTR reduction
* auditability
* reliability analytics

not just:

# "create ticket."

---

# 14. AI Intelligence Engine

> **AI is OPTIONAL.** PipelineIQ must produce useful, well-structured Jira tickets whether or not the AI engine is enabled. The core ticket creation flow has zero hard dependency on any LLM provider. AI is an **enrichment layer** that augments — never gates — ticket creation.

## AI Modes

| Mode         | Behavior                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `disabled`   | No AI calls. All AI-enriched fields use deterministic fallbacks. Postmortem/Timeline omitted.   |
| `assist`     | AI generates summary/RCA/remediation; deterministic fallback used on AI failure or low confidence. |
| `full`       | All AI features enabled, including postmortems, predictive scores, and advanced fields.         |

The default mode in OSS is `disabled`. Pro tier defaults to `assist`. Enterprise tier defaults to `full`.

## AI Inputs

* logs
* stack traces
* workflow metadata
* deployment metadata
* historical failures

## AI Outputs

* concise summaries
* RCA suggestions
* remediation guidance
* severity predictions
* duplicate similarity analysis

## Deterministic Fallback Strategy (when AI is disabled or fails)

Every AI-enriched field has a deterministic producer. The `core` engine resolves each enrichment slot through a chain:

```txt
field value = AI producer (if enabled & succeeds & confidence ≥ threshold)
           → deterministic producer (always)
           → null / omitted (only for advanced AI-only fields)
```

| AI Field            | Deterministic Fallback                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| Summary / Title     | Template: `"{workflow} failed at {step} on {branch} (exit {code})"`                 |
| RCA                 | Signature-library lookup (regex/keyword patterns → known cause)                     |
| Remediation         | Static knowledge-base keyed by `failure_category`                                   |
| Classification      | Pattern-matched category from log signatures (Terraform / npm / Helm / JUnit / ...) |
| Severity            | Rules: env=prod + outage signature → High; test failure on PR → Medium; etc.        |
| Owner Suggestion    | CODEOWNERS → commit author → repo admin                                             |
| Tags / Labels       | `{category, branch, repo, env}` auto-labels                                         |
| Risk Assessment     | Heuristic: branch + env + recent failure rate                                       |
| Postmortem Summary  | **Omitted** (AI-only field — gracefully absent)                                     |
| Predictive Scores   | **Omitted** (AI-only field — gracefully absent)                                     |

## Architectural Contract

The `core` engine treats enrichment as a pipeline:

```txt
FailureEvent
   → DeterministicEnricher  (always runs — pulls all available payload data)
   → ComputedEnricher       (always runs — dedup signature, history, classification heuristics)
   → AIEnricher             (optional — only if mode ≠ 'disabled')
   → JiraTicketSpec
```

This guarantees:

* `core` and `jira-client` have **zero hard dependency** on `ai-engine`.
* `ai-engine` is a swappable package — Google Gemini (default), OpenAI, Anthropic, Azure OpenAI, or local models.
* OSS tier ships fully functional **without** any AI API key configured.

---

# 15. Failure Classification Engine

## Categories

| Category       | Examples             |
| -------------- | -------------------- |
| Infrastructure | Terraform/Kubernetes |
| Build          | Compilation          |
| Deployment     | Helm/K8s deploy      |
| Test           | Unit/integration     |
| Dependency     | npm/pip/maven        |
| Security       | Secret scanning      |
| Authentication | OAuth/token          |
| Timeout        | Long-running jobs    |
| Network        | DNS/connectivity     |
| Cloud Provider | Azure/AWS/GCP        |

---

# 16. Deduplication Engine

## Deduplication Rules

A failure is duplicate if:

* same repo
* same workflow
* same failed step
* same signature
* same category
* within configurable time window

Then:

* update existing Jira issue
  instead of creating new one.

---

# 17. Recommended Tech Stack

| Layer             | Technology            |
| ----------------- | --------------------- |
| Language          | TypeScript            |
| Runtime           | Node.js 20            |
| Monorepo          | Turborepo             |
| Build Tool        | tsup                  |
| Package Manager   | pnpm                  |
| Testing           | Vitest                |
| Logging           | pino                  |
| Validation        | zod                   |
| GitHub APIs       | octokit               |
| Azure DevOps APIs | azure-devops-node-api |
| Jira APIs         | Direct REST           |
| AI SDK            | OpenAI SDK            |
| CLI               | commander             |
| Dashboard         | Next.js               |

---

# 18. Security Requirements

| Requirement        | Description           |
| ------------------ | --------------------- |
| Secret masking     | Remove sensitive data |
| OAuth support      | Secure integrations   |
| PAT support        | Token auth            |
| Audit logging      | Traceability          |
| Encryption         | Secret storage        |
| Webhook validation | Event verification    |
| RBAC               | Access control        |
| Tenant isolation   | Multi-tenant security |

---

# 19. Performance Requirements

| Metric                | Target  |
| --------------------- | ------- |
| Installation Time     | <5 min  |
| Jira Ticket Creation  | <30 sec |
| AI Summary Generation | <15 sec |
| Log Parsing           | <10 sec |
| Dedup Accuracy        | >90%    |

---

# 20. Competitive Analysis

| Product                 | Weakness           |
| ----------------------- | ------------------ |
| Jira Native Integration | Low intelligence   |
| GitHub Jira Actions     | Basic automation   |
| PagerDuty               | Weak CI/CD context |
| Datadog CI Visibility   | Expensive          |
| Harness SRM             | Complex setup      |
| OpsGenie                | Alert-focused      |

PipelineIQ differentiation:

* lightweight
* developer-native
* AI-powered
* CI/CD-focused
* operational intelligence

---

# 21. Monetization Strategy

# OSS Tier

* Jira ticket creation
* workflow metadata
* basic parsing

---

# Pro Tier

* AI summaries
* RCA
* deduplication
* analytics

---

# Enterprise Tier

* SSO/SAML
* audit logs
* governance
* self-hosted deployment
* SLA

---

# 22. Roadmap

# Phase 1 — MVP

* GitHub Action
* Azure DevOps extension
* Jira issue creation
* log parsing

---

# Phase 2 — Intelligence

* AI summaries
* remediation guidance
* failure categorization
* deduplication

---

# Phase 3 — Analytics

* dashboards
* reliability trends
* MTTR metrics

---

# Phase 4 — Enterprise

* RBAC
* SSO
* audit logging
* multi-tenancy

---

# Phase 5 — Autonomous Ops

* AI remediation
* rollback recommendations
* predictive failures

---

# 23. Success Metrics

| KPI                         | Goal          |
| --------------------------- | ------------- |
| Setup Time                  | <5 min        |
| MTTR Reduction              | 20%+          |
| Duplicate Ticket Reduction  | 70%+          |
| OSS Adoption                | High          |
| GitHub Marketplace Installs | Growth target |
| Enterprise Conversion       | Strong        |

---

# 24. Long-Term Vision

PipelineIQ evolves from:

# “Jira ticket automation”

into:

# “AI-powered DevOps operational intelligence platform.”

Future expansion:

* Kubernetes intelligence
* Terraform intelligence
* deployment analytics
* SRE copilots
* autonomous remediation
* AI operations agents

Note: Core is that it should be able to create Jira tickets for failures from both Azure DevOps and GitHub.

Note: This can be MCP as well later so make it compatible for the same