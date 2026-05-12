export { processFailureEvent } from "./pipeline.js";
export type { ProcessResult, ProcessOptions } from "./pipeline.js";
export type { Enricher, EnrichmentContext } from "./enrichers/types.js";
export { setField } from "./enrichers/types.js";
export { deterministicEnricher } from "./enrichers/deterministic.js";
export { computedEnricher } from "./enrichers/computed.js";
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

