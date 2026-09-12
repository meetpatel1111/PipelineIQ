# Contributing to PipelineIQ

We welcome contributions! This document provides guidelines for contributing to PipelineIQ.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm package manager
- TypeScript knowledge
- Familiarity with CI/CD systems

### Setup

```bash
# Clone the repository
git clone https://github.com/meetpatel1111/PipelineIQ.git
cd pipelineiq

# Install dependencies
npm install

# Build all components
npm run build

# Run tests
npm test
```

## 🏗 Architecture Overview

PipelineIQ follows a unified package architecture:

```
pipelineiq/
├── src/
│   ├── core/                 # Main processing engine
│   │   ├── pipeline.ts       # Pipeline processing logic
│   │   ├── resolve.ts        # Two-way Jira lifecycle synchronization
│   │   ├── dedup.ts          # Fingerprint stabilization and tail log slicing
│   │   ├── secret-mask.ts    # Dynamic runtime secret masking firewall
│   │   ├── jira/             # Jira REST API client and history analytics
│   │   ├── ai/               # AI enrichment with fallbacks and Prompt Factory
│   │   ├── log-parser/       # Multi-format log parsing & smart excerpts
│   │   ├── enrichers/        # Deterministic, computed, CODEOWNERS, and flaky enrichers
│   │   ├── self-healing/     # Autonomous patch generation, RAG, and PR orchestration
│   │   └── signatures.ts     # Failure pattern library
│   ├── cli/                  # Command-line interface (init, analyze, resolve, test)
│   ├── github-action/        # GitHub Actions integration (sticky comments & summaries)
│   ├── azure-devops/         # Azure DevOps integration
│   └── index.ts              # Main entry point
├── bin/pipelineiq           # CLI executable
├── action.yml               # GitHub Action metadata
├── task.json                # Azure DevOps task metadata
├── examples/                # Usage examples
└── docs/                    # Documentation
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write tests for all new functionality
- Use Vitest for unit tests
- Test both success and failure scenarios
- Mock external dependencies in tests
- Aim for high code coverage

### Commit Messages

- Use conventional commit format:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `docs:` - Documentation changes
  - `refactor:` - Code refactoring
  - `test:` - Test improvements
  - `chore:` - Maintenance tasks

Examples:
- `feat(ai): Add OpenAI provider support`
- `fix(core): Handle null values in signature matching`
- `docs(readme): Update installation instructions`

## 🎯 Contribution Areas

### Core Engine

- **Two-Way Lifecycle Sync**: Enhance auto-resolution transitions and comments in `src/core/resolve.ts`
- **Deduplication**: Improve signature matching algorithms and tail-log slicing in `src/core/dedup.ts`
- **Secret Firewall**: Enhance dynamic environment secret discovery and regex patterns in `src/core/secret-mask.ts`
- **Signature Library**: Add new failure patterns to `src/core/signatures.ts`
- **Enrichment**: Add new deterministic enrichers and CODEOWNERS identity mappings

### AI Engine

- **Providers**: Add support for new AI providers
- **Fallbacks**: Improve deterministic fallback logic
- **Prompts**: Optimize AI prompts for better results
- **Local Models**: Add support for local LLM runners

### Self-Healing Engine

- **Historical Resolution RAG**: Refine retrieval and priming from past resolved Jira incidents
- **Sandbox Verification**: Expand local verification runner feedback loop
- **Git Providers**: Add support for GitLab, Bitbucket, etc.
- **Safety**: Enhance guardrails, path filters, and dry-run reporting
- **Patch Generation**: Optimize AI prompt for surgical snippet patching

### Log Parser

- **Formats**: Add support for new log formats
- **Extractors**: Improve pattern extraction algorithms
- **Performance**: Optimize large log file processing

### Jira Client & Analytics

- **Flaky Intelligence**: Refine flakiness scoring and retry-resolved metrics in `src/core/jira/history.ts`
- **ADF Conversion**: Improve markdown to ADF conversion
- **API Coverage**: Add support for more Jira APIs
- **Error Handling**: Improve error handling, retries, and rate limiting

### Integrations

- **GitHub Action**: Enhance PR sticky comments and execution step summaries
- **Azure DevOps**: Enhance Azure DevOps task inputs and pipeline reporting
- **CLI**: Add new CLI commands, interactive wizard steps, and flags
- **Documentation**: Keep references in sync with new features

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test --watch

# Run tests with coverage
npm test --coverage
```

### Test Structure

Tests are co-located with the code they cover, inside `__tests__/` directories, and use the `*.test.ts` suffix:

```
src/core/
├── __tests__/renderer-metrics.test.ts
├── ai/__tests__/local-provider.test.ts
├── enrichers/__tests__/deterministic.test.ts
├── jira/__tests__/errors.test.ts
├── jira/__tests__/history-metrics.test.ts
├── log-parser/__tests__/smart-excerpt.test.ts
├── notifications/__tests__/{slack,teams,service}.test.ts
├── self-healing/__tests__/engine.test.ts
└── types/__tests__/config.test.ts
```

## 📚 Documentation

### API Documentation

- Keep the CLI surface documented in `CLI_REFERENCE.md`
- Keep architecture notes in `ARCHITECTURE.md` in sync with code
- Add JSDoc to all public exports (they generate the published `.d.ts` types)
- Document error handling and edge cases

### Examples

- Add practical examples to `examples/`
- Cover different use cases and platforms
- Include configuration examples
- Provide troubleshooting guides

## 🚀 Submitting Changes

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: Add amazing feature'`
4. **Push** to your fork: `git push origin feature/amazing-feature`
5. **Create** a Pull Request

### PR Requirements

- Include tests for new functionality
- Update documentation if needed
- Pass all existing tests
- Follow code style guidelines
- Include clear description of changes
- Reference related issues

## 🐛 Bug Reports

### Reporting Issues

- Use the issue tracker with appropriate labels
- Provide detailed reproduction steps
- Include environment information
- Add logs and error messages
- Suggest expected behavior

### Bug Report Template

```markdown
## Bug Description
**Version:** [version]
**Environment:** [environment]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Logs/Errors
[Relevant logs or error messages]

### Additional Context
[Any additional context]
```

## 💡 Feature Requests

### Requesting Features

- Check existing issues and PRDs first
- Provide clear use case and requirements
- Consider impact on existing functionality
- Suggest implementation approach if possible

### Feature Request Template

```markdown
## Feature Request
**Use Case:** [Describe the use case]

### Problem Statement
[Current problem or limitation]

### Proposed Solution
[Describe the proposed solution]

### Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

### Additional Notes
[Any additional context or constraints]
```

## 🤝 Community

### Getting Help

- Check [Discussions](https://github.com/meetpatel1111/PipelineIQ/discussions)
- Review existing issues and PRs

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's code of conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to PipelineIQ! 🎉
