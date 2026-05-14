# Changelog

All notable changes to PipelineIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
