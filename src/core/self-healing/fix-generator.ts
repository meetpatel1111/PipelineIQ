import * as fs from "fs";
import * as path from "path";
import type { FailureEvent } from "../types/index.js";
import type { CodeFix, FileChange } from "../types/self-healing.js";
import type { AIEngineConfig, AIProviderInterface } from "../ai/types.js";
import { OpenAIProvider, AnthropicProvider, AzureOpenAIProvider, LocalAIProvider } from "../ai/providers.js";
import { GeminiProvider } from "../ai/gemini-provider.js";
import { maskSecrets } from "../secret-mask.js";

/**
 * AI-powered code fix generator.
 *
 * Takes a FailureEvent with its diagnostic context (root cause, remediation steps)
 * and asks the AI to produce a structured code patch that can be committed as a fix.
 *
 * The generator uses a specialized prompt that constrains the AI to produce
 * surgical, low-risk fixes — never sweeping refactors.
 */
export class FixGenerator {
  private provider: AIProviderInterface | null = null;

  constructor(config: AIEngineConfig) {
    this.provider = this.initializeProvider(config);
  }

  private initializeProvider(config: AIEngineConfig): AIProviderInterface | null {
    if (!config.provider || !config.apiKey) return null;

    try {
      switch (config.provider) {
        case "openai":
          return new OpenAIProvider(config);
        case "anthropic":
          return new AnthropicProvider(config);
        case "azure-openai":
          return new AzureOpenAIProvider(config);
        case "local":
          return new LocalAIProvider(config);
        case "gemini":
          return new GeminiProvider(config);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  isAvailable(): boolean {
    return this.provider !== null && this.provider.isAvailable();
  }

  /**
   * Generate a structured code fix from the failure context.
   *
   * @param event       The full failure event with logs, errors, etc.
   * @param rootCause   AI-generated root cause analysis
   * @param remediation AI-generated remediation steps
   * @param category    Failure classification
   * @returns           A CodeFix if the AI can produce one, or null
   */
  async generateFix(
    event: FailureEvent,
    rootCause: string,
    remediation: string[],
    category: string,
    retryContext?: { previousError: string; diff?: string | undefined },
  ): Promise<CodeFix | null> {
    if (!this.provider) return null;

    const prompt = this.buildFixPrompt(event, rootCause, remediation, category, retryContext);

    try {
      // Use the provider's generateInsights with a specialized prompt
      // We abuse the AIRequest.logs field to pass our specialized prompt
      const response = await this.provider.generateInsights({
        logs: prompt,
        errorMessage: event.failure.errorMessage ?? "",
        pipelineName: event.pipeline.name,
        repositoryName: event.repository.name,
        branch: event.branch,
        category,
        isRawPrompt: true,
      });

      // The response's rootCause field will contain the JSON fix (we instruct the AI this way)
      const fixJson = response.rootCause;
      if (!fixJson) return null;

      return this.parseFix(fixJson, category);
    } catch (error) {
      console.warn(`[PipelineIQ] Fix generation failed: ${error}`);
      return null;
    }
  }

  /**
   * Determine the root workspace path (GitHub, ADO, or local fallback)
   */
  private getWorkspaceRoot(): string {
    return (
      process.env.GITHUB_WORKSPACE ||
      process.env.SYSTEM_DEFAULTWORKINGDIRECTORY ||
      process.cwd()
    );
  }

  private extractFilePaths(text: string): string[] {
    // Regex 1: Matches paths with file extensions (e.g. src/dataManager.ts, python/calc.py, contracts/Auth.sol, etc.)
    const regexExt = /(?:[a-zA-Z0-9_.-]+[\\/])*[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_-]+\b/g;
    const matchesExt = (text.match(regexExt) || []).map(p => p.replace(/^[\\/]+/, "").replace(/[\\/]+$/, "").replace(/\\/g, "/"));

    // Regex 2: Matches common standalone files without extensions
    const standaloneNames = ["Dockerfile", "Containerfile", "Makefile", "makefile", "Jenkinsfile", "Gemfile", "Procfile", "Rakefile", "Vagrantfile", "Brewfile", "Fastfile", "Tiltfile"];
    const standaloneMatches: string[] = [];
    for (const name of standaloneNames) {
      if (text.includes(name)) {
        standaloneMatches.push(name);
      }
    }
    
    // Deduplicate and filter out obvious false positives
    const candidates = [...new Set([...matchesExt, ...standaloneMatches])].filter(
      p => !p.includes("node_modules") && !p.includes(".git/") && !/^\d+\.\d+/.test(p) && p.length > 2
    );

    const root = this.getWorkspaceRoot();
    const resultPaths: string[] = [...candidates];

    // Universal manifest discovery: append standard project manifests if present on disk
    const commonManifests = [
      "package.json", "Cargo.toml", "go.mod", "pyproject.toml", "requirements.txt",
      "Pipfile", "pom.xml", "build.gradle", "build.gradle.kts", "build.sbt",
      "mix.exs", "pubspec.yaml", "Package.swift", "CMakeLists.txt", "composer.json",
      "Gemfile", "build.zig", "dbt_project.yml", "foundry.toml", "Anchor.toml"
    ];

    for (const manifest of commonManifests) {
      try {
        if (!resultPaths.includes(manifest) && fs.existsSync(path.resolve(root, manifest))) {
          resultPaths.push(manifest);
        }
      } catch {
        // Ignore file access errors
      }
    }

    return resultPaths;
  }

  /**
   * Read files from the local workspace to give the AI context.
   */
  private getWorkspaceContext(event: FailureEvent, rootCause: string): string {
    const textToScan = `${event.failure.errorMessage ?? ""}\n${event.failure.logs ?? ""}\n${rootCause}`;
    const paths = this.extractFilePaths(textToScan);
    
    if (paths.length === 0) return "";

    const root = this.getWorkspaceRoot();
    const fileContents: string[] = [];

    // Helper: find file in workspace if only relative or filename was captured
    const findInWorkspace = (filename: string, dir: string = root, depth: number = 0): string | null => {
      if (depth > 4) return null;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
          const full = path.join(dir, entry.name);
          if (entry.isFile() && (entry.name === filename || full.endsWith(path.normalize(filename)))) {
            return path.relative(root, full).replace(/\\/g, "/");
          }
          if (entry.isDirectory()) {
            const found = findInWorkspace(filename, full, depth + 1);
            if (found) return found;
          }
        }
      } catch {
        // Ignore read errors
      }
      return null;
    };

    // Load up to 15 verified workspace files
    for (const p of paths.slice(0, 15)) {
      try {
        let fullPath = path.resolve(root, p);
        let finalRelPath = p;

        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          const basename = path.basename(p);
          const resolvedRel = findInWorkspace(basename);
          if (resolvedRel) {
            fullPath = path.resolve(root, resolvedRel);
            finalRelPath = resolvedRel;
          }
        }

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, "utf-8");
          // Truncate large files to prevent blowing up the context window
          const truncated = content.split('\n').slice(0, 1000).join('\n');
          
          fileContents.push(`================================================================================\nFILE: ${finalRelPath}\n================================================================================\n${truncated}`);
        }
      } catch (e) {
        // Silently ignore read errors
      }
    }

    if (fileContents.length === 0) return "";

    return fileContents.join("\n\n");
  }

  /**
   * Build the specialized prompt for code fix generation.
   * Universal across all languages, frameworks, and build systems.
   */
  private buildFixPrompt(
    event: FailureEvent,
    rootCause: string,
    remediation: string[],
    category: string,
    retryContext?: { previousError: string; diff?: string | undefined },
  ): string {
    const workspaceContext = this.getWorkspaceContext(event, rootCause);
    const retrySection = retryContext
      ? `\nPREVIOUS ATTEMPT FAILED VERIFICATION:\nYour previous fix was applied locally and failed the build with this error:\n${retryContext.previousError}\n\nHere is the exact code patch you generated in that failed attempt (Git Diff):\n\`\`\`diff\n${retryContext.diff || "No diff available"}\n\`\`\`\n\nGenerate a CORRECTED fix that addresses both the original failure AND avoids making the same mistake. Pay special attention to syntax correctness.\n\nCRITICAL INSTRUCTION: The file has been REVERTED to its ORIGINAL state (as shown below in SOURCE CODE FILES). Your \`originalContent\` snippet MUST exactly match the code in SOURCE CODE FILES, NOT the code from your failed patch!\n`
      : "";

    const cleanError = maskSecrets(event.failure.errorMessage ?? "No error message");
    const cleanLogs = maskSecrets((event.failure.logs ?? "").split("\n").slice(-120).join("\n"));
    const cleanWorkspace = maskSecrets(workspaceContext);

    return `You are a Universal CI/CD Self-Healing Engine with comprehensive expertise across the entire 2026 software engineering landscape:
- Programming Languages: JavaScript, TypeScript, Python, Java, C#, C, C++, Go, Rust, PHP, Ruby, Kotlin, Swift, Dart, Scala, R, SQL, Bash, PowerShell, Solidity, Lua, Perl, Haskell, Elixir, Erlang, F#, Objective-C, MATLAB, Julia, Zig, OCaml, Clojure, Gleam, Move, Vyper, CUDA.
- Frameworks & Stacks: React, Next.js, Remix, Vue, Nuxt, Angular, Svelte/SvelteKit, Solid, Astro, HTMX, FastAPI, Django, Flask, Spring Boot, Quarkus, Micronaut, ASP.NET Core, Blazor, Node/Express/NestJS/Fastify/Hono, Gin, Fiber, Axum, Actix Web, Laravel, Symfony, Ruby on Rails, Phoenix, Flutter, React Native, Jetpack Compose, SwiftUI, .NET MAUI, PyTorch, TensorFlow, JAX, Hugging Face, LangChain, LlamaIndex, Spark, dbt, ROS 2, Foundry, Hardhat, Anchor, Terraform, OpenTofu, Pulumi, Kubernetes, Helm.
- Package Managers & Toolchains: npm, pnpm, yarn, bun, deno, pip, poetry, uv, conda, pdm, maven, gradle, sbt, dotnet/nuget, composer, bundler, cargo, go modules, mix, rebar3, flutter/dart pub, swiftpm/cocoapods, cmake, conan, vcpkg, meson, ninja, bazel, zig, dune, lein, cabal, stack, julia pkg, R renv.

Your task is to generate a PRECISE, WORKING code fix for this pipeline failure.${retrySection}

IMPORTANT RULES:
- Generate surgical or comprehensive fixes that address the root cause completely across any language, framework, manifest, or build system.
- Fix the application source code (e.g., src/*, lib/*, tests/*, contracts/*, python/*, rust/*, golang/*, etc.) or dependency manifests (package.json, pyproject.toml, Cargo.toml, go.mod, pom.xml, build.gradle, composer.json, Gemfile, etc.).
- The actual source code of the failing files is provided below under "SOURCE CODE FILES (Loaded from Local Workspace)". Use the exact code from that section for your \`originalContent\` and \`newContent\` patches.
- If multiple files contain errors or need adjustments, return a separate change item in the \`changes\` array for each file (e.g. changes for src/dataManager.ts, src/mathUtils.ts, and src/index.ts).
- If runtime dependencies, modules, or lockfile regeneration are required, output the exact shell command in \`packageSyncCommand\` (e.g., 'uv sync', 'pnpm install', 'bundle install', 'composer install', 'mix deps.get', 'dotnet restore', 'cargo fetch', 'pip install -r requirements.txt').
- Output the exact compilation or test command in \`verificationCommand\` (e.g., 'npm test', 'pytest', 'cargo test', 'go test ./...', 'dotnet test', 'mvn test', 'mix test', 'flutter test', 'forge test').
- NEVER modify CI/CD workflow files (.github/workflows/*, azure-pipelines.yml, Jenkinsfile, .gitlab-ci.yml) when application code, compiler errors, or test failures occur. CI workflow files are strictly protected by security guardrails.
- NEVER modify files containing secrets, credentials, tokens, or environment keys (*.env, *.key, *.pem).
- Output ONLY valid JSON — no markdown fences, no text outside the JSON object.
- If you cannot generate a confident fix, return: {"canFix": false, "reason": "explanation"}

FAILURE CONTEXT:
- Repository: ${event.repository.owner}/${event.repository.name}
- Branch: ${event.branch}
- Pipeline: ${event.pipeline.name}
- Failed Step: ${event.pipeline.step ?? "unknown"}
- Exit Code: ${event.failure.exitCode ?? "unknown"}
- Category: ${category}

ROOT CAUSE:
${rootCause}

REMEDIATION STEPS:
${remediation.map((s, i) => `${i + 1}. ${s}`).join("\n")}

ERROR MESSAGE:
${cleanError}

RELEVANT LOGS:
${cleanLogs}

SOURCE CODE FILES (Loaded from Local Workspace):
${cleanWorkspace || "(No workspace files found)"}

Generate a JSON response with this EXACT structure:
{
  "canFix": true,
  "title": "Short fix title (max 80 chars)",
  "description": "What the fix does and why",
  "confidence": 0.85,
  "riskLevel": "low",
  "estimatedTimeSavedMinutes": 15,
  "verificationCommand": "optional command to verify (e.g. 'pytest tests/', 'cargo test', 'forge test', 'mix test', 'flutter test', 'npm test')",
  "packageSyncCommand": "optional command to sync/regenerate dependencies or lockfiles (e.g. 'uv sync', 'pnpm install', 'forge build', 'bundle install', 'mix deps.get')",
  "changes": [
    {
      "filePath": "path/to/file.ext",
      "action": "modify",
      "originalContent": "...exact snippet from the file to replace...",
      "newContent": "...new snippet to insert...",
      "changeDescription": "What this specific change does"
    }
  ]
}`;
  }

  /**
   * Parse the AI response into a structured CodeFix.
   */
  private parseFix(rawResponse: string, category: string): CodeFix | null {
    try {
      // Extract JSON from the response (handle markdown fences)
      let jsonStr = rawResponse;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      if (!parsed.canFix) {
        console.info(`[PipelineIQ] AI determined fix is not possible: ${parsed.reason ?? "unknown"}`);
        return null;
      }

      if (!parsed.changes || !Array.isArray(parsed.changes) || parsed.changes.length === 0) {
        return null;
      }

      const changes: FileChange[] = parsed.changes.map((c: any) => ({
        filePath: c.filePath,
        action: c.action ?? "modify",
        originalContent: c.originalContent,
        newContent: c.newContent,
        changeDescription: c.changeDescription ?? "Auto-generated fix",
      }));

      const fixId = `piq-fix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      return {
        id: fixId,
        title: parsed.title ?? "Automated pipeline fix",
        description: parsed.description ?? "Fix generated by PipelineIQ Self-Healing Engine",
        changes,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        category,
        riskLevel: parsed.riskLevel ?? "medium",
        estimatedTimeSavedMinutes: parsed.estimatedTimeSavedMinutes,
        verificationCommand: typeof parsed.verificationCommand === "string" && parsed.verificationCommand.trim() ? parsed.verificationCommand.trim() : undefined,
        packageSyncCommand: typeof parsed.packageSyncCommand === "string" && parsed.packageSyncCommand.trim() ? parsed.packageSyncCommand.trim() : undefined,
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Failed to parse AI fix response: ${error}`);
      console.warn(`[PipelineIQ] Raw AI response was:`, rawResponse);
      return null;
    }
  }
}
