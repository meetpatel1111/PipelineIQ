# Changelog

All notable changes to PipelineIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
