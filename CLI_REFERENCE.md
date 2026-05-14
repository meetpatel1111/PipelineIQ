# PipelineIQ CLI Reference

Complete reference for the `pipelineiq` command-line interface — covering all 101 CLI flags, all auto-read environment variables, and every value that reaches a Jira ticket.

---

## Table of Contents

- [Installation](#installation)
- [Global Options](#global-options)
- [Commands](#commands)
  - [analyze](#analyze)
  - [config](#config)
  - [parse](#parse)
  - [test](#test)
- [Config File](#config-file)
- [analyze — Complete Flag Reference](#analyze--complete-flag-reference)
  - [General Flags](#general-flags)
  - [Jira Flags](#jira-flags)
  - [AI Flags](#ai-flags)
  - [Core Pipeline Context](#core-pipeline-context)
  - [GitHub Actions — CLI Flags](#github-actions--cli-flags)
  - [GitHub Actions — Auto-read Env Vars (no CLI override)](#github-actions--auto-read-env-vars-no-cli-override)
  - [Azure DevOps — CLI Flags](#azure-devops--cli-flags)
  - [Azure DevOps — Auto-read Env Vars (no CLI override)](#azure-devops--auto-read-env-vars-no-cli-override)
  - [Display & Metadata](#display--metadata)
- [display-meta Field Keys](#display-meta-field-keys)
- [Examples](#examples)

---

## Installation

```bash
npm install -g pipelineiq
```

Requires **Node.js ≥ 20.0.0**.

```bash
pipelineiq --version   # verify install
pipelineiq --help      # top-level help
pipelineiq analyze --help  # command-level help
```

---

## Global Options

| Flag | Description |
|---|---|
| `-V, --version` | Print version and exit |
| `-h, --help` | Show help for the current command |

---

## Commands

### analyze

Analyze a CI/CD failure and create or update a Jira ticket.

```
pipelineiq analyze [options]
```

**Two operating modes:**

| Mode | Trigger | Behavior |
|---|---|---|
| **Log file** | `--logs <path>` is provided | Reads and parses the file/directory; builds context from flags + env vars |
| **Platform API** | `--logs` is omitted | Fetches logs directly from GitHub Actions REST API or Azure DevOps; requires `GITHUB_TOKEN` |

**Configuration precedence (highest → lowest):**

1. CLI flags
2. `pipelineiq.json` (path set by `--config`)
3. Environment variables (`JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`, `JIRA_PROJECT`)

---

### config

Manage the `pipelineiq.json` configuration file.

```
pipelineiq config [options]
```

| Flag | Description |
|---|---|
| `-i, --init` | Interactive wizard — prompts for Jira URL, email, token, project, AI mode; writes `./pipelineiq.json` |
| `-s, --show` | Print current `./pipelineiq.json` as formatted JSON |
| `-v, --validate` | Validate the config file against the schema; exits 1 if invalid |
| `-c, --config <path>` | Config file path (default: `./pipelineiq.json`) |

---

### parse

Parse a log file and extract structured failure data without creating a Jira ticket.

```
pipelineiq parse [options]
```

| Flag | Default | Description |
|---|---|---|
| `-l, --logs <path>` | — | Path to log file or directory |
| `-f, --format <format>` | `generic` | Log format parser |
| `-o, --output <path>` | `./parsed-logs.json` | Output path for the parsed JSON |

Output JSON contains: `entries`, `errorMessages`, `stackTraces`, `exitCodes`, `failedCommands`, `truncated`.

---

### test

Test connectivity to Jira and/or the AI provider.

```
pipelineiq test [options]
```

| Flag | Description |
|---|---|
| `-c, --config <path>` | Config file path (default: `./pipelineiq.json`) |
| `--jira` | Test Jira connectivity (fetches the configured project) |
| `--ai` | Test AI provider availability |
| `--ai-provider <provider>` | Override provider for this test |
| `--ai-model <model>` | Override model for this test |
| `--ai-api-key <key>` | Override API key for this test |

---

## Config File

Default path: `./pipelineiq.json`. Override with `--config`.

```json
{
  "jira": {
    "type": "cloud",
    "baseUrl": "https://yourorg.atlassian.net",
    "email": "ci-bot@yourorg.com",
    "apiToken": "your-jira-api-token",
    "username": "",
    "password": "",
    "strictGDPR": false
  },
  "jiraProject": "DEVOPS",
  "issueType": "Bug",
  "defaultAssignee": "5b10a2844c20165700ede21g",
  "ai": {
    "mode": "disabled",
    "provider": "gemini",
    "apiKey": "your-ai-api-key",
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "maxLogTokens": 4000,
    "minConfidence": 0.6
  },
  "dedup": {
    "enabled": true,
    "windowHours": 24
  }
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `jira.type` | `"cloud"` \| `"server"` | No | `"cloud"` | Jira instance type |
| `jira.baseUrl` | string | **Yes** | — | Jira organization URL |
| `jira.email` | string | **Yes** | — | Service account email |
| `jira.apiToken` | string | **Yes** | — | API token (Cloud) or PAT (Server) |
| `jira.username` | string | No | — | Username for Jira Server basic auth |
| `jira.password` | string | No | — | Password for Jira Server basic auth |
| `jira.strictGDPR` | boolean | No | `false` | Strip user identifiers from ticket content |
| `jiraProject` | string | **Yes** | — | Jira project key (e.g., `DEVOPS`) |
| `issueType` | string | No | `"Bug"` | Jira issue type |
| `defaultAssignee` | string | No | unassigned | Jira account ID |
| `ai.mode` | `"disabled"` \| `"assist"` \| `"full"` | No | `"disabled"` | AI enrichment mode |
| `ai.provider` | `"openai"` \| `"anthropic"` \| `"azure-openai"` \| `"gemini"` | No | `"gemini"` | AI provider |
| `ai.apiKey` | string | No | — | API key for the AI provider |
| `ai.model` | string | No | provider default | Specific model name |
| `ai.temperature` | number (0–2) | No | `0.7` | Sampling temperature |
| `ai.maxLogTokens` | integer | No | `4000` | Max tokens sent to AI |
| `ai.minConfidence` | number (0–1) | No | `0.6` | Minimum confidence to accept AI result |
| `dedup.enabled` | boolean | No | `true` | Enable duplicate issue detection |
| `dedup.windowHours` | integer | No | `24` | Lookback window in hours |

---

## analyze — Complete Flag Reference

### General Flags

| Flag | Default | Description |
|---|---|---|
| `-l, --logs <path>` | — | Path to a log file or directory. Directories: reads last 10 `*.log` / `*.txt` / `*.out` files |
| `-f, --format <format>` | `generic` | Log format: `github-actions`, `azure-devops`, `terraform`, `kubernetes`, `docker`, `junit`, `generic` |
| `-s, --source <source>` | `github` | Platform source: `github` or `azure-devops`. Auto-detected from env if omitted |
| `-c, --config <path>` | `./pipelineiq.json` | Path to the config file |
| `--dry-run` | `false` | Print the result JSON without calling the Jira API |
| `--github-token <token>` | `$GITHUB_TOKEN` | GitHub token for Platform API mode (fetching run logs and job data) |

---

### Jira Flags

All override the corresponding `pipelineiq.json` value for the current run.

| Flag | Env fallback | Description |
|---|---|---|
| `--jira-url <url>` | `$JIRA_URL` | Jira base URL (e.g., `https://yourorg.atlassian.net`) |
| `--jira-email <email>` | `$JIRA_EMAIL` | Email of the Jira service account |
| `--jira-token <token>` | `$JIRA_TOKEN` | Jira API token (Cloud) or personal access token (Server) |
| `--jira-project <key>` | `$JIRA_PROJECT` | Jira project key (e.g., `DEVOPS`, `OPS`) |
| `--issue-type <type>` | config → `Bug` | Jira issue type to create |
| `--assignee <id>` | — | Jira account ID to assign the issue to |
| `--default-assignee <id>` | — | Alias for `--assignee` |
| `--dedup-window <hours>` | config → `24` | Hours to look back when detecting duplicate issues |

---

### AI Flags

| Flag | Default | Description |
|---|---|---|
| `--ai-mode <mode>` | `disabled` | `disabled` — deterministic only; `assist` — AI adds RCA + remediation; `full` — AI enriches all fields |
| `--ai-provider <provider>` | `gemini` | `openai`, `anthropic`, `azure-openai`, `gemini` |
| `-m, --ai-model <model>` | provider default | Model name: `gpt-4o`, `claude-3-5-sonnet-20241022`, `gemini-2.5-flash`, etc. |
| `--ai-api-key <key>` | — | API key for the selected provider |
| `--ai-max-tokens <tokens>` | `4000` | Maximum tokens for the AI response |

---

### Core Pipeline Context

These flags apply to **both GitHub Actions and Azure DevOps**. When inside either platform, values are auto-read from the corresponding environment variables — flags are only needed for local testing or CI wrappers that don't set standard env vars.

| Flag | GitHub env | ADO env | Description |
|---|---|---|---|
| `--repository <owner/repo>` | `GITHUB_REPOSITORY` | `BUILD_REPOSITORY_NAME` | Repository in `owner/repo` format |
| `--repository-owner <owner>` | `GITHUB_REPOSITORY_OWNER` | `SYSTEM_TEAMPROJECT` | Repository owner or team project |
| `--branch <branch>` | `GITHUB_REF` | `BUILD_SOURCEBRANCH` | Branch name or full ref |
| `--commit <sha>` | `GITHUB_SHA` | `BUILD_SOURCEVERSION` | Commit SHA |
| `--pipeline <name>` | `GITHUB_WORKFLOW` | `BUILD_DEFINITIONNAME` | Pipeline or workflow name |
| `--run-id <id>` | `GITHUB_RUN_ID` | `BUILD_BUILDID` | Unique run/build ID |
| `--run-number <number>` | `GITHUB_RUN_NUMBER` | `BUILD_BUILDNUMBER` | Sequential run number |
| `--run-url <url>` | auto-constructed | `BUILD_BUILDURI` | Direct URL to the pipeline run |
| `--run-attempt <count>` | `GITHUB_RUN_ATTEMPT` | `SYSTEM_JOBATTEMPT` | Retry attempt number (1-based) |
| `--event-name <name>` | `GITHUB_EVENT_NAME` | `BUILD_REASON` | Trigger event (`push`, `Manual`, `Schedule`, etc.) |
| `--environment <env>` | `$ENVIRONMENT` | `ENVIRONMENT_NAME` | Deployment environment label (`dev`, `staging`, `production`) |
| `--actor <name>` | `GITHUB_ACTOR` | `BUILD_REQUESTEDFOR` | Username who triggered the run |
| `--job-name <name>` | `GITHUB_JOB` | `SYSTEM_JOBNAME` | Job or phase name |
| `--runner-os <os>` | `RUNNER_OS` | `AGENT_OS` | Operating system (`Linux`, `Windows`, `macOS`) |
| `--runner-arch <arch>` | `RUNNER_ARCH` | `AGENT_OSARCHITECTURE` | CPU architecture (`X64`, `ARM64`) |
| `--api-url <url>` | `GITHUB_API_URL` | `SYSTEM_COLLECTIONURI` | REST API base URL |

---

### GitHub Actions — CLI Flags

Flags specific to GitHub Actions. Values are automatically populated from `GITHUB_*` / `RUNNER_*` environment variables when running inside a workflow. Use these flags to override when running the CLI locally or outside of standard Actions runners.

| Flag | Env fallback | GitHub context | Description |
|---|---|---|---|
| `--ref <ref>` | `GITHUB_REF` | `github.ref` | Full git ref (e.g., `refs/heads/main`, `refs/pull/42/merge`) |
| `--ref-protected <bool>` | `GITHUB_REF_PROTECTED` | `github.ref_protected` | `true` if branch protection rules apply |
| `--base-ref <ref>` | `GITHUB_BASE_REF` | `github.base_ref` | Target branch of a pull request |
| `--head-ref <ref>` | `GITHUB_HEAD_REF` | `github.head_ref` | Source branch of a pull request |
| `--workflow-ref <ref>` | `GITHUB_WORKFLOW_REF` | `github.workflow_ref` | Full ref path to the workflow file |
| `--workflow-sha <sha>` | `GITHUB_WORKFLOW_SHA` | `github.workflow_sha` | Commit SHA of the workflow file |
| `--graphql-url <url>` | `GITHUB_GRAPHQL_URL` | `github.graphql_url` | GitHub GraphQL API URL |
| `--workspace <path>` | `GITHUB_WORKSPACE` | `github.workspace` | Default working directory on the runner |
| `--retention-days <days>` | `GITHUB_RETENTION_DAYS` | `github.retention_days` | Days that workflow logs and artifacts are retained |
| `--runner-temp <path>` | `RUNNER_TEMP` | `runner.temp` | Runner temporary directory |
| `--runner-tool-cache <path>` | `RUNNER_TOOL_CACHE` | `runner.tool_cache` | Runner pre-installed tools directory |
| `--runner-workspace <path>` | `RUNNER_WORKSPACE` | `runner.workspace` | Runner workspace directory |
| `--job-status <status>` | — | `job.status` | Current job status (`success`, `failure`, `cancelled`) |
| `--job-container <json>` | — | `job.container` | JSON string of job container details |
| `--job-services <json>` | — | `job.services` | JSON string of service container details |
| `--strategy-job-index <n>` | — | `strategy.job-index` | Index of the current matrix job (0-based) |
| `--strategy-job-total <n>` | — | `strategy.job-total` | Total number of matrix jobs |
| `--action <name>` | `GITHUB_ACTION` | `github.action` | Name of the currently running action |
| `--action-path <path>` | `GITHUB_ACTION_PATH` | `github.action_path` | Filesystem path to the action |
| `--action-repository <repo>` | `GITHUB_ACTION_REPOSITORY` | `github.action_repository` | Owner/repo of the action |
| `--action-ref <ref>` | `GITHUB_ACTION_REF` | — | Git ref of the action |
| `--action-status <status>` | `GITHUB_ACTION_STATUS` | — | Status of the action execution |
| `--repository-git-url <url>` | `GITHUB_REPOSITORY_URL` | — | Git clone URL for the repository |
| `--secret-source <source>` | `GITHUB_SECRET_SOURCE` | — | Secret source identifier (`Actions`, `Dependabot`, `None`) |
| `--event-payload <json>` | — | `github.event` | Full JSON string of the triggering event payload |

---

### GitHub Actions — Auto-read Env Vars (no CLI override)

The following values are **read automatically from environment variables** when running inside a GitHub Actions workflow. They cannot be overridden via CLI flag — they are populated only from the runner environment.

| Environment variable | GitHub context | Description |
|---|---|---|
| `GITHUB_SERVER_URL` | `github.server_url` | GitHub server URL (e.g., `https://github.com` or GHES URL). Used to construct repository and run URLs. |
| `GITHUB_ACTOR_ID` | `github.actor_id` | Numeric account ID of the actor who triggered the run |
| `GITHUB_JOB` | `github.job` | The `job_id` key of the current job in the workflow YAML |
| `GITHUB_REF_NAME` | `github.ref_name` | Short ref name of the branch or tag (e.g., `main`, `v1.0.0`) |
| `GITHUB_REF_TYPE` | `github.ref_type` | Type of ref that triggered the run: `branch` or `tag` |
| `GITHUB_REPOSITORY_ID` | `github.repository_id` | Numeric ID of the repository |
| `GITHUB_REPOSITORY_OWNER_ID` | `github.repository_owner_id` | Numeric account ID of the repository owner |
| `GITHUB_TRIGGERING_ACTOR` | `github.triggering_actor` | Username of the actor who triggered the run (differs from actor on re-runs) |
| `RUNNER_DEBUG` | `runner.debug` | Set to `"1"` when debug logging is enabled; stored as boolean `true` |
| `RUNNER_ENVIRONMENT` | `runner.environment` | `github-hosted` or `self-hosted` |
| `RUNNER_NAME` | `runner.name` | Display name of the runner executing the job |

> **Note:** `GITHUB_BASE_REF`, `GITHUB_HEAD_REF`, `GITHUB_WORKFLOW_REF`, `GITHUB_WORKFLOW_SHA`, `GITHUB_WORKSPACE`, `GITHUB_RETENTION_DAYS` are read from env vars but also have CLI flag overrides (see above table).

---

### Azure DevOps — CLI Flags

Flags specific to Azure DevOps. When running inside an Azure Pipelines job, all values are auto-populated from `BUILD_*`, `AGENT_*`, `SYSTEM_*`, and `RELEASE_*` environment variables. Use these flags to override when testing locally.

#### Agent

| Flag | Env fallback | ADO variable | Description |
|---|---|---|---|
| `--agent-id <id>` | `AGENT_ID` | `Agent.Id` | Unique numeric ID of the agent |
| `--agent-name <name>` | `AGENT_NAME` | `Agent.Name` | Agent display name (also used as runner name) |
| `--agent-machine-name <name>` | `AGENT_MACHINENAME` | `Agent.MachineName` | Hostname of the agent machine |
| `--agent-build-directory <path>` | `AGENT_BUILDDIRECTORY` | `Agent.BuildDirectory` | Root directory for build folders on the agent |
| `--agent-home-directory <path>` | `AGENT_HOMEDIRECTORY` | `Agent.HomeDirectory` | Directory where the agent software is installed |
| `--agent-temp-directory <path>` | `AGENT_TEMPDIRECTORY` | `Agent.TempDirectory` | Temp directory for the current job (cleaned after each job) |
| `--agent-tools-directory <path>` | `AGENT_TOOLSDIRECTORY` | `Agent.ToolsDirectory` | Tool cache directory for pre-installed tools |
| `--agent-work-folder <path>` | `AGENT_WORKFOLDER` | `Agent.WorkFolder` | Agent working directory root |
| `--agent-container-mapping <json>` | `AGENT_CONTAINERMAPPING` | `Agent.ContainerMapping` | JSON mapping of container resource names to Docker IDs |
| `--agent-release-directory <path>` | `AGENT_RELEASEDIRECTORY` | `Agent.ReleaseDirectory` | Directory where release artifacts are downloaded |
| `--agent-root-directory <path>` | `AGENT_ROOTDIRECTORY` | `Agent.RootDirectory` | Working root directory of the agent |

#### Build

| Flag | Env fallback | ADO variable | Description |
|---|---|---|---|
| `--sources-directory <path>` | `BUILD_SOURCESDIRECTORY` | `Build.SourcesDirectory` | Directory where source code is checked out |
| `--binaries-directory <path>` | `BUILD_BINARIESDIRECTORY` | `Build.BinariesDirectory` | Output directory for compiled binaries |
| `--artifact-staging-directory <path>` | `BUILD_ARTIFACTSTAGINGDIRECTORY` | `Build.ArtifactStagingDirectory` | Staging directory for publishing artifacts |
| `--staging-directory <path>` | `BUILD_STAGINGDIRECTORY` | `Build.StagingDirectory` | Alias for artifact staging directory |
| `--repository-local-path <path>` | `BUILD_REPOSITORY_LOCALPATH` | `Build.Repository.LocalPath` | Local path of the repository on the agent |
| `--container-id <id>` | `BUILD_CONTAINERID` | `Build.ContainerId` | Artifact container ID |
| `--definition-version <version>` | `BUILD_DEFINITIONVERSION` | `Build.DefinitionVersion` | Build definition version number |
| `--stage-requested-by <name>` | `BUILD_STAGEREQUESTBY` | `Build.StageRequestedBy` | Display name of the user who manually triggered the stage |
| `--stage-requested-for-id <id>` | `BUILD_STAGEREQUESTFORID` | `Build.StageRequestedForId` | GUID of the user who triggered the stage |
| `--source-tfvc-shelveset <name>` | `BUILD_SOURCETFVCSHELVESET` | `Build.SourceTfvcShelveset` | TFVC shelveset name (gated and shelveset builds only) |

#### System

| Flag | Env fallback | ADO variable | Description |
|---|---|---|---|
| `--system-debug <bool>` | `SYSTEM_DEBUG` | `System.Debug` | `true` when verbose system logging is enabled |
| `--system-default-working-directory <path>` | `SYSTEM_DEFAULTWORKINGDIRECTORY` | `System.DefaultWorkingDirectory` | Default working directory for all pipeline tasks |
| `--system-team-foundation-collection-uri <url>` | `SYSTEM_TEAMFOUNDATIONCOLLECTIONURI` | `System.TeamFoundationCollectionUri` | Azure DevOps / TFS organization URL |
| `--pipeline-workspace <path>` | `PIPELINE_WORKSPACE` | `Pipeline.Workspace` | Pipeline workspace directory |

#### Test

| Flag | Env fallback | ADO variable | Description |
|---|---|---|---|
| `--test-results-directory <path>` | `COMMON_TESTRESULTSDIRECTORY` | `Common.TestResultsDirectory` | Directory where test result files are written |

#### Release

| Flag | Env fallback | ADO variable | Description |
|---|---|---|---|
| `--release-id <id>` | `RELEASE_RELEASEID` | `Release.ReleaseId` | Unique release ID |
| `--release-name <name>` | `RELEASE_RELEASENAME` | `Release.ReleaseName` | Release name (e.g., `Release-42`) |
| `--release-uri <url>` | `RELEASE_RELEASEURI` | `Release.ReleaseUri` | URL to the release in Azure DevOps |
| `--release-description <text>` | `RELEASE_RELEASEDESCRIPTION` | `Release.ReleaseDescription` | Release description text |
| `--release-definition-id <id>` | `RELEASE_DEFINITIONID` | `Release.DefinitionId` | Release definition ID |
| `--release-definition-name <name>` | `RELEASE_DEFINITIONNAME` | `Release.DefinitionName` | Release definition name |
| `--release-definition-environment-id <id>` | `RELEASE_DEFINITIONENVIRONMENTID` | `Release.DefinitionEnvironmentId` | Release definition environment ID |
| `--release-environment-id <id>` | `RELEASE_ENVIRONMENTID` | `Release.EnvironmentId` | Release environment ID |
| `--release-environment-name <name>` | `RELEASE_ENVIRONMENTNAME` | `Release.EnvironmentName` | Release environment name |
| `--release-primary-artifact-source-alias <alias>` | `RELEASE_PRIMARYARTIFACTSOURCEALIAS` | `Release.PrimaryArtifactSourceAlias` | Alias of the primary artifact source |
| `--release-deployment-id <id>` | `RELEASE_DEPLOYMENTID` | `Release.DeploymentId` | Deployment ID |
| `--release-deployment-requested-for <name>` | `RELEASE_DEPLOYMENT_REQUESTEDFOR` | `Release.Deployment.RequestedFor` | Display name of the user who requested deployment |
| `--release-deployment-requested-for-email <email>` | `RELEASE_DEPLOYMENT_REQUESTEDFOREMAIL` | `Release.Deployment.RequestedForEmail` | Email of the user who requested deployment |

---

### Azure DevOps — Auto-read Env Vars (no CLI override)

The following values are **read automatically from environment variables** when running inside an Azure Pipelines job. They cannot be overridden via CLI flag.

#### Build (auto-read only)

| Environment variable | ADO variable | Description |
|---|---|---|
| `BUILD_REQUESTEDFOR` | `Build.RequestedFor` | Display name of the user who queued the build |
| `BUILD_REQUESTEDFOREMAIL` | `Build.RequestedForEmail` | Email of the user who queued the build |
| `BUILD_REQUESTEDFORID` | `Build.RequestedForId` | GUID of the user who queued the build |
| `BUILD_QUEUEDBY` | `Build.QueuedBy` | Display name of the agent or user who queued the build |
| `BUILD_QUEUEDBYID` | `Build.QueuedById` | GUID of the entity that queued the build |
| `BUILD_SOURCEBRANCHNAME` | `Build.SourceBranchName` | Short branch name without the `refs/heads/` prefix |
| `BUILD_SOURCEVERSIONMESSAGE` | `Build.SourceVersionMessage` | Commit message of the triggering commit |
| `BUILD_BUILDURI` | `Build.BuildUri` | URI that uniquely identifies this build |
| `BUILD_REPOSITORY_URI` | `Build.Repository.Uri` | URL of the repository |
| `BUILD_REPOSITORY_ID` | `Build.Repository.ID` | Repository ID |
| `BUILD_REPOSITORY_PROVIDER` | `Build.Repository.Provider` | Repository type (`TfsGit`, `GitHub`, `Bitbucket`, etc.) |
| `BUILD_REPOSITORY_CLEAN` | `Build.Repository.Clean` | Whether the repository was cleaned before building |
| `BUILD_REPOSITORY_GIT_SUBMODULECHECKOUT` | `Build.Repository.Git.SubmoduleCheckout` | Whether Git submodules are checked out |
| `BUILD_CRONSCHEDULE_DISPLAYNAME` | `Build.CronSchedule.DisplayName` | Display name of the cron schedule that triggered this build |

#### System (auto-read only)

| Environment variable | ADO variable | Description |
|---|---|---|
| `SYSTEM_COLLECTIONURI` | `System.CollectionUri` | Azure DevOps organization URL (auto-detected for source platform) |
| `SYSTEM_TEAMPROJECT` | `System.TeamProject` | Name of the team project |
| `SYSTEM_TEAMPROJECTID` | `System.TeamProjectId` | GUID of the team project |
| `SYSTEM_COLLECTIONID` | `System.CollectionId` | GUID of the Azure DevOps organization |
| `SYSTEM_DEFINITIONID` | `System.DefinitionId` | Build definition ID |
| `SYSTEM_TIMELINEID` | `System.TimelineId` | Timeline ID for this run |
| `SYSTEM_PLANID` | `System.PlanId` | Plan ID for this run |
| `SYSTEM_JOBID` | `System.JobId` | GUID of the current job |
| `SYSTEM_JOBNAME` | `System.JobName` | System name of the current job |
| `SYSTEM_JOBDISPLAYNAME` | `System.JobDisplayName` | Display name of the current job |
| `SYSTEM_JOBATTEMPT` | `System.JobAttempt` | Attempt number for the current job (1-based) |
| `SYSTEM_STAGENAME` | `System.StageName` | System name of the current stage |
| `SYSTEM_STAGEDISPLAYNAME` | `System.StageDisplayName` | Display name of the current stage |
| `SYSTEM_STAGEATTEMPT` | `System.StageAttempt` | Attempt number for the current stage |
| `SYSTEM_PHASENAME` | `System.PhaseName` | System name of the current phase (job) |
| `SYSTEM_PHASEDISPLAYNAME` | `System.PhaseDisplayName` | Display name of the current phase |
| `SYSTEM_PHASEATTEMPT` | `System.PhaseAttempt` | Attempt number for the current phase |
| `SYSTEM_WORKFOLDER` | `System.WorkFolder` | The agent's working folder |
| `SYSTEM_HOSTTYPE` | `System.HostType` | `build` or `release` |
| `SYSTEM_DEFAULTWORKINGDIRECTORY` | `System.DefaultWorkingDirectory` | Default working directory for tasks |
| `TF_BUILD` | `TF_BUILD` | Always `"True"` inside an Azure Pipelines job |
| `CHECKS_STAGEATTEMPT` | `Checks.StageAttempt` | Attempt number for the checks gate |

#### Strategy (auto-read only)

| Environment variable | ADO variable | Description |
|---|---|---|
| `STRATEGY_NAME` | `Strategy.Name` | Name of the deployment strategy (`runOnce`, `rolling`, `canary`) |
| `STRATEGY_CYCLENAME` | `Strategy.CycleName` | Cycle name within the strategy (`preDeploy`, `deploy`, `routeTraffic`, etc.) |

#### Environment / Deployment (auto-read only)

| Environment variable | ADO variable | Description |
|---|---|---|
| `ENVIRONMENT_NAME` | `Environment.Name` | Name of the target deployment environment |
| `ENVIRONMENT_ID` | `Environment.Id` | ID of the target deployment environment |
| `ENVIRONMENT_RESOURCENAME` | `Environment.ResourceName` | Name of the specific resource within the environment |
| `ENVIRONMENT_RESOURCEID` | `Environment.ResourceId` | ID of the specific resource within the environment |

#### Pull Request (auto-read only)

| Environment variable | ADO variable | Description |
|---|---|---|
| `SYSTEM_PULLREQUEST_ISFORK` | `System.PullRequest.IsFork` | `"True"` if the PR originates from a forked repository |
| `SYSTEM_PULLREQUEST_PULLREQUESTID` | `System.PullRequest.PullRequestId` | Pull request ID |
| `SYSTEM_PULLREQUEST_PULLREQUESTNUMBER` | `System.PullRequest.PullRequestNumber` | Pull request number (GitHub PRs in ADO) |
| `SYSTEM_PULLREQUEST_TARGETBRANCH` | `System.PullRequest.TargetBranch` | Full ref of the target branch |
| `SYSTEM_PULLREQUEST_TARGETBRANCHNAME` | `System.PullRequest.TargetBranchName` | Short name of the target branch |
| `SYSTEM_PULLREQUEST_SOURCEBRANCH` | `System.PullRequest.SourceBranch` | Full ref of the source branch |
| `SYSTEM_PULLREQUEST_SOURCECOMMITID` | `System.PullRequest.SourceCommitId` | Commit SHA of the source branch |
| `SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI` | `System.PullRequest.SourceRepositoryURI` | URI of the source repository (forks) |

#### Release Artifacts (auto-read only)

All environment variables matching `RELEASE_ARTIFACTS_*` are automatically scanned and captured as a dynamic map. They represent artifact metadata from upstream build pipelines.

| Pattern | Example | Description |
|---|---|---|
| `RELEASE_ARTIFACTS_<alias>_BUILDID` | `RELEASE_ARTIFACTS_MYAPP_BUILDID` | Build ID of the artifact source |
| `RELEASE_ARTIFACTS_<alias>_BUILDNUMBER` | `RELEASE_ARTIFACTS_MYAPP_BUILDNUMBER` | Build number of the artifact source |
| `RELEASE_ARTIFACTS_<alias>_DEFINITIONNAME` | `RELEASE_ARTIFACTS_MYAPP_DEFINITIONNAME` | Pipeline definition name |
| `RELEASE_ARTIFACTS_<alias>_SOURCEBRANCH` | `RELEASE_ARTIFACTS_MYAPP_SOURCEBRANCH` | Branch used to produce the artifact |
| `RELEASE_ARTIFACTS_<alias>_SOURCECOMMITID` | `RELEASE_ARTIFACTS_MYAPP_SOURCECOMMITID` | Commit SHA of the artifact |

---

### Display & Metadata

| Flag | Description |
|---|---|
| `--display-meta <fields>` | **Whitelist mode**: comma-separated list of field keys to show in the Jira ticket metadata table. When omitted, the default shows core fields + any field explicitly provided via a CLI flag. |
| `--meta <key=value>` | Attach a custom key-value pair to the ticket. Repeatable. Custom keys appear in the metadata table automatically without needing `--display-meta`. |

**Example:**
```bash
pipelineiq analyze \
  --meta "team=platform-infra" \
  --meta "oncall=@alice" \
  --meta "severity=P1" \
  --display-meta pipeline,branch,commit,step,runnerOs,team,oncall
```

---

## display-meta Field Keys

Pass these keys to `--display-meta` to control exactly which rows appear in the Jira ticket metadata table.

| Key | Label in ticket | Source |
|---|---|---|
| `source` | Source | Platform (`github` / `azure-devops`) |
| `pipeline` | Pipeline | Name + URL |
| `repository` | Repository | Owner/repo + URL |
| `branch` | Branch | Branch name |
| `commit` | Commit | Short SHA + URL |
| `commitMessage` | Commit Message | First 80 chars of commit message |
| `environment` | Environment | Deployment environment label |
| `step` | Failed Step | Specific step that failed |
| `stage` | Failed Stage | Stage name |
| `job` | Job | Failed job name (GitHub Actions) |
| `jobName` | Job Name | Job display name (Azure DevOps) |
| `eventName` | Event Name | Trigger event |
| `runNumber` | Run Number | Sequential run number |
| `runAttempt` | Run Attempt | Retry attempt number |
| `retryCount` | Retry Count | Number of retries (`attempt − 1`) |
| `triggeredBy` | Triggered By | Actor who triggered the run |
| `exitCode` | Exit Code | Process exit code |
| `duration` | Duration | Wall-clock run time |
| `startedAt` | Started At | Run start timestamp (UTC) |
| `runnerOs` | Runner OS | Operating system |
| `runnerArch` | Runner Arch | CPU architecture |
| `runnerType` | Runner Type | `github-hosted` / `self-hosted` |
| `runnerEnvironment` | Runner Environment | `github-hosted` / `self-hosted` (from `RUNNER_ENVIRONMENT`) |
| `runnerDebug` | Runner Debug | `true` if debug logging was enabled |
| `runnerName` | Agent Name | Runner or agent display name |
| `runnerTemp` | Runner Temp | Temporary directory |
| `runnerToolCache` | Runner Tool Cache | Tool cache path |
| `runnerWorkspace` | Runner Workspace | Workspace directory |
| `workspace` | Workspace | Working directory |
| `jobStatus` | Job Status | `success`, `failure`, or `cancelled` |
| `jobContainer` | Job Container | Container details |
| `jobServices` | Job Services | Service container details |
| `strategyIndex` | Matrix Index | `strategy.job-index` value |
| `strategyTotal` | Matrix Total | `strategy.job-total` value |
| `refType` | Ref Type | `branch` or `tag` |
| `refProtected` | Ref Protected | Whether branch protection applies |
| `workflowRef` | Workflow Ref | Full workflow file path |
| `workflowSha` | Workflow SHA | Commit SHA of the workflow file |
| `retentionDays` | Log Retention | Days logs are retained |
| `baseRef` | Base Ref | PR target branch |
| `headRef` | Head Ref | PR source branch |
| `action` | Action | Action name |
| `actionPath` | Action Path | Action filesystem path |
| `actionRepository` | Action Repo | Action repository |
| `actionRef` | Action Ref | Action git reference |
| `actionStatus` | Action Status | Action execution status |
| `repositoryGitUrl` | Repo Git URL | Git clone URL |
| `secretSource` | Secret Source | GitHub secret source |
| `apiUrl` | API URL | REST API URL |
| `graphqlUrl` | GraphQL URL | GraphQL API URL |
| `eventPayload` | Event Payload | `Included (JSON)` if present |
| `teamProject` | Team Project | ADO team project |
| `agentPool` | Agent Pool | ADO agent pool |
| `buildNumber` | Build Number | ADO build number |
| `buildUri` | Build URI | ADO build URI |
| `reason` | Build Reason | ADO build trigger reason |
| `requestedFor` | Requested For | ADO: build requestor name |
| `requestedForEmail` | Requester Email | ADO: build requestor email |
| `sourceBranchName` | Source Branch Name | ADO: short branch name |
| `fullSourceBranch` | Source Branch (full ref) | ADO: full `refs/heads/…` ref |
| `sourceVersionMessage` | Commit Message | ADO: `Build.SourceVersionMessage` |
| `repositoryClean` | Repo Clean | ADO: `Build.Repository.Clean` |
| `repositoryGitSubmoduleCheckout` | Git Submodule Checkout | ADO: submodule checkout mode |
| `agentId` | Agent ID | ADO agent ID |
| `agentMachineName` | Agent Machine | ADO agent hostname |
| `agentJobStatus` | Agent Job Status | ADO: `Agent.JobStatus` |
| `agentBuildDirectory` | Agent Build Dir | ADO agent build directory |
| `agentHomeDirectory` | Agent Home Dir | ADO agent install directory |
| `agentTempDirectory` | Agent Temp Dir | ADO agent temp directory |
| `agentToolsDirectory` | Agent Tools Dir | ADO agent tools directory |
| `agentWorkFolder` | Agent Work Folder | ADO agent work folder |
| `agentContainerMapping` | Container Mapping | ADO container mapping JSON |
| `agentReleaseDirectory` | Release Dir | ADO release artifacts directory |
| `agentRootDirectory` | Agent Root | ADO agent root directory |
| `pipelineWorkspace` | Pipeline Workspace | ADO pipeline workspace |
| `systemDebug` | System Debug | ADO: `System.Debug` |
| `systemDefaultWorkingDirectory` | Default Working Dir | ADO: default working directory |
| `systemCollectionUri` | Collection URI | ADO organization URL |
| `systemTeamFoundationCollectionUri` | TF Collection URI | ADO TFS collection URL |
| `systemJobDisplayName` | Job Display Name | ADO: `System.JobDisplayName` |
| `systemJobId` | Job ID | ADO: `System.JobId` |
| `systemJobName` | System Job Name | ADO: `System.JobName` |
| `systemPhaseAttempt` | Phase Attempt | ADO phase retry count |
| `systemPhaseDisplayName` | Phase Display Name | ADO phase display name |
| `systemPhaseName` | Phase Name | ADO phase system name |
| `systemPlanId` | System Plan ID | ADO plan ID |
| `systemStageAttempt` | Stage Attempt | ADO stage retry count |
| `systemStageDisplayName` | Stage Display Name | ADO stage display name |
| `systemStageName` | Stage Name | ADO stage system name |
| `systemWorkFolder` | System Work Folder | ADO system work folder |
| `systemHostType` | System Host Type | `build` or `release` |
| `systemCollectionId` | System Collection ID | ADO collection GUID |
| `systemTimelineId` | System Timeline ID | ADO timeline ID |
| `tfBuild` | TF Build | `True` in all ADO jobs |
| `checksStageAttempt` | Checks Stage Attempt | ADO checks gate attempt |
| `strategyName` | Strategy Name | ADO deployment strategy name |
| `strategyCycleName` | Strategy Cycle Name | ADO strategy cycle name |
| `cronScheduleDisplayName` | Cron Display Name | ADO cron schedule name |
| `releaseId` | Release ID | ADO release ID |
| `releaseName` | Release Name | ADO release name |
| `releaseUri` | Release URI | ADO release URL |
| `releaseDescription` | Release Description | ADO release description |
| `releaseDefinitionId` | Release Def ID | ADO release definition ID |
| `releaseDefinitionName` | Release Def Name | ADO release definition name |
| `releaseDefinitionEnvironmentId` | Release Def Env ID | ADO release definition environment ID |
| `releaseEnvironmentId` | Release Env ID | ADO release environment ID |
| `releaseEnvironmentName` | Release Env Name | ADO release environment name |
| `releasePrimaryArtifactSourceAlias` | Primary Artifact Alias | ADO primary artifact source alias |
| `releaseDeploymentId` | Release Deployment ID | ADO deployment ID |
| `releaseDeploymentRequestedFor` | Release Requested For | ADO deployment requestor name |
| `releaseDeploymentRequestedForEmail` | Release Requester Email | ADO deployment requestor email |
| `triggeredByDefinitionName` | Triggered By Pipeline | ADO: name of upstream pipeline |
| `triggeredByBuildNumber` | Triggered By Build # | ADO: upstream build number |
| `triggeredByDefinitionId` | Triggered By Def ID | ADO: upstream definition ID |
| `triggeredByBuildId` | Triggered By Build ID | ADO: upstream build ID |
| `environmentResourceName` | Env Resource Name | ADO deployment environment resource |
| `environmentId` | Environment ID | ADO deployment environment ID |
| `prIsFork` | PR Is Fork | ADO: whether PR is from a fork |
| `prId` | PR ID | ADO: pull request ID |
| `prNumber` | PR Number | ADO: pull request number |
| `prTargetBranchName` | PR Target Branch | ADO: PR target branch name |
| `prSourceBranch` | PR Source Branch | ADO: PR source branch |
| `prSourceCommitId` | PR Source Commit | ADO: PR source commit SHA |
| `prSourceRepoUri` | PR Source Repo URI | ADO: PR source repository URI (forks) |
| `prTargetBranch` | PR Target Branch (full) | ADO: full PR target branch ref |
| `stageRequestedBy` | Stage Requested By | ADO: user who triggered the stage |
| `stageRequestedForId` | Stage Requester ID | ADO: GUID of stage trigger user |
| `sourceTfvcShelveset` | TFVC Shelveset | ADO: TFVC shelveset name |
| `definitionId` | Definition ID | ADO build definition ID |
| `definitionVersion` | Definition Version | ADO build definition version |
| `containerId` | Container ID | ADO artifact container ID |
| `repositoryId` | Repository ID | Repository ID |
| `repositoryProvider` | Repo Provider | Repository provider type |
| `repositoryUri` | Repo URI | Repository URL |
| `repositoryLocalPath` | Repo Local Path | Local checkout path |
| `sourcesDirectory` | Sources Dir | Source code directory |
| `binariesDirectory` | Binaries Dir | Compiled output directory |
| `artifactStagingDirectory` | Artifact Staging Dir | Artifact staging directory |
| `stagingDirectory` | Staging Dir | Staging directory |
| `testResultsDirectory` | Test Results Dir | Test results directory |
| `requestedFor` | Requested For | Build requestor display name |
| `requestedForEmail` | Requester Email | Build requestor email |
| `requestedForId` | Requester ID | Build requestor GUID |
| `queuedBy` | Queued By | Queue entity display name |
| `queuedById` | Queued By ID | Queue entity GUID |

---

## Examples

### Minimal — local log file

```bash
pipelineiq analyze \
  --logs ./build.log \
  --jira-url https://myorg.atlassian.net \
  --jira-email ci@myorg.com \
  --jira-token $JIRA_API_TOKEN \
  --jira-project OPS \
  --repository myorg/api \
  --branch main \
  --commit abc1234 \
  --pipeline "CI Build"
```

---

### GitHub Actions — full automation (workflow step)

```yaml
- name: PipelineIQ — create Jira ticket on failure
  if: failure()
  run: |
    pipelineiq analyze \
      --jira-url ${{ secrets.JIRA_URL }} \
      --jira-email ${{ secrets.JIRA_EMAIL }} \
      --jira-token ${{ secrets.JIRA_TOKEN }} \
      --jira-project DEVOPS \
      --environment production
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

All `GITHUB_*` and `RUNNER_*` variables are auto-populated by the Actions runner. Only `--environment` is extra context.

---

### Azure DevOps — pipeline task step

```yaml
- script: |
    pipelineiq analyze \
      --source azure-devops \
      --jira-url $(JIRA_URL) \
      --jira-email $(JIRA_EMAIL) \
      --jira-token $(JIRA_TOKEN) \
      --jira-project OPS \
      --environment staging
  displayName: Create Jira ticket on failure
  condition: failed()
```

All `BUILD_*`, `AGENT_*`, `SYSTEM_*`, and `RELEASE_*` variables are auto-populated by the pipeline agent.

---

### AI-enriched with full field set

```bash
pipelineiq analyze \
  --logs ./test-output.log \
  --format github-actions \
  --jira-project DEVOPS \
  --ai-mode full \
  --ai-provider anthropic \
  --ai-api-key $ANTHROPIC_API_KEY \
  --ai-model claude-3-5-sonnet-20241022 \
  --environment production \
  --branch main \
  --commit $GITHUB_SHA
```

---

### Matrix build — track which shard failed

```bash
pipelineiq analyze \
  --logs ./shard-3.log \
  --jira-project OPS \
  --strategy-job-index 2 \
  --strategy-job-total 8 \
  --display-meta pipeline,branch,step,strategyIndex,strategyTotal
```

---

### Custom metadata on the Jira ticket

```bash
pipelineiq analyze \
  --logs ./build.log \
  --jira-project OPS \
  --meta "team=platform-infra" \
  --meta "oncall=@alice" \
  --meta "severity=P1" \
  --meta "deployment-tier=critical"
```

---

### Whitelist exactly which fields appear in the ticket

```bash
pipelineiq analyze \
  --logs ./build.log \
  --jira-project OPS \
  --display-meta pipeline,branch,commit,step,runnerOs,duration,triggeredBy
```

---

### Dry run — preview without creating a ticket

```bash
pipelineiq analyze \
  --logs ./build.log \
  --jira-project DEVOPS \
  --dry-run
```

---

### Test connectivity before deploying

```bash
pipelineiq test --jira --ai
```

---

### Initialize config interactively

```bash
pipelineiq config --init
pipelineiq config --validate
```
