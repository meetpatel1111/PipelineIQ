# PipelineIQ

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

**🔗 The Missing Link Between Your CI/CD and Jira**

PipelineIQ connects **GitHub Actions** and **Azure DevOps** pipelines directly to **Jira**, automatically creating intelligent tickets when failures occur. Stop manually copying logs and context - let PipelineIQ bridge the gap between your CI/CD failures and issue tracking.

## 🎯 Core Value: Seamless CI/CD → Jira Integration

- **🔄 Automatic Detection**: Monitors GitHub Actions and Azure DevOps pipeline failures
- **🎫 Smart Jira Tickets**: Creates rich, contextual Jira issues with AI-powered insights
- **📊 Operational Context**: Includes repository, branch, commit, environment, and failure details
- **🤖 AI-Enhanced**: Root cause analysis and remediation suggestions
- **🔒 Enterprise Ready**: Secret masking, GDPR compliance, and custom field support

PipelineIQ is the bridge that transforms CI/CD failures into actionable Jira tickets without manual intervention.

## 🚀 Quick Start

### GitHub Actions

Add to your workflow (logs are automatically fetched):

```yaml
- name: PipelineIQ Analysis
  if: failure()
  uses: meetpatel1111/PipelineIQ@v0.3.2
  with:
    jira-url: ${{ secrets.JIRA_URL }}
    jira-email: ${{ secrets.JIRA_EMAIL }}
    jira-token: ${{ secrets.JIRA_API_TOKEN }}
    jira-project: ${{ secrets.JIRA_PROJECT }}
```

### Azure DevOps

Connect your Azure DevOps pipelines to Jira:

```yaml
- task: PipelineIQ@0
  condition: failed()
  inputs:
    jiraUrl: $(JIRA_URL)
    jiraEmail: $(JIRA_EMAIL)
    jiraToken: $(JIRA_API_TOKEN)
    jiraProject: $(JIRA_PROJECT)
```

### CLI

Install and analyze current GitHub/ADO failures automatically:

```bash
npm install -g pipelineiq
# Automatically detects environment and fetches logs
pipelineiq analyze --jira-project "DEVOPS"
```

## � How It Works: CI/CD → Jira Integration

```mermaid
graph LR
    A[GitHub Actions] -->|Pipeline Failure| B[PipelineIQ]
    C[Azure DevOps] -->|Pipeline Failure| B
    B -->|AI Analysis| D[Rich Jira Ticket]
    B -->|Context Enrichment| D
    D -->|Actionable Issue| E[Development Team]
```

**Integration Flow:**
1. **🔍 Failure Detection**: PipelineIQ monitors your CI/CD pipelines for failures
2. **🧠 Context Analysis**: Extracts repository, branch, commit, and failure details
3. **🤖 AI Processing**: Generates root cause analysis and remediation suggestions
4. **🎫 Jira Creation**: Creates comprehensive tickets with all operational context
5. **🔄 Deduplication**: Prevents duplicate tickets for similar failures

**What Gets Bridged:**
- ✅ Pipeline metadata → Jira custom fields
- ✅ Commit links → Jira remote links  
- ✅ Error logs → Jira descriptions
- ✅ Environment context → Jira labels
- ✅ AI insights → Jira comments

## � Installation

### From npm

```bash
npm install pipelineiq
```

### From Source

```bash
git clone https://github.com/your-org/pipelineiq.git
cd pipelineiq
npm install
npm run build
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

- **Failure Detection**: Automatically detects failed GitHub workflows and Azure DevOps pipelines.
- **Automated Log Fetching**: Natively fetches logs from GitHub/Azure APIs—no log redirection required.
- **Proactive Validation**: Built-in connectivity checks for Jira and AI providers before analysis starts.
- **Intelligent Enrichment**: AI-powered analysis with deterministic fallbacks.
- **Deduplication**: Prevents duplicate tickets with smart signature matching.
- **Rich Context**: 80-120 operational fields vs typical 5-10.
- **Multi-Platform**: Native support for GitHub Actions and Azure DevOps.

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
├── src/
│   ├── core/                 # Main processing engine
│   ├── cli/                  # Command-line interface
│   ├── github-action/        # GitHub Actions integration
│   ├── azure-devops/         # Azure DevOps integration
│   └── index.ts              # Main entry point
├── bin/pipelineiq           # CLI executable
├── action.yml               # GitHub Action metadata
├── task.json                # Azure DevOps task metadata
├── examples/                # Usage examples and patterns
└── docs/                    # Documentation
```

### Building

```bash
# Build all components
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Lint code
npm run lint

# Clean build artifacts
npm run clean
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

## License

Apache License 2.0 - see LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/your-org/pipelineiq)
- [npm Package](https://www.npmjs.com/package/pipelineiq)
- [Documentation](https://pipelineiq.dev)
- [Discord Community](https://discord.gg/pipelineiq)

---

**PipelineIQ** - Transforming CI/CD failures into operational intelligence.
