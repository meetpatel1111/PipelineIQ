import { createHash } from "node:crypto";
import type { FailureEvent, FailureCategory } from "./types/index.js";

/**
 * Deterministic dedup signature.
 *
 * Two failures collide on the same signature when they share:
 *   repo + pipeline + failed step + failure category + error-shape fingerprint
 *
 * The "error-shape fingerprint" normalizes the error message — strips numbers,
 * UUIDs, paths, and timestamps — so that "Lock ID: 8d7a6" and "Lock ID: 9e8b7"
 * dedupe to the same incident.
 */
export function computeDedupSignature(
  event: FailureEvent,
  category: FailureCategory,
): string {
  const parts = [
    event.repository.owner,
    event.repository.name,
    event.pipeline.name,
    event.pipeline.step ?? event.failure.failedStep ?? "",
    category,
    fingerprint(getFailureExcerpt(event)),
  ].join("|");

  return createHash("sha1").update(parts).digest("hex").slice(0, 16);
}

/**
 * Repo-independent failure fingerprint.
 *
 * Unlike the dedup signature — which is scoped to a single repo + pipeline + step —
 * this hashes only the failure *shape* (category + normalized error text). The same
 * underlying failure (e.g. a bad shared dependency) surfacing in DIFFERENT repositories
 * therefore collides on the same fingerprint. Emitted as a `piq-fp:` label and used by
 * HistoryService.getMetrics() to compute blast radius (how many repos a failure touches).
 */
export function computeFailureFingerprint(
  event: FailureEvent,
  category: FailureCategory,
): string {
  const parts = [
    category,
    fingerprint(getFailureExcerpt(event)),
  ].join("|");

  return createHash("sha1").update(parts).digest("hex").slice(0, 16);
}

function getFailureExcerpt(event: FailureEvent): string {
  if (event.failure.errorMessage && event.failure.errorMessage.trim().length > 0) {
    return event.failure.errorMessage;
  }
  const logs = event.failure.logs ?? "";
  // In CI logs, error diagnostics and stack traces are positioned at the tail of execution
  return logs.length > 3000 ? logs.slice(-3000) : logs;
}

function fingerprint(text: string): string {
  const clean = text
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "") // strip terminal ANSI escape codes
    .replace(/\r\n/g, "\n")
    .replace(/\b[0-9a-f]{8,}\b/gi, "X") // hex IDs / UUIDs
    .replace(/\b\d+\b/g, "N") // raw numbers
    .replace(/(\/[\w.\-]+)+/g, "/PATH") // file paths
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+/g, "TIMESTAMP")
    .replace(/\s+/g, " ")
    .trim();

  // For long logs/excerpts, the critical failure reason/stack is at the tail
  return clean.length > 500 ? clean.slice(-500) : clean;
}
