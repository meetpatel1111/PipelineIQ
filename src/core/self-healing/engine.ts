import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import type { FailureEvent, SelfHealingConfig, SelfHealingResult, CodeFix } from "../types/index.js";
import type { AIEngineConfig } from "../ai/types.js";
import type { GitProvider } from "./types.js";
import { FixGenerator } from "./fix-generator.js";
import { GitHubProvider } from "./github-provider.js";
import { AzureDevOpsProvider } from "./azure-provider.js";
import { applyPatch } from "./patch.js";

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

    // ── Stage 3.5: Local Verification and Lockfile Regeneration ──────────────
    if (this.config.enableVerification || (this.config.autoRegenerateLockfile && this.isLockfileDesync(event))) {
      const root = this.getWorkspaceRoot();
      const backups = new Map<string, string | null>(); // filePath -> originalContent (null if it didn't exist)

      try {
        console.log("[PipelineIQ] Starting local verification/regeneration...");

        // 1. If it's a lockfile desync, let's first regenerate the lockfile
        if (this.config.autoRegenerateLockfile && this.isLockfileDesync(event)) {
          console.log("[PipelineIQ] Lockfile desync detected — regenerating lockfile locally via npm install...");
          try {
            // Backup package-lock.json if it exists
            const lockPath = path.resolve(root, "package-lock.json");
            if (fs.existsSync(lockPath)) {
              backups.set("package-lock.json", fs.readFileSync(lockPath, "utf-8"));
            } else {
              backups.set("package-lock.json", null);
            }

            // Run npm install to synchronize
            execSync("npm install", { cwd: root, stdio: "inherit" });
            console.log("[PipelineIQ] Successfully regenerated package-lock.json");

            // Read the newly regenerated lockfile
            if (fs.existsSync(lockPath)) {
              const newLockContent = fs.readFileSync(lockPath, "utf-8");
              
              // Remove any existing package-lock.json changes from the fix
              fix.changes = fix.changes.filter(c => c.filePath !== "package-lock.json");
              
              // Append the regenerated lockfile to the changes list
              fix.changes.push({
                filePath: "package-lock.json",
                action: backups.get("package-lock.json") !== null ? "modify" : "create",
                originalContent: backups.get("package-lock.json") || "",
                newContent: newLockContent,
                changeDescription: "Regenerated package-lock.json to resolve desynchronization with package.json",
              });
            }
          } catch (lockError) {
            console.warn(`[PipelineIQ] Lockfile regeneration failed: ${lockError}`);
            throw new Error(`Failed to regenerate package-lock.json: ${lockError}`);
          }
        }

        // 2. Backup and apply the rest of the code fixes
        for (const change of fix.changes) {
          if (change.filePath === "package-lock.json") continue; // Already handled above
          const fullPath = path.resolve(root, change.filePath);
          if (fs.existsSync(fullPath)) {
            backups.set(change.filePath, fs.readFileSync(fullPath, "utf-8"));
          } else {
            backups.set(change.filePath, null);
          }

          // Write new content
          if (change.action === "delete") {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } else if (change.action === "modify" && change.originalContent) {
            const originalContent = backups.get(change.filePath) || "";
            const patched = applyPatch(originalContent, change.originalContent, change.newContent ?? "", change.filePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, patched, "utf-8");
          } else {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, change.newContent ?? "", "utf-8");
          }
        }

        // 3. Run verification commands
        if (this.config.enableVerification && this.config.verificationCommands.length > 0) {
          console.log(`[PipelineIQ] Running verification commands: ${this.config.verificationCommands.join(" && ")}`);
          for (const cmd of this.config.verificationCommands) {
            try {
              execSync(cmd, { cwd: root, stdio: "inherit" });
            } catch (cmdError) {
              console.warn(`[PipelineIQ] Verification command "${cmd}" failed: ${cmdError}`);
              throw new Error(`Verification command "${cmd}" failed: ${cmdError}`);
            }
          }
          console.log("[PipelineIQ] Verification commands completed successfully.");
        }

        // 4. Restore the local files so the workspace remains clean
        for (const [relPath, originalContent] of backups.entries()) {
          const fullPath = path.resolve(root, relPath);
          if (originalContent === null) {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } else {
            fs.writeFileSync(fullPath, originalContent, "utf-8");
          }
        }
        console.log("[PipelineIQ] Restored workspace files, local verification complete.");

      } catch (verifyError: any) {
        // Restore local files so workspace is clean
        for (const [relPath, originalContent] of backups.entries()) {
          const fullPath = path.resolve(root, relPath);
          if (originalContent === null) {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } else {
            fs.writeFileSync(fullPath, originalContent, "utf-8");
          }
        }
        return {
          attempted: true,
          success: false,
          fix,
          reason: `Local verification/regeneration failed: ${verifyError.message || verifyError}`,
          dryRun: this.config.dryRun,
        };
      }
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
    } catch (error: any) {
      const errorMessage = String(error);
      let reason = `PR creation failed: ${errorMessage}`;
      
      // Provide a friendly error if token lacks workflow scope
      if ((errorMessage.includes("Resource not accessible by integration") || errorMessage.includes("Resource not accessible by personal access token")) && fix.changes.some(c => c.filePath.startsWith(".github/workflows/"))) {
        reason = `Cannot modify .github/workflows/ files without a Personal Access Token (PAT) with the 'workflow' scope. Token is restricted.`;
      } else if (errorMessage.includes("Resource not accessible")) {
        reason = `Insufficient GitHub token permissions. Ensure the token has 'Contents: write' and 'Pull requests: write' access.`;
      }

      return {
        attempted: true,
        success: false,
        fix,
        reason,
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

  private getWorkspaceRoot(): string {
    return (
      process.env.GITHUB_WORKSPACE ||
      process.env.SYSTEM_DEFAULTWORKINGDIRECTORY ||
      process.cwd()
    );
  }

  private isLockfileDesync(event: FailureEvent): boolean {
    const errorText = `${event.failure.errorMessage ?? ""}\n${event.failure.logs ?? ""}`;
    return errorText.includes("package-lock.json is out of sync") ||
           errorText.includes("package.json and package-lock.json or npm-shrinkwrap.json are in sync") ||
           errorText.includes("npm ci failed") ||
           errorText.includes("cipm can only install packages");
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
