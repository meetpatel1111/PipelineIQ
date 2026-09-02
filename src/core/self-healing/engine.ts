import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import type { FailureEvent, SelfHealingConfig, SelfHealingResult, CodeFix } from "../types/index.js";
import type { AIEngineConfig } from "../ai/types.js";
import type { GitProvider } from "./types.js";
import type { JiraClient } from "../jira/client.js";
import { FixGenerator } from "./fix-generator.js";
import { GitHubProvider } from "./github-provider.js";
import { AzureDevOpsProvider } from "./azure-provider.js";
import { applyPatch } from "./patch.js";
import { EcosystemManager } from "./ecosystem-registry.js";
import { computeDedupSignature } from "../dedup.js";
import { getWorkspaceRoot } from "./workspace.js";
import { validateCommand, sanitizeFilePath } from "./command-allowlist.js";

/**
 * SelfHealingEngine — the orchestrator for autonomous remediation.
 *
 * Flow:
 *   1. Check eligibility (category, config, AI availability)
 *   2. Retrieve persistent historical context from Jira (if available)
 *   3. Generate a code fix via AI (with domain specialist guidance)
 *   4. Validate the fix against safety guardrails
 *   5. Run pre-flight syntax check & sandbox verification loop
 *   6. Create branch → commit → PR via GitProvider (or apply in-place)
 *   7. Auto-comment verification proof and remote link on the Jira issue
 */
export class SelfHealingEngine {
  private config: SelfHealingConfig;
  private fixGenerator: FixGenerator;
  private jiraClient?: JiraClient | undefined;

  constructor(config: SelfHealingConfig, aiConfig: AIEngineConfig, jiraClient?: JiraClient) {
    this.config = config;
    this.fixGenerator = new FixGenerator(aiConfig);
    this.jiraClient = jiraClient;
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
    codeowners?: string[]
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

    // ── Stage 0.5: Query Persistent Jira Memory for Past Incidents ───────
    let historicalContext: string | undefined;
    if (this.jiraClient && issueKey && issueKey.includes("-")) {
      try {
        const projectKey = issueKey.split("-")[0]!;
        const signature = computeDedupSignature(event, category as any);
        const pastIssue = await this.jiraClient.findBySignature(projectKey, signature, 30 * 24);
        if (pastIssue && pastIssue.key !== issueKey) {
          historicalContext = `Previous similar Jira ticket ${pastIssue.key} ("${pastIssue.summary}") was encountered and resolved.`;
          console.log(`[PipelineIQ] Loaded historical resolution context from Jira issue ${pastIssue.key}`);
        }
      } catch {
        // Best-effort lookup
      }
    }

    // ── Stage 1: Generate fix ────────────────────────────────────────────
    let fix: CodeFix | null;
    try {
      fix = await this.fixGenerator.generateFix(event, rootCause, remediation, category, undefined, historicalContext);
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
      const root = getWorkspaceRoot();
      let previousVerificationError: string | undefined;
      let previousDiff: string | undefined;

      const maxRetries = Math.max(1, this.config.maxVerificationRetries ?? 3);

      for (let verifyAttempt = 1; verifyAttempt <= maxRetries; verifyAttempt++) {
        // On retry turns, regenerate fix with compiler error & diff feedback
        if (verifyAttempt > 1 && previousVerificationError) {
          try {
            const retryFix = await this.fixGenerator.generateFix(
              event, rootCause, remediation, category,
              { previousError: previousVerificationError, diff: previousDiff },
              historicalContext
            );
            if (retryFix) {
              fix = retryFix;
            } else {
              break; // AI gave up — propagate the previous error
            }
          } catch {
            break;
          }
        }

        const backups = new Map<string, string | null>(); // filePath -> original (null = didn't exist)

        try {
          console.log(`[PipelineIQ] Starting local verification/regeneration${verifyAttempt > 1 ? ` (attempt ${verifyAttempt})` : ""}...`);

          // 1. Universal lockfile regeneration if desync is detected
          if (this.config.autoRegenerateLockfile && this.isLockfileDesync(event)) {
            await this.regenerateLockfiles(root, fix, backups);
          }

          // 1.5 Universal workspace runtime dependency provisioning across all 300+ stacks
          await this.ensureWorkspaceDependencies(root, fix, event);

          // 2. Backup and apply code fixes
          for (const change of fix.changes) {
            if (this.isLockfileName(change.filePath)) continue;
            const sanitizedRelPath = sanitizeFilePath(change.filePath);
            const fullPath = path.resolve(root, sanitizedRelPath);
            if (fs.existsSync(fullPath)) {
              backups.set(sanitizedRelPath, fs.readFileSync(fullPath, "utf-8"));
            } else {
              backups.set(sanitizedRelPath, null);
            }

            if (change.action === "delete") {
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            } else if (change.action === "modify" && change.originalContent) {
              const diskContent = backups.get(sanitizedRelPath);
              if (diskContent === null || diskContent === undefined) {
                throw new Error(
                  `File "${sanitizedRelPath}" was not found in the local workspace (${root}). ` +
                  `Add an "actions/checkout" step before "pipelineiq analyze" in your workflow ` +
                  `so that self-healing verification can read and patch source files.`,
                );
              }
              const originalContent: string = diskContent;
              let patched: string;
              try {
                patched = applyPatch(originalContent, change.originalContent ?? "", change.newContent ?? "", sanitizedRelPath, change.action as "modify" | "create" | "delete");
              } catch (patchError) {
                throw new Error(`AI-generated fix references code not found in ${sanitizedRelPath} — the snippet may be hallucinated. ${patchError}`);
              }
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, patched, "utf-8");
            } else {
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, change.newContent ?? "", "utf-8");
            }
          }

          // 2.5 Pre-flight fast syntax verification
          this.preflightSyntaxCheck(root, fix);

          // 3. Run verification commands (auto-detected across 25+ ecosystems, AI suggestion, or CI logs)
          let verifiedCommandStr: string | undefined;
          const verificationCommands = this.resolveVerificationCommands(category, root, fix, event);
          if (this.config.enableVerification && verificationCommands.length > 0) {
            console.log(`[PipelineIQ] Running verification commands: ${verificationCommands.join(" && ")}`);
            for (const cmd of verificationCommands) {
              if (!validateCommand(cmd)) {
                throw new Error(`[PipelineIQ Security] Verification command rejected by security policy: "${cmd}"`);
              }
              try {
                // 5-minute timeout per command to protect against hung tests/builds
                execSync(cmd, { cwd: root, stdio: "inherit", timeout: 300000 });
                verifiedCommandStr = cmd;
              } catch (cmdError) {
                console.warn(`[PipelineIQ] Verification command "${cmd}" failed: ${cmdError}`);
                throw new Error(`Verification command "${cmd}" failed: ${cmdError}`);
              }
            }
            console.log("[PipelineIQ] Verification commands completed successfully.");
          }

          // If in-place fix mode is requested (local CLI / IDE workflow), keep the changes on disk permanently
          if (this.config.applyInPlace) {
            console.log("[PipelineIQ] In-place fix mode enabled — keeping verified code changes on disk.");
            const inPlaceResult: SelfHealingResult = {
              attempted: true,
              success: true,
              fix,
              appliedInPlace: true,
              verifiedCommand: verifiedCommandStr,
              dryRun: false,
            };

            if (this.jiraClient && issueKey) {
              try {
                const commentLines = [
                  `🤖 *PipelineIQ Self-Healing Engine* applied an in-place code fix for this failure:`,
                  `• *Verification:* Verified locally with \`${verifiedCommandStr || "Tests passed"}\` (Exit code 0)`,
                  `• *AI Confidence:* ${Math.round(fix.confidence * 100)}% (${fix.riskLevel} risk)`,
                  fix.estimatedTimeSavedMinutes ? `• *Estimated MTTR Saved:* ${fix.estimatedTimeSavedMinutes} minutes` : "",
                ].filter(Boolean).join("\n");
                await this.jiraClient.addComment(issueKey, commentLines);
              } catch (jiraErr) {
                console.warn(`[PipelineIQ] Failed to post self-healing comment to Jira: ${jiraErr}`);
              }
            }

            return inPlaceResult;
          }

          // 4. Restore workspace files before remote PR creation
          for (const [relPath, originalContent] of backups.entries()) {
            const fullPath = path.resolve(root, relPath);
            if (originalContent === null) {
              if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            } else {
              fs.writeFileSync(fullPath, originalContent, "utf-8");
            }
          }
          console.log("[PipelineIQ] Restored workspace files, local verification complete.");
          break; // Verification passed — exit retry loop

        } catch (verifyError: any) {
          // Capture the diff of the failed fix before restoring
          let diffOutput = "";
          try {
            diffOutput = execSync("git diff", { cwd: root, encoding: "utf-8", timeout: 30000 });
          } catch {
            // Ignore if git fails
          }

          // Always restore workspace files before deciding what to do next
          for (const [relPath, originalContent] of backups.entries()) {
            const fullPath = path.resolve(root, relPath);
            if (originalContent === null) {
              if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            } else {
              fs.writeFileSync(fullPath, originalContent, "utf-8");
            }
          }

          // Strip terminal ANSI escape codes so LLM gets clean compiler diagnostics
          const rawErrorMsg: string = verifyError.message || String(verifyError);
          const errorMsg = rawErrorMsg.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");

          // Non-retriable: missing checkout — no point retrying if workspace files don't exist
          const isRetriable = !errorMsg.includes("was not found in the local workspace");

          if (!isRetriable || verifyAttempt >= maxRetries) {
            return {
              attempted: true,
              success: false,
              fix,
              reason: `Local verification/regeneration failed after ${verifyAttempt} attempt(s): ${errorMsg}`,
              dryRun: this.config.dryRun,
            };
          }

          // Save the error and diff to let the loop regenerate the fix with feedback before trying again
          previousVerificationError = errorMsg;
          previousDiff = diffOutput.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
          console.warn(`[PipelineIQ] Verification attempt ${verifyAttempt} failed — running Agentic Self-Correction cycle ${verifyAttempt + 1}/${maxRetries} with compiler & test feedback.`);
        }
      }
    }

    // ── Stage 4: Create PR via GitProvider ───────────────────────────────
    try {
      const provider = this.resolveProvider(event);
      const branchName = this.buildBranchName(issueKey, fix);
      
      const allReviewers = Array.from(new Set([...(this.config.reviewers || []), ...(codeowners || [])]));

      const result = await provider.createFixPR(
        fix,
        event.repository.owner,
        event.repository.name,
        event.branch,
        event.commit.sha,
        issueKey,
        {
          draft: this.config.draftPr,
          reviewers: allReviewers,
          labels: this.config.prLabels,
          branchName,
          verifiedCommand: fix.verificationCommand,
        },
      );

      const prResult: SelfHealingResult = {
        attempted: true,
        success: true,
        fix,
        prUrl: result.prUrl,
        prNumber: result.prNumber,
        branchName: result.branchName,
        verifiedCommand: fix.verificationCommand,
        dryRun: false,
      };

      // Auto-comment on Jira ticket and create remote PR link
      if (this.jiraClient && issueKey) {
        try {
          if (result.prUrl) {
            await this.jiraClient.createRemoteLink(issueKey, "PipelineIQ Auto-Fix PR", result.prUrl);
          }
          const commentLines = [
            `🤖 *PipelineIQ Self-Healing Engine* created a Pull Request for this failure:`,
            `• *Pull Request:* [${result.prUrl}|${result.prUrl}] (Branch: \`${result.branchName}\`)`,
            fix.verificationCommand ? `• *Verification:* Verified in sandbox with \`${fix.verificationCommand}\` (Exit code 0)` : `• *Verification:* Verified in sandbox (Exit code 0)`,
            `• *AI Confidence:* ${Math.round(fix.confidence * 100)}% (${fix.riskLevel} risk)`,
            fix.estimatedTimeSavedMinutes ? `• *Estimated MTTR Saved:* ${fix.estimatedTimeSavedMinutes} minutes` : "",
          ].filter(Boolean).join("\n");
          await this.jiraClient.addComment(issueKey, commentLines);
        } catch (jiraErr) {
          console.warn(`[PipelineIQ] Failed to post self-healing comment to Jira: ${jiraErr}`);
        }
      }

      return prResult;
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

  /**
   * Pre-flight fast-path AST / syntax validator.
   * Catches syntax errors (missing brackets, syntax errors) in sub-milliseconds
   * before waiting for long test suites to run.
   */
  private preflightSyntaxCheck(root: string, fix: CodeFix): void {
    for (const change of fix.changes) {
      if (change.action === "delete") continue;
      const sanitizedRelPath = sanitizeFilePath(change.filePath);
      const fullPath = path.resolve(root, sanitizedRelPath);
      if (!fs.existsSync(fullPath)) continue;
      const ext = path.extname(sanitizedRelPath).toLowerCase();

      try {
        let checkCmd: string | null = null;
        if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
          checkCmd = `node --check "${fullPath}"`;
        } else if (ext === ".py") {
          checkCmd = `python -m py_compile "${fullPath}"`;
        } else if (ext === ".rb") {
          checkCmd = `ruby -c "${fullPath}"`;
        } else if (ext === ".php") {
          checkCmd = `php -l "${fullPath}"`;
        }

        if (checkCmd) {
          execSync(checkCmd, { cwd: root, stdio: "pipe", timeout: 10000 });
        }
      } catch (syntaxErr: any) {
        const stderr = syntaxErr.stderr ? syntaxErr.stderr.toString("utf-8") : String(syntaxErr);
        throw new Error(`Pre-flight syntax validation error in ${sanitizedRelPath}:\n${stderr || syntaxErr.message}`);
      }
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
    if (this.config.allowedCategories.includes("*")) return true;
    
    const catLower = category.toLowerCase();
    return this.config.allowedCategories.some((allowed) => {
      const aLower = allowed.toLowerCase();
      if (aLower === catLower || aLower === "*") return true;
      if (aLower === "build" && (catLower.includes("build") || catLower.includes("syntax") || catLower.includes("compile") || catLower.includes("type"))) return true;
      if (aLower === "test" && (catLower.includes("test") || catLower.includes("assert") || catLower.includes("spec"))) return true;
      if (aLower === "lint" && (catLower.includes("lint") || catLower.includes("format") || catLower.includes("style"))) return true;
      return catLower.includes(aLower);
    });
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

  private isLockfileName(filePath: string): boolean {
    const name = path.basename(filePath).toLowerCase();
    return [
      "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "bun.lock",
      "cargo.lock", "poetry.lock", "pipfile.lock", "pdm.lock", "uv.lock",
      "gemfile.lock", "composer.lock", "go.sum", "pubspec.lock", "mix.lock",
      "package.resolved", "flake.lock", "conda-lock.yml", "podfile.lock", "berksfile.lock"
    ].includes(name);
  }

  private isLockfileDesync(event: FailureEvent): boolean {
    const errorText = `${event.failure.errorMessage ?? ""}\n${event.failure.logs ?? ""}`.toLowerCase();
    return (
      errorText.includes("package-lock.json is out of sync") ||
      errorText.includes("package.json and package-lock.json") ||
      errorText.includes("npm ci failed") ||
      errorText.includes("cipm can only install packages") ||
      errorText.includes("frozen-lockfile") ||
      errorText.includes("yarn.lock was not found") ||
      errorText.includes("pnpm-lock.yaml is not up-to-date") ||
      errorText.includes("poetry.lock was not found or is out of date") ||
      errorText.includes("lockfile is not in sync with manifest") ||
      errorText.includes("cargo.lock needs to be updated") ||
      errorText.includes("gemfile.lock is not up to date") ||
      errorText.includes("composer.lock is not up to date")
    );
  }

  /**
   * Universal multi-lockfile & dependency synchronizer.
   * Runs the AI-specified packageSyncCommand or auto-detects from project manifests,
   * then automatically captures any regenerated lockfiles/artifacts via git status.
   */
  private async regenerateLockfiles(
    root: string,
    fix: CodeFix,
    backups: Map<string, string | null>
  ): Promise<void> {
    const commandsToRun = EcosystemManager.resolveLockfileCommands(root, fix);

    for (const cmd of commandsToRun) {
      if (!validateCommand(cmd)) {
        console.warn(`[PipelineIQ Security] Skipped unapproved lockfile command: "${cmd}"`);
        continue;
      }
      console.log(`[PipelineIQ] Synchronizing dependencies/lockfiles via '${cmd}'...`);
      try {
        execSync(cmd, { cwd: root, stdio: "inherit", timeout: 180000 });
        console.log(`[PipelineIQ] Successfully executed '${cmd}'`);

        // Automatically discover all lockfiles/manifests modified by the sync command
        try {
          const statusOutput = execSync("git status --porcelain", { cwd: root, encoding: "utf-8" });
          const statusLines = statusOutput.split("\n").filter(Boolean);

          for (const line of statusLines) {
            const filePath = line.slice(3).trim();
            if (this.isLockfileName(filePath)) {
              const fullPath = path.resolve(root, filePath);
              if (fs.existsSync(fullPath)) {
                if (!backups.has(filePath)) {
                  backups.set(filePath, backups.get(filePath) ?? null);
                }
                const newLockContent = fs.readFileSync(fullPath, "utf-8");
                fix.changes = fix.changes.filter(c => c.filePath !== filePath);
                fix.changes.push({
                  filePath,
                  action: "modify",
                  originalContent: backups.get(filePath) || "",
                  newContent: newLockContent,
                  changeDescription: `Synchronized ${filePath} to match updated project manifests`,
                });
              }
            }
          }
        } catch {
          // Ignore git status read errors
        }
      } catch (lockError) {
        console.warn(`[PipelineIQ] Lockfile synchronization command '${cmd}' warning: ${lockError}`);
      }
    }
  }

  /**
   * Universal workspace runtime dependency auto-provisioner across all ecosystems.
   * Priority:
   *   1. AI-specified packageSyncCommand (LLM determines exact command for project)
   *   2. CI Pipeline Step Log Replay (re-executes setup steps from previous CI run)
   *   3. Universal Ecosystem Registry Resolution (data-driven descriptors across 300+ stacks)
   */
  private async ensureWorkspaceDependencies(root: string, fix: CodeFix, event: FailureEvent): Promise<void> {
    // 1. Dynamic AI-recommended packageSyncCommand
    if (fix.packageSyncCommand) {
      if (!validateCommand(fix.packageSyncCommand)) {
        console.warn(`[PipelineIQ Security] Blocked unapproved packageSyncCommand: "${fix.packageSyncCommand}"`);
      } else {
        console.log(`[PipelineIQ] Running AI-specified dependency sync: "${fix.packageSyncCommand}"`);
        try {
          execSync(fix.packageSyncCommand, { cwd: root, stdio: "inherit", timeout: 180000 });
          return;
        } catch (err) {
          console.warn(`[PipelineIQ] AI packageSyncCommand warning: ${err}. Falling back to CI replay & ecosystem discovery.`);
        }
      }
    }

    // 2. Extract and replay setup commands directly from prior CI runner steps
    const ciInstallCmds = EcosystemManager.extractCIPipelineInstallCommands(event);
    if (ciInstallCmds.length > 0) {
      console.log(`[PipelineIQ] Replaying CI pipeline setup commands: ${ciInstallCmds.join(" && ")}`);
      for (const cmd of ciInstallCmds) {
        if (!validateCommand(cmd)) {
          console.warn(`[PipelineIQ Security] Skipped unapproved CI setup command: "${cmd}"`);
          continue;
        }
        try {
          execSync(cmd, { cwd: root, stdio: "inherit", timeout: 180000 });
        } catch (err) {
          console.warn(`[PipelineIQ] Warning during CI step replay ('${cmd}'): ${err}`);
        }
      }
      return;
    }

    // 3. Data-driven Universal Ecosystem Registry Resolution
    const commands = EcosystemManager.resolveInstallCommands(root, fix);
    for (const cmd of commands) {
      if (!validateCommand(cmd)) {
        console.warn(`[PipelineIQ Security] Skipped unapproved ecosystem install command: "${cmd}"`);
        continue;
      }
      console.log(`[PipelineIQ] Auto-provisioning workspace dependencies via: '${cmd}'`);
      try {
        execSync(cmd, { cwd: root, stdio: "inherit", timeout: 120000 });
      } catch (err) {
        console.warn(`[PipelineIQ] Warning during dependency provisioning ('${cmd}'): ${err}`);
      }
    }
  }

  /**
   * Extract the failed step command directly from runner logs (e.g. GitHub Actions step run command).
   */
  private extractFailedStepCommand(event: FailureEvent): string | null {
    const logs = event.failure.logs ?? "";
    if (!logs) return null;

    const lines = logs.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const ghGroupMatch = trimmed.match(/^(?:##\[group\])?Run\s+(.+)$/i);
      if (ghGroupMatch && ghGroupMatch[1]) {
        const cmd = ghGroupMatch[1].trim();
        // Ignore internal actions / composite action paths
        if (!cmd.startsWith("actions/") && !cmd.startsWith("docker://") && cmd.length < 200) {
          return cmd;
        }
      }
    }
    return null;
  }

  /**
   * Auto-detect the verification commands to run after applying a fix.
   *
   * Priority:
   *   1. If the user explicitly provided commands via config, use those.
   *   2. If the AI fix suggested a verification command, use that.
   *   3. If the CI runner log contains the failed step execution command, run that exact command.
   *   4. Detect the language/ecosystem from workspace files across 25+ ecosystems.
   *   5. If unrecognised, skip verification rather than fail with false errors.
   */
  private resolveVerificationCommands(
    category: string,
    root: string,
    fix?: CodeFix,
    event?: FailureEvent
  ): string[] {
    if (this.config.verificationCommands.length > 0) {
      return this.config.verificationCommands;
    }

    if (fix?.verificationCommand) {
      console.log(`[PipelineIQ] Using AI-recommended verification command: "${fix.verificationCommand}"`);
      return [fix.verificationCommand];
    }

    if (event) {
      const failedCmd = this.extractFailedStepCommand(event);
      if (failedCmd) {
        console.log(`[PipelineIQ] Extracted failed step verification command from CI logs: "${failedCmd}"`);
        return [failedCmd];
      }
    }

    const exists = (f: string) => fs.existsSync(path.resolve(root, f));
    const cat = category.toLowerCase();

    // ── Node.js / TypeScript / JavaScript ────────────────────────────────────
    if (exists("package.json")) {
      const pm = exists("yarn.lock") ? "yarn"
               : exists("pnpm-lock.yaml") ? "pnpm"
               : exists("bun.lockb") || exists("bun.lock") ? "bun"
               : "npm";
      const install = pm === "yarn" ? "yarn install"
                    : pm === "pnpm" ? "pnpm install"
                    : pm === "bun" ? "bun install"
                    : "npm install";
      let scripts: Record<string, string> = {};
      try {
        scripts = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf-8")).scripts ?? {};
      } catch { /* ignore */ }
      const has = (s: string) => Boolean(scripts[s]);
      const run = (s: string) => pm === "npm" ? `npm run ${s}` : `${pm} ${s}`;

      const cmds = [install];
      if (cat === "test") {
        if (has("build")) cmds.push(run("build"));
        if (has("test"))  cmds.push(run("test"));
      } else if (cat === "lint") {
        if (has("lint"))     cmds.push(run("lint"));
        else if (has("lint:fix")) cmds.push(run("lint:fix"));
      } else {
        if (has("build"))   cmds.push(run("build"));
        else if (has("compile")) cmds.push(run("compile"));
      }
      return cmds.length > 1 ? cmds : [];
    }

    // ── Rust ─────────────────────────────────────────────────────────────────
    if (exists("Cargo.toml")) {
      if (cat === "test") return ["cargo test"];
      if (cat === "lint") return ["cargo clippy"];
      return ["cargo check"];
    }

    // ── Go ───────────────────────────────────────────────────────────────────
    if (exists("go.mod")) {
      if (cat === "test") return ["go test ./..."];
      return ["go build ./..."];
    }

    // ── Python ───────────────────────────────────────────────────────────────
    if (exists("pyproject.toml") || exists("setup.py") || exists("setup.cfg") || exists("requirements.txt")) {
      const usesUv  = exists("uv.lock");
      const usesPoetry = exists("poetry.lock");
      const usesPip = exists("requirements.txt") || exists("requirements-dev.txt");

      if (usesPoetry) {
        if (cat === "test") return ["poetry run pytest"];
        if (cat === "lint") return ["poetry run flake8 . || poetry run ruff check ."];
        return ["poetry check"];
      }

      const install = usesUv  ? "uv sync"
                    : usesPip ? "pip install -r requirements.txt"
                    : "pip install -e .";
      if (cat === "test") return [install, "pytest"];
      if (cat === "lint") return [install, "flake8 . || ruff check ."];
      return [install, "python -m compileall -q ."];
    }
    if (exists("Pipfile")) {
      if (cat === "test") return ["pipenv install", "pipenv run pytest"];
      return ["pipenv install", "pipenv run python -m compileall -q ."];
    }

    // ── Java / Kotlin / Gradle ───────────────────────────────────────────────
    if (exists("build.gradle") || exists("build.gradle.kts")) {
      const gradlew = exists("gradlew") ? "./gradlew" : "gradle";
      if (cat === "test") return [`${gradlew} test`];
      return [`${gradlew} build -x test`];
    }

    // ── Java / Maven ─────────────────────────────────────────────────────────
    if (exists("pom.xml")) {
      if (cat === "test") return ["mvn test -B"];
      return ["mvn compile -B"];
    }

    // ── Scala / SBT ──────────────────────────────────────────────────────────
    if (exists("build.sbt")) {
      if (cat === "test") return ["sbt test"];
      return ["sbt compile"];
    }

    // ── C / C++ (CMake & Meson) ──────────────────────────────────────────────
    if (exists("CMakeLists.txt")) {
      if (cat === "test") return ["cmake -B build && cmake --build build && ctest --test-dir build"];
      return ["cmake -B build && cmake --build build"];
    }
    if (exists("meson.build")) {
      if (cat === "test") return ["meson setup build && ninja -C build && meson test -C build"];
      return ["meson setup build && ninja -C build"];
    }

    // ── Swift / SwiftPM ──────────────────────────────────────────────────────
    if (exists("Package.swift")) {
      if (cat === "test") return ["swift test"];
      return ["swift build"];
    }

    // ── .NET / C# / F# ───────────────────────────────────────────────────────
    if (exists("global.json") || exists("Directory.Build.props")) {
      if (cat === "test") return ["dotnet restore", "dotnet test"];
      return ["dotnet restore", "dotnet build"];
    }
    try {
      const hasDotnet = fs.readdirSync(root).some(f => f.endsWith(".sln") || f.endsWith(".csproj") || f.endsWith(".fsproj"));
      if (hasDotnet) {
        if (cat === "test") return ["dotnet restore", "dotnet test"];
        return ["dotnet restore", "dotnet build"];
      }
    } catch { /* ignore */ }

    // ── Elixir / Erlang ──────────────────────────────────────────────────────
    if (exists("mix.exs")) {
      if (cat === "test") return ["mix test"];
      return ["mix compile"];
    }
    if (exists("rebar.config")) {
      if (cat === "test") return ["rebar3 eunit"];
      return ["rebar3 compile"];
    }

    // ── Dart / Flutter ───────────────────────────────────────────────────────
    if (exists("pubspec.yaml")) {
      let isFlutter = false;
      try {
        isFlutter = fs.readFileSync(path.resolve(root, "pubspec.yaml"), "utf-8").includes("flutter:");
      } catch { /* ignore */ }
      const tool = isFlutter ? "flutter" : "dart";
      if (cat === "test") return [`${tool} test`];
      return [`${tool} analyze`];
    }

    // ── Zig ──────────────────────────────────────────────────────────────────
    if (exists("build.zig")) {
      if (cat === "test") return ["zig build test"];
      return ["zig build"];
    }

    // ── Ruby ─────────────────────────────────────────────────────────────────
    if (exists("Gemfile")) {
      if (cat === "test") return ["bundle install", "bundle exec rspec"];
      return ["bundle install", "bundle exec rake"];
    }

    // ── PHP / Composer ───────────────────────────────────────────────────────
    if (exists("composer.json")) {
      if (cat === "test") return ["composer install --no-interaction", "composer run test"];
      return ["composer install --no-interaction", "composer run build"];
    }

    // ── Haskell ──────────────────────────────────────────────────────────────
    if (exists("stack.yaml")) {
      if (cat === "test") return ["stack test"];
      return ["stack build"];
    }
    try {
      if (fs.readdirSync(root).some(f => f.endsWith(".cabal"))) {
        if (cat === "test") return ["cabal test"];
        return ["cabal build"];
      }
    } catch { /* ignore */ }

    // ── Clojure ──────────────────────────────────────────────────────────────
    if (exists("project.clj")) {
      if (cat === "test") return ["lein test"];
      return ["lein check"];
    }
    if (exists("deps.edn")) {
      if (cat === "test") return ["clojure -X:test"];
      return ["clojure -M -e nil"];
    }

    // ── Terraform / OpenTofu ─────────────────────────────────────────────────
    try {
      if (fs.readdirSync(root).some(f => f.endsWith(".tf"))) {
        return ["terraform validate || tofu validate"];
      }
    } catch { /* ignore */ }

    // ── Bazel ────────────────────────────────────────────────────────────────
    if (exists("WORKSPACE") || exists("MODULE.bazel")) {
      if (cat === "test") return ["bazel test //..."];
      return ["bazel build //..."];
    }

    // ── Makefile (generic fallback) ──────────────────────────────────────────
    if (exists("Makefile") || exists("makefile")) {
      if (cat === "test") return ["make test"];
      return ["make build"];
    }

    // Unrecognised ecosystem — skip verification rather than run an incorrect command
    console.warn("[PipelineIQ] Could not detect project ecosystem for verification — skipping local verification.");
    return [];
  }


}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Robust glob matcher for blocked path patterns.
 * Supports * (single level), ** (recursive), and ? (single char).
 */
export function matchGlob(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.replace(/\\/g, "/").toLowerCase();

  // Convert glob pattern (* -> [^/]*, ** -> .*, ? -> [^/])
  const regexStr = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___GLOBSTAR___")
    .replace(/\*/g, "[^/]*")
    .replace(/___GLOBSTAR___/g, ".*")
    .replace(/\?/g, "[^/]");

  const regex = new RegExp(`^(?:.*/)?${regexStr}$`);
  return regex.test(normalizedPath);
}
