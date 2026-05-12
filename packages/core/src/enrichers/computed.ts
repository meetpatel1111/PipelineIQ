import type {
  FailureCategory,
  Severity,
  Priority,
} from "../types/index.js";
import { computeDedupSignature } from "../dedup.js";
import { matchSignature } from "../signatures.js";
import type { Enricher, EnrichmentContext } from "./types.js";
import { setField } from "./types.js";

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
    const searchSpace = `${event.failure.errorMessage ?? ""}\n${event.failure.logs}`;
    const match = matchSignature(searchSpace);

    const category: FailureCategory = match?.category ?? "Unknown";
    setField(ctx, "category", category, match ? "computed" : "fallback");

    // RCA / remediation fallback — populated only when AI is off OR as a baseline.
    // The AI stage may later override these via setField(..., override: true).
    if (match) {
      const baseDescription = ctx.fields.description ?? "";
      // We don't write description here — markdown-renderer does that downstream.
      // We stash rca/remediation on customFields for the renderer to consume.
      ctx.fields.customFields = {
        ...(ctx.fields.customFields ?? {}),
        _rca: match.cause,
        _remediation: match.remediation,
        _signatureId: match.id,
      };
    }

    // Severity rules — rule-based fallback. Tunable.
    const severity = computeSeverity(ctx);
    setField(ctx, "severity", severity, "computed");
    setField(ctx, "priority", severityToPriority(severity), "computed");

    // Dedup signature — deterministic given event + category.
    const signature = computeDedupSignature(event, category);
    setField(ctx, "dedupSignature", signature, "computed");

    // Append the signature label so JQL can find duplicates.
    const labels = new Set(ctx.fields.labels ?? []);
    labels.add(`piq-sig:${signature}`);
    if (match) labels.add(`piq-cat:${category.toLowerCase()}`);
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
