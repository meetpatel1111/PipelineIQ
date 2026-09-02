import type {
  FailureCategory,
  Severity,
  Priority,
} from "../types/index.js";
import { computeDedupSignature, computeFailureFingerprint } from "../dedup.js";
import { matchSignature, type SignatureMatch } from "../signatures.js";
import { DeterministicFallbackEngine } from "../ai/fallbacks.js";
import type { Enricher, EnrichmentContext } from "./types.js";
import { setField } from "./types.js";
import {
  extractErrorMessages,
  extractFailedCommands,
  extractExitCodes,
} from "../log-parser/extractors.js";

/**
 * ComputedEnricher — derives fields via heuristics, pattern matching, and
 * (eventually) history queries. Runs after Deterministic, before AI.
 *
 * This is where the signature library lights up the RCA + remediation fallback,
 * the dedup signature is computed, and the severity rules are applied.
 */
export const computedEnricher: Enricher = {
  name: "computed",
  source: "computed",

  enrich(ctx: EnrichmentContext) {
    const { event } = ctx;
    const logs = event.failure.logs || "";
    const errorMessage = event.failure.errorMessage || "";
    const searchSpace = `${errorMessage}\n${logs}`;
    
    // 1. Extract structural hints from logs
    const failedCommands = extractFailedCommands(logs);
    const exitCodes = extractExitCodes(logs);
    const errorMessages = extractErrorMessages(searchSpace);

    // 2. Determine likely category based on extracted hints (Pre-Signature Hinting)
    let categoryHint: FailureCategory | undefined;
    if (failedCommands.some(c => c.includes("terraform"))) categoryHint = "Infrastructure";
    else if (failedCommands.some(c => c.includes("npm") || c.includes("yarn") || c.includes("pip"))) categoryHint = "Dependency";
    else if (failedCommands.some(c => c.includes("docker") || c.includes("helm") || c.includes("kubectl"))) categoryHint = "Deployment";
    else if (errorMessages.some(m => m.toLowerCase().includes("test") || m.toLowerCase().includes("assert"))) categoryHint = "Test";

    // 3. AI-First Strategy: Only run full signature matching if AI is disabled.
    // If AI is enabled, we only need a stable category for the dedup signature.
    const aiEnabled = ctx.config.ai.mode !== "disabled";
    
    let category: FailureCategory = "Unknown";
    let match: SignatureMatch | null = null;

    if (aiEnabled) {
      // Light-weight classification for stable dedup signature
      category = DeterministicFallbackEngine.generateClassification(event);
      setField(ctx, "category", category, "computed");
    } else {
      // AI is disabled — run full deterministic signature matching now
      match = matchSignature(searchSpace, { categoryHint });
      category = match?.category ?? categoryHint ?? "Unknown";
      setField(ctx, "category", category, match ? "computed" : "fallback");

      // 1. Standardized Root Cause Analysis (RCA)
      const rca = match?.cause ?? (failedCommands.length > 0
        ? `Command '${failedCommands[0]}' failed${exitCodes.length > 0 ? ` (exit ${exitCodes[0]})` : ""}.${errorMessages.length > 0 ? ` ${errorMessages[0]}` : ""}`
        : DeterministicFallbackEngine.generateRootCause(event, category));
      setField(ctx, "rca", rca, match ? "computed" : "fallback", true);

      // 2. Standardized Remediation Steps
      const remediation = match?.remediation ?? (failedCommands.length > 0
        ? [
            "Verify command syntax, flags, and script arguments.",
            "Check that required dependencies and CLI tools are installed in the CI runner environment.",
            "Review step execution logs for specific error details.",
          ]
        : DeterministicFallbackEngine.generateRemediation(category, event));
      setField(ctx, "remediationSteps", remediation, match ? "computed" : "fallback", true);

      // 3. Standardized Title (Summary)
      // Format: [Category] Pipeline '<pipeline>' failed at '<step>' with error "<conciseError>" (<branch>)
      const step = event.pipeline.step ?? event.failure.failedStep ?? "step";
      const exitInfo = event.failure.exitCode !== undefined ? ` (exit ${event.failure.exitCode})` : "";
      const catPrefix = category && category !== "Unknown" ? `[${category}] ` : "";
      const pipelineName = event.pipeline.name;
      const branchOrPr = event.pullRequest ? `PR #${event.pullRequest.number}` : event.branch;
      const conciseError = extractConciseError(event.failure.errorMessage, event.failure.logs);

      let standardizedSummary: string;
      if (conciseError) {
        standardizedSummary = `${catPrefix}Pipeline '${pipelineName}' failed at '${step}' with error "${conciseError}" (${branchOrPr})`;
      } else {
        standardizedSummary = `${catPrefix}Pipeline '${pipelineName}' failed at '${step}' on ${branchOrPr}${exitInfo}`;
      }

      if (standardizedSummary.length > 250) {
        standardizedSummary = standardizedSummary.substring(0, 247) + "...";
      }
      setField(ctx, "summary", standardizedSummary, "computed", true);

      if (match) {
        ctx.fields.customFields = {
          ...(ctx.fields.customFields ?? {}),
          _rca: match.cause,
          _remediation: match.remediation,
          _signatureId: match.id,
          _matchConfidence: match.confidence,
        };
      } else if (failedCommands.length > 0) {
        const cmd = failedCommands[0]!;
        const code = exitCodes.length > 0 ? ` (exit ${exitCodes[0]})` : "";
        ctx.fields.customFields = {
          ...(ctx.fields.customFields ?? {}),
          _rca: `Command '${cmd}' failed${code}.`,
          _remediation: [
            "Verify command syntax.",
            "Check tool installation in runner.",
          ],
        };
      }
    }

    // Severity rules — rule-based fallback. Tunable.
    const severity = computeSeverity(ctx);
    setField(ctx, "severity", severity, "computed");
    setField(ctx, "priority", severityToPriority(severity), "computed");

    // Dedup signature — deterministic given event + category.
    const signature = computeDedupSignature(event, category);
    setField(ctx, "dedupSignature", signature, "computed");

    // Repo-independent fingerprint — lets blast-radius counting span repositories.
    const failureFingerprint = computeFailureFingerprint(event, category);

    // Append standard labels
    const labels = new Set(ctx.fields.labels ?? []);
    labels.add(`piq-sig:${signature}`);
    labels.add(`piq-fp:${failureFingerprint}`);
    if (category !== "Unknown") labels.add(`piq-cat:${category.toLowerCase()}`);
    labels.add(aiEnabled ? "piq-mode:ai" : "piq-mode:deterministic");
    setField(ctx, "labels", Array.from(labels), "computed", true);
  },
};

/**
 * Severity rules — heuristic baseline. AI can override later.
 *
 * Current rules (intentionally simple — tune in collaboration with the user):
 *   - prod environment + (Infrastructure or Deployment or Network) → Critical
 *   - prod environment, any failure → High
 *   - main/master branch, any failure → High
 *   - Security category, any env → High
 *   - PR / feature branch test or build failure → Medium
 *   - anything else → Low
 */
function computeSeverity(ctx: EnrichmentContext): Severity {
  const { event } = ctx;
  const env = (event.environment ?? "").toLowerCase();
  const cat = (ctx.fields.category ?? "Unknown") as FailureCategory;
  const isProd = env === "production" || env === "prod";
  const isMain = event.branch === "main" || event.branch === "master";

  if (isProd && (cat === "Infrastructure" || cat === "Deployment" || cat === "Network")) {
    return "Critical";
  }
  if (cat === "Security") return "High";
  if (isProd) return "High";
  if (isMain) return "High";
  if (event.pullRequest) return "Medium";
  return "Low";
}

function severityToPriority(severity: Severity): Priority {
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

/**
 * Extract a concise, single-line error message for the summary title
 */
function extractConciseError(errorMessage?: string, logs?: string): string | null {
  if (errorMessage && errorMessage.trim().length > 0) {
    const firstLine = errorMessage.trim().split("\n")[0]!;
    const clean = firstLine.replace(/^(?:Error:\s*|npm ERR!\s*|fatal:\s*|Exception:\s*)/i, "").trim();
    if (clean.length > 0) {
      return clean.length > 70 ? clean.substring(0, 67) + "..." : clean;
    }
  }

  if (logs) {
    const errors = extractErrorMessages(logs);
    if (errors.length > 0) {
      const clean = errors[0]!.split("\n")[0]!.replace(/^(?:Error:\s*|npm ERR!\s*|fatal:\s*|Exception:\s*)/i, "").trim();
      if (clean.length > 0) {
        return clean.length > 70 ? clean.substring(0, 67) + "..." : clean;
      }
    }
  }

  return null;
}

