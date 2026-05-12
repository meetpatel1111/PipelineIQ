# PipelineIQ

AI-Powered CI/CD Failure Intelligence for GitHub, Azure DevOps & Jira

PipelineIQ is a developer-native DevOps intelligence platform that automatically detects CI/CD failures from GitHub Actions and Azure DevOps Pipelines and creates intelligent Jira issues enriched with operational context, AI summaries, and remediation guidance.

## 🚀 Quick Start

### GitHub Actions

Add to your workflow:

```yaml
- uses: pipelineiq/action@0.2.1
  if: failure()
  with:
    jira-url: ${{ secrets.JIRA_URL }}
    jira-email: ${{ secrets.JIRA_EMAIL }}
    jira-token: ${{ secrets.JIRA_TOKEN }}
    jira-project: DEVOPS
    ai-summary: true
```

### Azure DevOps

Add to your pipeline:

```yaml
- task: PipelineIQ@0.2.1
  condition: failed()
  inputs:
    jiraUrl: $(JIRA_URL)
    jiraEmail: $(JIRA_EMAIL)
    jiraToken: $(JIRA_TOKEN)
    jiraProject: DEVOPS
```

### CLI

Install and analyze logs locally:

```bash
npm install -g @pipelineiq/cli
pipelineiq analyze --logs ./build.log --config ./pipelineiq.json
```

## 📦 Installation

### From npm

```bash
npm install @pipelineiq/core @pipelineiq/jira-client @pipelineiq/ai-engine @pipelineiq/log-parser
```

### From Source

```bash
git clone https://github.com/your-org/pipelineiq.git
cd pipelineiq
pnpm install
pnpm build
```

## 🏗 Architecture

```
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

## 📊 Features

### Core Capabilities

- **Failure Detection**: Automatically detects failed GitHub workflows and Azure DevOps pipelines
- **Intelligent Enrichment**: AI-powered analysis with deterministic fallbacks
- **Deduplication**: Prevents duplicate tickets with smart signature matching
- **Rich Context**: 80-120 operational fields vs typical 5-10
- **Multi-Platform**: Native support for GitHub Actions and Azure DevOps

### AI Features

- **Optional AI**: Works fully without AI - deterministic fallbacks always available
- **Multiple Providers**: OpenAI, Anthropic, Azure OpenAI, local models
- **Smart Analysis**: Root cause analysis, remediation guidance, severity prediction
- **Confidence Scoring**: AI confidence thresholds with fallback logic

### Log Parsing

- **Format Support**: GitHub Actions, Azure DevOps, Terraform, Kubernetes, Docker, JUnit
- **Smart Extraction**: Error messages, stack traces, exit codes, failed commands
- **Security Focus**: Automatic secret masking and security issue detection
- **Performance Insights**: Timeout detection, performance issue identification

### Jira Integration

- **ADF Conversion**: Markdown to Atlassian Document Format for rich descriptions
- **Custom Fields**: Full support for operational metadata fields
- **Dedup Search**: JQL-based duplicate detection with time windows
- **Bulk Operations**: Enhanced client with bulk comments, links, transitions

## 🔧 Configuration

### Basic Config

```json
{
  "jira": {
    "baseUrl": "https://yourorg.atlassian.net",
    "email": "pipelineiq@yourorg.com",
    "apiToken": "your-api-token"
  },
  "jiraProject": "DEVOPS",
  "ai": {
    "mode": "assist",
    "provider": "openai",
    "apiKey": "your-ai-api-key"
  },
  "dedup": {
    "enabled": true,
    "windowHours": 24
  }
}
```

### AI Modes

- **disabled**: No AI calls, uses deterministic fallbacks only
- **assist**: AI with conservative settings, falls back on low confidence
- **full**: Full AI features with lower confidence thresholds

## 📈 Benefits

### For Teams

- **Reduce MTTR**: 20%+ faster resolution with intelligent context
- **Reduce Toil**: Automated ticket creation and enrichment
- **Standardize Reporting**: Consistent incident structure and data
- **Reduce Duplicates**: 70%+ fewer duplicate tickets

### For Organizations

- **Operational Intelligence**: Deep insights into failure patterns and trends
- **Reliability Analytics**: MTTR tracking, failure heatmaps, team scoring
- **Audit Trail**: Complete provenance tracking for all fields
- **Cost Optimization**: Reduced engineering time and faster resolution

## 🔍 CLI Usage

### Analyze Logs

```bash
# Analyze GitHub Actions logs
pipelineiq analyze --logs ./github-logs --source github --format github-actions

# Analyze Azure DevOps logs
pipelineiq analyze --logs ./ado-logs --source azure-devops --format azure-devops

# Dry run (no Jira creation)
pipelineiq analyze --logs ./build.log --dry-run
```

### Configuration Management

```bash
# Initialize config
pipelineiq config --init

# Show current config
pipelineiq config --show

# Validate config
pipelineiq config --validate

# Test connectivity
pipelineiq test --jira --ai
```

### Log Parsing

```bash
# Parse logs to JSON
pipelineiq parse --logs ./build.log --format terraform --output parsed.json

# Support for multiple formats
pipelineiq parse --logs ./logs/ --format kubernetes --output k8s-parsed.json
```

## 🧪 Development

### Project Structure

```
pipelineiq/
├── packages/
│   ├── core/                 # Main processing engine
│   ├── jira-client/          # Jira REST API client
│   ├── ai-engine/            # AI enrichment with fallbacks
│   ├── log-parser/            # Multi-format log parsing
│   ├── shared-types/          # TypeScript type definitions
│   ├── github-action/         # GitHub Actions integration
│   ├── azure-devops-extension/# Azure DevOps task
│   └── cli/                  # Command-line interface
├── apps/                     # Future dashboard and API
├── examples/                  # Usage examples and patterns
└── docs/                      # Documentation
```

### Building

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## 📚 Documentation

- [Product Requirements Document](./PRD.md) - Comprehensive PRD with all features
- [API Documentation](./docs/api/) - Detailed API reference
- [Examples](./examples/) - Usage examples and patterns
- [Architecture Guide](./docs/architecture/) - System design and patterns

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/your-org/pipelineiq)
- [npm Package](https://www.npmjs.com/package/pipelineiq)
- [Documentation](https://pipelineiq.dev)
- [Discord Community](https://discord.gg/pipelineiq)

---

**PipelineIQ** - Transforming CI/CD failures into operational intelligence.
