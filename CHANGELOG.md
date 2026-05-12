# Changelog

All notable changes to PipelineIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.2] - 2025-05-13

### Changed
- Updated all package versions to 0.2.2
- Added `publishConfig.access: "public"` to enable unscoped publishing
- Updated import statements across all packages
- Updated documentation and examples to use unscoped package names
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
