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
    fingerprint(event.failure.errorMessage ?? event.failure.logs.slice(0, 2000)),
  ].join("|");

  return createHash("sha1").update(parts).digest("hex").slice(0, 16);
}

function fingerprint(text: string): string {
  return text
    .replace(/\b[0-9a-f]{8,}\b/gi, "X") // hex IDs / UUIDs
    .replace(/\b\d+\b/g, "N") // raw numbers
    .replace(/(\/[\w.\-]+)+/g, "/PATH") // file paths
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+/g, "TIMESTAMP")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
