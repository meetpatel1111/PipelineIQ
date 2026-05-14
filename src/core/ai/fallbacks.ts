import type {
  FailureEvent,
  FailureCategory,
  Severity,
  Priority,
  DeterministicFallback,
} from "../types/index.js";
import { SIGNATURES, matchSignature } from "../signatures.js";

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
   */
  static generateRootCause(event: FailureEvent, category: FailureCategory): string {
    const searchSpace = `${event.failure.errorMessage || ""}\n${event.failure.logs}`;
    const match = matchSignature(searchSpace);

    if (match) {
      return match.cause;
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
   * Generate remediation using signature library or category-based default
   */
  static generateRemediation(category: FailureCategory, event: FailureEvent): string[] {
    const searchSpace = `${event.failure.errorMessage || ""}\n${event.failure.logs}`;
    const match = matchSignature(searchSpace);

    if (match) {
      return match.remediation;
    }

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
   * Generate classification using core signature library
   */
  static generateClassification(event: FailureEvent): FailureCategory {
    const searchSpace = `${event.failure.errorMessage || ""}\n${event.failure.logs}`;
    const match = matchSignature(searchSpace);
    return match?.category ?? "Unknown";
  }

  /**
   * Generate severity using rule-based approach
   */
  static generateSeverity(event: FailureEvent, category: FailureCategory): Severity {
    const env = (event.environment || "").toLowerCase();
    const isProd = env === "production" || env === "prod";
    const isMain = event.branch === "main" || event.branch === "master";
    const isPR = !!event.pullRequest;

    if (isProd && (category === "Infrastructure" || category === "Deployment" || category === "Network")) {
      return "Critical";
    }

    if (category === "Security") return "High";
    if (isProd) return "High";
    if (isMain) return "High";
    if (category === "Infrastructure" && !isPR) return "High";

    if (isPR) return "Medium";
    if (category === "Test" && isPR) return "Medium";
    if (category === "Build" && !isMain) return "Medium";

    return "Low";
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

    return {
      summary: this.generateSummary(event),
      rootCause: this.generateRootCause(event, category),
      remediation: this.generateRemediation(category, event).join("\n"),
      severity,
      assignee: null,
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
