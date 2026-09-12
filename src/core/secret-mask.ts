/**
 * Heuristic secret masking for log excerpts before they hit Jira.
 * Defense-in-depth — pipelines should also use platform-level secret masking,
 * but we redact obvious patterns as a safety net.
 */
const PATTERNS: ReadonlyArray<[RegExp, string]> = [
  // 1. Exact Vendor Token Formats (highest specificity)
  [/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED_AWS_KEY]"],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bgho_[A-Za-z0-9]{20,}\b/g, "[REDACTED_GITHUB_OAUTH]"],
  [/\bgithub_pat_[A-Za-z0-9_]{82}\b/g, "[REDACTED_GITHUB_FINE_GRAINED_PAT]"],
  [/\bglpat-[A-Za-z0-9_\-]{20}\b/g, "[REDACTED_GITLAB_PAT]"],
  [/\bsk-ant-api[A-Za-z0-9_\-]{80,}\b/g, "[REDACTED_ANTHROPIC_KEY]"],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, "[REDACTED_OPENAI_KEY]"],
  [/\bhf_[A-Za-z0-9]{34}\b/g, "[REDACTED_HUGGINGFACE_TOKEN]"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/g, "[REDACTED_GCP_API_KEY]"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_SLACK_TOKEN]"],
  [/\b(sk|pk)_(test|live)_[0-9a-zA-Z]{24}\b/g, "[REDACTED_STRIPE_KEY]"],
  [/SharedAccessKey=[A-Za-z0-9+/=]{30,}/g, "SharedAccessKey=[REDACTED]"],

  // 2. Private Keys and Certificates
  [/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]+?-----END OPENSSH PRIVATE KEY-----/g, "[REDACTED_OPENSSH_PRIVATE_KEY]"],

  // 3. Database Connection Strings
  [/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],
  [/(mysql:\/\/[^:]+:)[^@]+(@)/gi, "$1[REDACTED]$2"],

  // 4. Auth Headers & JWTs
  [/Bearer\s+[A-Za-z0-9._\-]{20,}/g, "Bearer [REDACTED]"],
  [/Authorization:\s*Basic\s+[A-Za-z0-9+/=]+/gi, "Authorization: Basic [REDACTED]"],
  [/\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g, "[REDACTED_JWT]"],

  // 5. Sensitive UUIDs (only in key/token/secret context)
  [/(password|passwd|pwd|secret|api[_-]?key|token|auth|bearer)\s*[:=]\s*([a-z0-9]{8}-(?:[a-z0-9]{4}-){3}[a-z0-9]{12})\b/gi, "$1=[REDACTED_UUID]"],

  // 6. Generic password/token catch-all (lowest specificity)
  [/(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*["']?(?!\[REDACTED)[^\s"']{6,}/gi, "$1=[REDACTED]"],
];

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SENSITIVE_KEY_SUBSTRINGS = [
  "TOKEN", "SECRET", "PASSWORD", "PASSWD", "API_KEY", "APIKEY", "AUTH", "CREDENTIAL", "PRIVATE_KEY"
];

const IGNORED_SECRET_VALUES = new Set([
  "true", "false", "null", "undefined", "none", "0", "1", "default", "development", "production", "test"
]);

/**
 * Automatically inspects process.env for sensitive tokens and keys.
 */
export function getRuntimeEnvironmentSecrets(): string[] {
  const secrets: string[] = [];
  if (typeof process === "undefined" || !process.env) {
    return secrets;
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length < 5) continue;
    if (IGNORED_SECRET_VALUES.has(trimmed.toLowerCase())) continue;

    const upperKey = key.toUpperCase();
    if (SENSITIVE_KEY_SUBSTRINGS.some((s) => upperKey.includes(s))) {
      secrets.push(trimmed);
    }
  }

  return Array.from(new Set(secrets));
}

export function maskSecrets(input: string, extraSecrets: string[] = []): string {
  if (!input) return input;
  let out = input;

  const dynamicSecrets = Array.from(
    new Set([
      ...extraSecrets.filter((s) => s && s.trim().length >= 4),
      ...getRuntimeEnvironmentSecrets(),
    ]),
  ).sort((a, b) => b.length - a.length);

  for (const secret of dynamicSecrets) {
    const escaped = escapeRegExp(secret);
    const regex = new RegExp(escaped, "g");
    out = out.replace(regex, "[REDACTED_SECRET]");
  }

  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
