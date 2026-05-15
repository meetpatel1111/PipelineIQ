export { processFailureEvent } from "./pipeline.js";
export type { ProcessResult, ProcessOptions } from "./pipeline.js";
export type { Enricher, EnrichmentContext } from "./enrichers/types.js";
export { setField } from "./enrichers/types.js";
export { deterministicEnricher } from "./enrichers/deterministic.js";
export { computedEnricher } from "./enrichers/computed.js";
export { aiEnricher } from "./enrichers/ai.js";
export { renderDescription } from "./renderer.js";
export { computeDedupSignature } from "./dedup.js";
export { matchSignature, SIGNATURES } from "./signatures.js";
export type { SignaturePattern, SignatureMatch } from "./signatures.js";
export { maskSecrets } from "./secret-mask.js";

// Sub-modules
export * from "./types/index.js";
export * from "./ai/index.js";
export * from "./log-parser/index.js";
export * from "./jira/index.js";

// Notifications
export { NotificationService } from "./notifications/index.js";
export type { NotificationPayload, NotificationResult, NotificationsConfig } from "./notifications/index.js";

// Operational metrics (ComputedMetrics is part of ProcessResult)
export type { ComputedMetrics } from "./types/operational-metrics.js";

