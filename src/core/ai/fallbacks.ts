import type {
  FailureEvent,
  FailureCategory,
  Severity,
  Priority,
  DeterministicFallback,
} from "../types/index.js";
import type { AIRequest, AIResponse } from "./types.js";

/**
 * Deterministic fallback implementation as specified in PRD Section 14
 * Provides fallback values when AI is disabled or fails
 */

export class DeterministicFallbackEngine {
  /**
   * Generate deterministic summary using template
   * Template: "{workflow} failed at {step} on {branch} (exit {code})"
   */
  static generateSummary(event: FailureEvent): string {
    const step = event.pipeline.step ?? event.failure.failedStep ?? "step";
    const exitInfo = event.failure.exitCode !== undefined ? ` (exit ${event.failure.exitCode})` : "";
    return `${event.pipeline.name} failed at ${step} on ${event.branch}${exitInfo}`;
  }

  /**
   * Generate RCA using signature library lookup
   * Uses regex/keyword patterns → known cause
   */
  static generateRootCause(event: FailureEvent, category: FailureCategory): string {
    const errorMessage = event.failure.errorMessage || "";
    const logs = event.failure.logs || "";

    // Pattern-based RCA lookup
    const rcaPatterns = [
      {
        patterns: [/state lock/i, /backend.*lock/i, /acquiring.*lock/i],
        cause: "State lock contention - another process holds the resource",
        category: "Infrastructure",
      },
      {
        patterns: [/image.*pull.*backoff/i, /errimagepull/i, /manifest unknown/i],
        cause: "Container image cannot be pulled from registry",
        category: "Deployment",
      },
      {
        patterns: [/helm.*upgrade.*failed/i, /release.*not found/i, /cannot reuse.*name/i],
        cause: "Helm chart deployment failed",
        category: "Deployment",
      },
      {
        patterns: [/eresolve/i, /peer dep missing/i, /could not resolve dependency/i],
        cause: "Dependency resolution conflict",
        category: "Dependency",
      },
      {
        patterns: [/resolutionimpossible/i, /no matching distribution/i],
        cause: "Python package dependency conflict",
        category: "Dependency",
      },
      {
        patterns: [/tests run.*failures/i, /failed.*test/i, /assertionerror/i],
        cause: "One or more unit tests failed",
        category: "Test",
      },
      {
        patterns: [/timeout/i, /deadline exceeded/i, /operation was cancelled/i],
        cause: "Operation exceeded configured timeout",
        category: "Timeout",
      },
      {
        patterns: [/401.*unauthorized/i, /invalid_token/i, /authentication failed/i],
        cause: "Authentication failed against external system",
        category: "Authentication",
      },
      {
        patterns: [/getaddrinfo.*enotfound/i, /temporary failure.*name resolution/i],
        cause: "DNS resolution failed",
        category: "Network",
      },
      {
        patterns: [/docker.*build.*failed/i, /executor.*failed/i, /returned a non-zero code/i],
        cause: "Docker build process failed",
        category: "Build",
      },
      {
        patterns: [/error ts\d+/i, /error.*cannot find/i, /compilation failed/i, /syntaxerror/i],
        cause: "Source code compilation failed",
        category: "Build",
      },
    ];

    // Search for matching patterns
    const searchSpace = `${errorMessage}\n${logs}`.toLowerCase();
    for (const patternGroup of rcaPatterns) {
      for (const pattern of patternGroup.patterns) {
        if (pattern.test(searchSpace)) {
          return patternGroup.cause;
        }
      }
    }

    // Fallback based on category
    switch (category) {
      case "Infrastructure":
        return "Infrastructure resource failure or configuration issue";
      case "Deployment":
        return "Deployment process failed to complete";
      case "Build":
        return "Build process encountered errors";
      case "Test":
        return "Test suite failed to pass";
      case "Dependency":
        return "Dependency management or resolution issue";
      case "Security":
        return "Security validation or authentication issue";
      case "Authentication":
        return "Authentication or authorization failure";
      case "Timeout":
        return "Operation exceeded time limits";
      case "Network":
        return "Network connectivity or communication issue";
      case "CloudProvider":
        return "Cloud provider service or API issue";
      default:
        return "Unknown failure occurred";
    }
  }

  /**
   * Generate remediation using static knowledge base keyed by failure_category
   */
  static generateRemediation(category: FailureCategory): string[] {
    const remediationMap: Record<FailureCategory, string[]> = {
      Infrastructure: [
        "Check infrastructure resource availability",
        "Verify configuration files and settings",
        "Review infrastructure logs for details",
        "Contact infrastructure team if issue persists",
      ],
      Deployment: [
        "Verify deployment configuration",
        "Check target environment status",
        "Review deployment logs for specific errors",
        "Consider rolling back to previous stable version",
      ],
      Build: [
        "Review build logs for specific errors",
        "Check for syntax or compilation errors",
        "Verify dependencies and versions",
        "Run build locally to reproduce issue",
      ],
      Test: [
        "Review failing test cases",
        "Check test environment setup",
        "Verify test data and mocks",
        "Run tests locally to debug failures",
      ],
      Dependency: [
        "Update package manager",
        "Clear package cache and reinstall",
        "Check for version conflicts",
        "Review dependency tree for issues",
      ],
      Security: [
        "Review security credentials and tokens",
        "Check authentication configuration",
        "Verify access permissions",
        "Review security scan results",
      ],
      Authentication: [
        "Verify credentials are valid and not expired",
        "Check authentication configuration",
        "Review token generation process",
        "Confirm service account permissions",
      ],
      Timeout: [
        "Increase timeout limits if appropriate",
        "Optimize slow operations",
        "Break down long-running tasks",
        "Check for resource constraints",
      ],
      Network: [
        "Check network connectivity",
        "Verify DNS configuration",
        "Review firewall and security rules",
        "Test network endpoints manually",
      ],
      CloudProvider: [
        "Check cloud service status",
        "Review API quotas and limits",
        "Verify cloud credentials and permissions",
        "Check region-specific issues",
      ],
      Unknown: [
        "Review complete log output",
        "Gather additional context about the failure",
        "Check recent changes in the codebase",
        "Contact relevant team for assistance",
      ],
    };

    return remediationMap[category] || remediationMap.Unknown;
  }

  /**
   * Generate classification using pattern-matched category from log signatures
   */
  static generateClassification(event: FailureEvent): FailureCategory {
    const errorMessage = event.failure.errorMessage || "";
    const logs = event.failure.logs || "";
    const searchSpace = `${errorMessage}\n${logs}`.toLowerCase();

    // Classification patterns from log signatures
    const classificationPatterns = [
      {
        patterns: [/terraform/i, /kubernetes/i, /k8s/i, /helm/i, /docker/i, /container/i],
        category: "Infrastructure" as FailureCategory,
      },
      {
        patterns: [/npm/i, /yarn/i, /pnpm/i, /pip/i, /maven/i, /gradle/i, /cargo/i],
        category: "Dependency" as FailureCategory,
      },
      {
        patterns: [/compile/i, /build/i, /typescript/i, /webpack/i, /vite/i, /rollup/i],
        category: "Build" as FailureCategory,
      },
      {
        patterns: [/deploy/i, /release/i, /apply/i, /install/i, /upgrade/i],
        category: "Deployment" as FailureCategory,
      },
      {
        patterns: [/test/i, /jest/i, /mocha/i, /pytest/i, /vitest/i, /junit/i],
        category: "Test" as FailureCategory,
      },
      {
        patterns: [/secret/i, /token/i, /password/i, /credential/i, /auth/i],
        category: "Security" as FailureCategory,
      },
      {
        patterns: [/401/i, /403/i, /unauthorized/i, /forbidden/i, /access denied/i],
        category: "Authentication" as FailureCategory,
      },
      {
        patterns: [/timeout/i, /deadline/i, /timed out/i],
        category: "Timeout" as FailureCategory,
      },
      {
        patterns: [/dns/i, /network/i, /connection/i, /enotfound/i],
        category: "Network" as FailureCategory,
      },
      {
        patterns: [/aws/i, /azure/i, /gcp/i, /cloud/i],
        category: "CloudProvider" as FailureCategory,
      },
    ];

    for (const patternGroup of classificationPatterns) {
      for (const pattern of patternGroup.patterns) {
        if (pattern.test(searchSpace)) {
          return patternGroup.category;
        }
      }
    }

    return "Unknown";
  }

  /**
   * Generate severity using rule-based approach
   * Rules: env=prod + outage signature → High/Critical; test failure on PR → Medium; etc.
   */
  static generateSeverity(event: FailureEvent, category: FailureCategory): Severity {
    const env = (event.environment || "").toLowerCase();
    const isProd = env === "production" || env === "prod";
    const isMain = event.branch === "main" || event.branch === "master";
    const isPR = !!event.pullRequest;

    // Critical severity rules
    if (isProd && (category === "Infrastructure" || category === "Deployment" || category === "Network")) {
      return "Critical";
    }

    // High severity rules
    if (category === "Security") return "High";
    if (isProd) return "High";
    if (isMain) return "High";
    if (category === "Infrastructure" && !isPR) return "High";

    // Medium severity rules
    if (isPR) return "Medium";
    if (category === "Test" && isPR) return "Medium";
    if (category === "Build" && !isMain) return "Medium";

    // Low severity for everything else
    return "Low";
  }

  /**
   * Generate owner suggestion using CODEOWNERS → commit author → repo admin
   */
  static generateOwnerSuggestion(event: FailureEvent): string {
    // In a real implementation, this would:
    // 1. Check CODEOWNERS file for matching paths/patterns
    // 2. Fall back to commit author
    // 3. Fall back to repository admin
    
    // For now, return commit author as fallback
    return event.commit.author || "unknown";
  }

  /**
   * Generate tags using {category, branch, repo, env} auto-labels
   */
  static generateTags(event: FailureEvent, category: FailureCategory): string[] {
    const tags = [
      `category:${category.toLowerCase()}`,
      `repo:${event.repository.name}`,
      `branch:${event.branch}`,
      `source:${event.source}`,
    ];

    if (event.environment) {
      tags.push(`env:${event.environment.toLowerCase()}`);
    }

    if (event.pipeline.step) {
      tags.push(`step:${event.pipeline.step.toLowerCase()}`);
    }

    return tags;
  }

  /**
   * Generate risk assessment using heuristic: branch + env + recent failure rate
   */
  static generateRiskAssessment(event: FailureEvent, failureRate?: number): string {
    const env = (event.environment || "").toLowerCase();
    const isProd = env === "production" || env === "prod";
    const isMain = event.branch === "main" || event.branch === "master";
    const isPR = !!event.pullRequest;

    // Risk factors
    let riskScore = 0;
    let riskFactors: string[] = [];

    if (isProd) {
      riskScore += 3;
      riskFactors.push("Production environment");
    }

    if (isMain) {
      riskScore += 2;
      riskFactors.push("Main branch deployment");
    }

    if (!isPR) {
      riskScore += 1;
      riskFactors.push("Direct push to branch");
    }

    if (failureRate && failureRate > 0.1) {
      riskScore += 2;
      riskFactors.push("High recent failure rate");
    }

    if (event.pipeline.retryCount && event.pipeline.retryCount > 0) {
      riskScore += 1;
      riskFactors.push("Previous retries");
    }

    // Risk level assessment
    if (riskScore >= 5) {
      return `High risk: ${riskFactors.join(", ")}`;
    } else if (riskScore >= 3) {
      return `Medium risk: ${riskFactors.join(", ")}`;
    } else {
      return `Low risk: ${riskFactors.join(", ")}`;
    }
  }

  /**
   * Generate complete deterministic fallback response
   */
  static generateFallback(event: FailureEvent): DeterministicFallback {
    const category = this.generateClassification(event);
    const severity = this.generateSeverity(event, category);
    const priority = this.severityToPriority(severity);

    return {
      summary: this.generateSummary(event),
      rootCause: this.generateRootCause(event, category),
      remediation: this.generateRemediation(category).join("\n"),
      severity,
      assignee: this.generateOwnerSuggestion(event),
      tags: this.generateTags(event, category),
      classification: category,
    };
  }

  private static severityToPriority(severity: Severity): Priority {
    switch (severity) {
      case "Critical":
        return "Highest";
      case "High":
        return "High";
      case "Medium":
        return "Medium";
      case "Low":
        return "Low";
    }
  }
}
