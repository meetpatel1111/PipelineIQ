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
      let previousVerificationError: string | undefined;
      let previousDiff: string | undefined;

      for (let verifyAttempt = 1; verifyAttempt <= 2; verifyAttempt++) {
        // On retry: regenerate the fix with the previous error as context so the
        // AI can self-correct (e.g. syntax it broke in the first attempt).
        if (verifyAttempt === 2 && previousVerificationError) {
          console.log("[PipelineIQ] Verification failed — retrying fix generation with error feedback...");
          try {
            const retryFix = await this.fixGenerator.generateFix(
              event, rootCause, remediation, category,
              { previousError: previousVerificationError, diff: previousDiff },
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

          // 1. If it's a lockfile desync, regenerate the lockfile first
          if (this.config.autoRegenerateLockfile && this.isLockfileDesync(event)) {
            console.log("[PipelineIQ] Lockfile desync detected — regenerating lockfile locally via npm install...");
            try {
              const lockPath = path.resolve(root, "package-lock.json");
              if (fs.existsSync(lockPath)) {
                backups.set("package-lock.json", fs.readFileSync(lockPath, "utf-8"));
              } else {
                backups.set("package-lock.json", null);
              }

              execSync("npm install", { cwd: root, stdio: "inherit" });
              console.log("[PipelineIQ] Successfully regenerated package-lock.json");

              if (fs.existsSync(lockPath)) {
                const newLockContent = fs.readFileSync(lockPath, "utf-8");
                fix.changes = fix.changes.filter(c => c.filePath !== "package-lock.json");
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

          // 2. Backup and apply code fixes
          for (const change of fix.changes) {
            if (change.filePath === "package-lock.json") continue;
            const fullPath = path.resolve(root, change.filePath);
            if (fs.existsSync(fullPath)) {
              backups.set(change.filePath, fs.readFileSync(fullPath, "utf-8"));
            } else {
              backups.set(change.filePath, null);
            }

            if (change.action === "delete") {
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            } else if (change.action === "modify" && change.originalContent) {
              const diskContent = backups.get(change.filePath);
              if (diskContent === null || diskContent === undefined) {
                throw new Error(
                  `File "${change.filePath}" was not found in the local workspace (${root}). ` +
                  `Add an "actions/checkout" step before "pipelineiq analyze" in your workflow ` +
                  `so that self-healing verification can read and patch source files.`,
                );
              }
              const originalContent: string = diskContent;
              let patched: string;
              try {
                patched = applyPatch(originalContent, change.originalContent ?? "", change.newContent ?? "", change.filePath, change.action as "modify" | "create" | "delete");
              } catch (patchError) {
                throw new Error(`AI-generated fix references code not found in ${change.filePath} — the snippet may be hallucinated. ${patchError}`);
              }
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, patched, "utf-8");
            } else {
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, change.newContent ?? "", "utf-8");
            }
          }

          // 3. Run verification commands (auto-detected if not explicitly configured)
          const verificationCommands = this.resolveVerificationCommands(category, root);
          if (this.config.enableVerification && verificationCommands.length > 0) {
            console.log(`[PipelineIQ] Running verification commands: ${verificationCommands.join(" && ")}`);
            for (const cmd of verificationCommands) {
              try {
                execSync(cmd, { cwd: root, stdio: "inherit" });
              } catch (cmdError) {
                console.warn(`[PipelineIQ] Verification command "${cmd}" failed: ${cmdError}`);
                throw new Error(`Verification command "${cmd}" failed: ${cmdError}`);
              }
            }
            console.log("[PipelineIQ] Verification commands completed successfully.");
          }

          // 4. Restore workspace files
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
            diffOutput = execSync("git diff", { cwd: root, encoding: "utf-8" });
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

          const errorMsg: string = verifyError.message || String(verifyError);

          // Non-retriable: missing checkout — no point retrying if workspace files don't exist
          const isRetriable = !errorMsg.includes("was not found in the local workspace");

          if (!isRetriable || verifyAttempt >= 2) {
            return {
              attempted: true,
              success: false,
              fix,
              reason: `Local verification/regeneration failed: ${errorMsg}`,
              dryRun: this.config.dryRun,
            };
          }

          // First attempt failed with a build error — save the error and let the
          // loop regenerate the fix with feedback before trying again.
          previousVerificationError = errorMsg;
          previousDiff = diffOutput;
          console.warn("[PipelineIQ] Verification attempt 1 failed — will retry with error context.");
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

  /**
   * Auto-detect the verification commands to run after applying a fix.
   *
   * Priority:
   *   1. If the user explicitly provided commands via config, use those.
   *   2. Detect the language/ecosystem from files in the workspace.
   *   3. Pick install + build/test/lint commands for that ecosystem based on
   *      the failure category.
   *   4. If the ecosystem is unrecognised, return [] (skip verification rather
   *      than running a wrong command and getting a false failure).
   */
  private resolveVerificationCommands(category: string, root: string): string[] {
    if (this.config.verificationCommands.length > 0) {
      return this.config.verificationCommands;
    }

    const exists = (f: string) => fs.existsSync(path.resolve(root, f));
    const cat = category.toLowerCase();

    // ── Node.js ──────────────────────────────────────────────────────────────
    if (exists("package.json")) {
      const pm = exists("yarn.lock") ? "yarn"
               : exists("pnpm-lock.yaml") ? "pnpm"
               : "npm";
      const install = pm === "yarn" ? "yarn install"
                    : pm === "pnpm" ? "pnpm install"
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
      // If only install is left and nothing relevant in scripts, skip
      return cmds.length > 1 ? cmds : [];
    }

    // ── Go ───────────────────────────────────────────────────────────────────
    if (exists("go.mod")) {
      if (cat === "test") return ["go test ./..."];
      return ["go build ./..."];
    }

    // ── Rust ─────────────────────────────────────────────────────────────────
    if (exists("Cargo.toml")) {
      if (cat === "test") return ["cargo test"];
      return ["cargo build"];
    }

    // ── Python ───────────────────────────────────────────────────────────────
    if (exists("pyproject.toml") || exists("setup.py") || exists("setup.cfg")) {
      const usesUv  = exists("uv.lock");
      const usesPip = exists("requirements.txt") || exists("requirements-dev.txt");
      const install = usesUv  ? "uv sync"
                    : usesPip ? "pip install -r requirements.txt"
                    : "pip install -e .";
      if (cat === "test") return [install, "pytest"];
      if (cat === "lint") return [install, "flake8 . || ruff check ."];
      return [install, "python -m py_compile $(find . -name '*.py' -not -path './.git/*')"];
    }
    if (exists("Pipfile")) {
      if (cat === "test") return ["pipenv install", "pipenv run pytest"];
      return ["pipenv install", "pipenv run python -c 'import compileall; compileall.compile_dir(\".\", quiet=True)'"];
    }

    // ── Java / Maven ─────────────────────────────────────────────────────────
    if (exists("pom.xml")) {
      if (cat === "test") return ["mvn test -B"];
      return ["mvn compile -B"];
    }

    // ── Java / Gradle ────────────────────────────────────────────────────────
    if (exists("build.gradle") || exists("build.gradle.kts")) {
      const gradlew = exists("gradlew") ? "./gradlew" : "gradle";
      if (cat === "test") return [`${gradlew} test`];
      return [`${gradlew} build -x test`];
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

    // ── .NET ─────────────────────────────────────────────────────────────────
    if (exists("global.json") || exists("Directory.Build.props")) {
      if (cat === "test") return ["dotnet restore", "dotnet test"];
      return ["dotnet restore", "dotnet build"];
    }
    // Fallback: any .sln or .csproj in root
    try {
      const hasDotnet = fs.readdirSync(root).some(f => f.endsWith(".sln") || f.endsWith(".csproj"));
      if (hasDotnet) {
        if (cat === "test") return ["dotnet restore", "dotnet test"];
        return ["dotnet restore", "dotnet build"];
      }
    } catch { /* ignore */ }

    // ── Makefile (generic) ───────────────────────────────────────────────────
    if (exists("Makefile") || exists("makefile")) {
      if (cat === "test") return ["make test"];
      return ["make build"];
    }

    // Unrecognised ecosystem — skip verification rather than run a wrong command
    console.warn("[PipelineIQ] Could not detect project ecosystem for verification — skipping local verification.");
    return [];
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
