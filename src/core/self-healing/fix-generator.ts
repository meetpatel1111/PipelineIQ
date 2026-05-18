import * as fs from "fs";
import * as path from "path";
import type { FailureEvent } from "../types/index.js";
import type { CodeFix, FileChange } from "../types/self-healing.js";
import type { AIEngineConfig, AIProviderInterface } from "../ai/types.js";
import { OpenAIProvider, AnthropicProvider, AzureOpenAIProvider, LocalAIProvider } from "../ai/providers.js";
import { GeminiProvider } from "../ai/gemini-provider.js";

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
  ): Promise<CodeFix | null> {
    if (!this.provider) return null;

    const prompt = this.buildFixPrompt(event, rootCause, remediation, category);

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

  /**
   * Extract potential file paths from logs and error messages.
   * Looks for standard file extensions.
   */
  private extractFilePaths(text: string): string[] {
    // Regex matches relative or absolute-looking paths with common extensions
    // e.g., src/utils/auth.ts, lib/core.py, Dockerfile
    const regex = /(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+\.(?:ts|js|jsx|tsx|json|yml|yaml|py|go|java|rb|php|cs|cpp|c|h)\b/g;
    const matches = text.match(regex) || [];
    
    // Deduplicate and filter out obvious false positives
    return [...new Set(matches)].filter(p => !p.includes("node_modules"));
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

    // Limit to max 5 files to preserve token budget
    for (const p of paths.slice(0, 5)) {
      try {
        const fullPath = path.resolve(root, p);
        
        // Security: Ensure path is within workspace
        if (!fullPath.startsWith(path.resolve(root))) continue;
        
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, "utf-8");
          // Truncate huge files to prevent blowing up the context window
          const truncated = content.split('\n').slice(0, 1000).join('\n');
          
          fileContents.push(`--- FILE: ${p} ---\n${truncated}`);
        }
      } catch (e) {
        // Silently ignore read errors
      }
    }

    if (fileContents.length === 0) return "";

    return `\nLOCAL WORKSPACE CONTEXT (Source Code for failing files):\n${fileContents.join("\n\n")}\n`;
  }

  /**
   * Build the specialized prompt for code fix generation.
   * This is the core of the self-healing intelligence.
   */
  private buildFixPrompt(
    event: FailureEvent,
    rootCause: string,
    remediation: string[],
    category: string,
  ): string {
    const workspaceContext = this.getWorkspaceContext(event, rootCause);

    return `You are a CI/CD Self-Healing Engine. Your task is to generate a PRECISE code fix for a pipeline failure.

IMPORTANT RULES:
- Generate comprehensive fixes that address the root cause entirely.
- You may modify as many files and lines as necessary to ensure the pipeline succeeds.
- NEVER modify files containing secrets, credentials, or environment variables.
- Output ONLY valid JSON — no markdown fences, no explanation outside JSON.
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
${event.failure.errorMessage ?? "No error message"}

RELEVANT LOGS (last 100 lines):
${(event.failure.logs ?? "").split("\n").slice(-100).join("\n")}${workspaceContext}

Generate a JSON response with this EXACT structure:
{
  "canFix": true,
  "title": "Short fix title (max 80 chars)",
  "description": "What the fix does and why",
  "confidence": 0.85,
  "riskLevel": "low",
  "estimatedTimeSavedMinutes": 15,
  "changes": [
    {
      "filePath": "relative/path/to/file.ts",
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
      };
    } catch (error) {
      console.warn(`[PipelineIQ] Failed to parse AI fix response: ${error}`);
      return null;
    }
  }
}
