/**
 * Heuristic secret masking for log excerpts before they hit Jira.
 * Defense-in-depth — pipelines should also use platform-level secret masking,
 * but we redact obvious patterns as a safety net.
 */
const PATTERNS: ReadonlyArray<[RegExp, string]> = [
  // Generic tokens / API keys (AKIA…, ghp_…, sk-…, glpat-…, etc.)
  [/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bgho_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_OAUTH]"],
  [/\bgithub_pat_[A-Za-z0-9_]{82}\b/g, "[REDACTED_GITHUB_FINE_GRAINED_PAT]"],
  [/\bglpat-[A-Za-z0-9_\-]{20}\b/g, "[REDACTED_GITLAB_PAT]"],
  [/\bsk-ant-api[A-Za-z0-9_\-]{80,}\b/g, "[REDACTED_ANTHROPIC_KEY]"],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, "[REDACTED_OPENAI_KEY]"],
  [/\bhf_[A-Za-z0-9]{34}\b/g, "[REDACTED_HUGGINGFACE_TOKEN]"],
  // Azure & Sensitive GUIDs (only in sensitive context)
  [/(password|passwd|pwd|secret|api[_-]?key|token|auth|bearer)\s*[:=]\s*([a-z0-9]{8}-(?:[a-z0-9]{4}-){3}[a-z0-9]{12})\b/gi, "$1=[REDACTED_UUID]"],
  [/SharedAccessKey=[A-Za-z0-9+/=]{30,}/g, "SharedAccessKey=[REDACTED]"],
  // GCP / Google AI
  [/\bAIza[0-9A-Za-z\\-_]{35}\b/g, "[REDACTED_GCP_API_KEY]"],
  // Slack
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_SLACK_TOKEN]"],
  // Stripe
  [/\b(sk|pk)_(test|live)_[0-9a-zA-Z]{24}\b/g, "[REDACTED_STRIPE_KEY]"],
  // Database connection strings
  [/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(mysql:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  // Bearer tokens
  [/Bearer\s+[A-Za-z0-9._\-]{20,}/g, "Bearer [REDACTED]"],
  // Basic auth header
  [/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, "Authorization: Basic [REDACTED]"],
  // Generic password=... patterns
  [/(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[^\s"']{6,}/gi, "$1=[REDACTED]"],
  // JWT-ish (three dot-separated base64 segments)
  [/\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g, "[REDACTED_JWT]"],
  // Private keys (RSA, EC, OPENSSH, etc.)
  [/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]+?-----END OPENSSH PRIVATE KEY-----/g, "[REDACTED_OPENSSH_PRIVATE_KEY]"],
];

export function maskSecrets(input: string): string {
  let out = input;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
