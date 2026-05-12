/**
 * Heuristic secret masking for log excerpts before they hit Jira.
 * Defense-in-depth — pipelines should also use platform-level secret masking,
 * but we redact obvious patterns as a safety net.
 */
const PATTERNS: ReadonlyArray<[RegExp, string]> = [
  // Generic tokens / API keys (AKIA…, ghp_…, sk-…, glpat-…)
  [/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bgho_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_OAUTH]"],
  [/\bglpat-[A-Za-z0-9_\-]{20}\b/g, "[REDACTED_GITLAB_PAT]"],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, "[REDACTED_API_KEY]"],
  // Bearer tokens
  [/Bearer\s+[A-Za-z0-9._\-]{20,}/g, "Bearer [REDACTED]"],
  // Basic auth header
  [/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, "Authorization: Basic [REDACTED]"],
  // Generic password=... patterns
  [/(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[^\s"']{6,}/gi, "$1=[REDACTED]"],
  // JWT-ish (three dot-separated base64 segments)
  [/\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g, "[REDACTED_JWT]"],
];

export function maskSecrets(input: string): string {
  let out = input;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
