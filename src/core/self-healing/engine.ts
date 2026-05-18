import type { FailureEvent, SelfHealingConfig, SelfHealingResult, CodeFix } from "../types/index.js";
import type { AIEngineConfig } from "../ai/types.js";
import type { GitProvider } from "./types.js";
import { FixGenerator } from "./fix-generator.js";
import { GitHubProvider } from "./github-provider.js";
import { AzureDevOpsProvider } from "./azure-provider.js";

/**
 * SelfHealingEngine — the orchestrator for autonomous remediation.
 *
 * Flow:
 *   1. Check eligibility (category, config, AI availability)
 *   2. Generate a code fix via AI
 *   3. Validate the fix against safety guardrails
 *   4. Create branch → commit → PR via the appropriate GitProvider
 *   5. Return a SelfHealingResult for Jira linking and notifications
 */
export class SelfHealingEngine {
  private config: SelfHealingConfig;
  private fixGenerator: FixGenerator;

  constructor(config: SelfHealingConfig, aiConfig: AIEngineConfig) {
    this.config = config;
    this.fixGenerator = new FixGenerator(aiConfig);
  }

  /**
   * Attempt to self-heal a pipeline failure.
   *
   * @param event       The failure event
   * @param rootCause   AI-generated root cause (from enrichment pipeline)
   * @param remediation AI-generated remediation steps
   * @param category    Failure classification
   * @param issueKey    The Jira issue key (for cross-linking in the PR)
   * @returns           SelfHealingResult with fix details and PR URL
   */
  async attemptFix(
    event: FailureEvent,
    rootCause: string,
    remediation: string[],
    category: string,
    issueKey: string,
  ): Promise<SelfHealingResult> {
    // ── Gate 1: Category eligibility ──────────────────────────────────────
    if (!this.isCategoryAllowed(category)) {
      return {
        attempted: false,
        success: false,
        reason: `Category "${category}" is not eligible for self-healing (allowed: ${this.config.allowedCategories.join(", ")})`,
        dryRun: this.config.dryRun,
      };
    }

    // ── Gate 2: AI availability ──────────────────────────────────────────
    if (!this.fixGenerator.isAvailable()) {
      return {
        attempted: false,
        success: false,
        reason: "AI provider is not available for fix generation",
        dryRun: this.config.dryRun,
      };
    }

    // ── Stage 1: Generate fix ────────────────────────────────────────────
    let fix: CodeFix | null;
    try {
      fix = await this.fixGenerator.generateFix(event, rootCause, remediation, category);
    } catch (error) {
      return {
        attempted: true,
        success: false,
        reason: `Fix generation failed: ${error}`,
        dryRun: this.config.dryRun,
      };
    }

    if (!fix) {
      return {
        attempted: true,
        success: false,
        reason: "AI could not generate a viable fix for this failure",
        dryRun: this.config.dryRun,
      };
    }

    // ── Stage 2: Safety guardrails ───────────────────────────────────────
    const guardrailResult = this.validateGuardrails(fix);
    if (guardrailResult) {
      return {
        attempted: true,
        success: false,
        fix,
        reason: guardrailResult,
        dryRun: this.config.dryRun,
      };
    }

    // ── Stage 3: Dry run check ───────────────────────────────────────────
    if (this.config.dryRun) {
      return {
        attempted: true,
        success: true,
        fix,
        reason: "Dry run — fix generated but not applied",
        dryRun: true,
      };
    }

    // ── Stage 4: Create PR via GitProvider ───────────────────────────────
    try {
      const provider = this.resolveProvider(event);
      const branchName = this.buildBranchName(issueKey, fix);

      const result = await provider.createFixPR(
        fix,
        event.repository.owner,
        event.repository.name,
        event.branch,
        event.commit.sha,
        issueKey,
        {
          draft: this.config.draftPr,
          reviewers: this.config.reviewers,
          labels: this.config.prLabels,
          branchName,
        },
      );

      return {
        attempted: true,
        success: true,
        fix,
        prUrl: result.prUrl,
        prNumber: result.prNumber,
        branchName: result.branchName,
        dryRun: false,
      };
    } catch (error) {
      return {
        attempted: true,
        success: false,
        fix,
        reason: `PR creation failed: ${error}`,
        dryRun: false,
      };
    }
  }

  // ── Safety Guardrails ────────────────────────────────────────────────────

  /**
   * Validate a fix against all configured safety guardrails.
   * Returns an error message if the fix is rejected, or null if it passes.
   */
  private validateGuardrails(fix: CodeFix): string | null {
    // Skip guardrails if disabled in config
    if (!this.config.enableGuardrails) {
      return null;
    }

    // Confidence threshold
    if (fix.confidence < this.config.minConfidence) {
      return `Fix confidence ${Math.round(fix.confidence * 100)}% is below threshold ${Math.round(this.config.minConfidence * 100)}%`;
    }

    // Max files changed
    if (fix.changes.length > this.config.maxFilesChanged) {
      return `Fix changes ${fix.changes.length} files (max: ${this.config.maxFilesChanged})`;
    }

    // Max lines changed
    const totalLines = fix.changes.reduce((sum, c) => {
      const newLines = (c.newContent ?? "").split("\n").length;
      const oldLines = (c.originalContent ?? "").split("\n").length;
      return sum + Math.abs(newLines - oldLines) + Math.min(newLines, oldLines);
    }, 0);
    if (totalLines > this.config.maxLinesChanged) {
      return `Fix changes ~${totalLines} lines (max: ${this.config.maxLinesChanged})`;
    }

    // Blocked paths
    for (const change of fix.changes) {
      for (const pattern of this.config.blockedPaths) {
        if (matchGlob(change.filePath, pattern)) {
          return `Fix touches blocked path "${change.filePath}" (pattern: ${pattern})`;
        }
      }
    }

    // High risk assessment
    if (fix.riskLevel === "high") {
      return `Fix has high risk level — requires manual intervention`;
    }

    return null;
  }

  private isCategoryAllowed(category: string): boolean {
    if (!this.config.enableGuardrails) return true;
    
    return this.config.allowedCategories.some(
      (allowed) => allowed.toLowerCase() === category.toLowerCase(),
    );
  }

  // ── Provider Resolution ──────────────────────────────────────────────────

  private resolveProvider(event: FailureEvent): GitProvider {
    const platform = this.config.platform ?? this.detectPlatform(event);

    switch (platform) {
      case "github": {
        const token = this.config.githubToken ?? process.env.GITHUB_TOKEN ?? "";
        return new GitHubProvider(token);
      }
      case "azure-devops": {
        const token = this.config.azureToken ?? process.env.SYSTEM_ACCESSTOKEN ?? "";
        const orgUrl = process.env.SYSTEM_COLLECTIONURI ?? "";
        return new AzureDevOpsProvider(token, orgUrl);
      }
      default:
        throw new Error(`Unsupported self-healing platform: ${platform}`);
    }
  }

  private detectPlatform(event: FailureEvent): "github" | "azure-devops" {
    if (event.source === "azure-devops") return "azure-devops";
    return "github";
  }

  // ── Branch Naming ────────────────────────────────────────────────────────

  private buildBranchName(issueKey: string, fix: CodeFix): string {
    const slug = fix.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return `${this.config.branchPrefix}/${issueKey.toLowerCase()}-${slug}`;
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Simple glob matcher for blocked path patterns.
 * Supports * (any chars) and ? (single char).
 */
function matchGlob(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.replace(/\\/g, "/").toLowerCase();

  // Convert glob pattern to regex
  const regexStr = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  return new RegExp(`^${regexStr}$`).test(normalizedPath) ||
    new RegExp(`(^|/)${regexStr}($|/)`).test(normalizedPath);
}
