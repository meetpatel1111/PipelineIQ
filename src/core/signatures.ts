import type { FailureCategory } from "./types/index.js";

/**
 * Failure signature library — pattern-matches log content and error messages
 * to a known failure category. Drives both deterministic classification and
 * (when AI is disabled) the RCA/remediation fallback.
 *
 * Add new patterns here as you learn them. Order matters: first match wins,
 * so put narrower / higher-confidence patterns above broader ones.
 */
export type SignaturePattern = {
  id: string;
  category: FailureCategory;
  pattern: RegExp;
  cause: string;
  remediation: string[];
};

export const SIGNATURES: readonly SignaturePattern[] = [
  {
    id: "terraform-state-lock",
    category: "Infrastructure",
    pattern: /Error acquiring (the )?state lock/i,
    cause: "Terraform backend state lock could not be acquired.",
    remediation: [
      "Check for concurrent `terraform apply` runs.",
      "If stale, run `terraform force-unlock <LOCK_ID>`.",
      "Retry the deployment.",
    ],
  },
  {
    id: "k8s-image-pull",
    category: "Deployment",
    pattern: /(ImagePullBackOff|ErrImagePull|manifest unknown)/,
    cause: "Kubernetes could not pull the container image.",
    remediation: [
      "Verify the image tag exists in the registry.",
      "Check imagePullSecrets are present and valid.",
      "Confirm the registry is reachable from the cluster.",
    ],
  },
  {
    id: "helm-release-failed",
    category: "Deployment",
    pattern: /(UPGRADE FAILED|release: not found|cannot re-use a name)/,
    cause: "Helm release upgrade or install failed.",
    remediation: [
      "Inspect `helm history` for the release.",
      "Rollback with `helm rollback <release> <revision>` if needed.",
      "Verify chart values against the cluster state.",
    ],
  },
  {
    id: "npm-eresolve",
    category: "Dependency",
    pattern: /(ERESOLVE|peer dep missing|Could not resolve dependency)/i,
    cause: "npm could not resolve the dependency tree.",
    remediation: [
      "Run `npm install --legacy-peer-deps` to inspect the conflict.",
      "Update the offending package or pin a compatible version.",
      "Regenerate the lockfile.",
    ],
  },
  {
    id: "pip-resolution",
    category: "Dependency",
    pattern: /ResolutionImpossible|No matching distribution found/,
    cause: "pip dependency resolution failed.",
    remediation: [
      "Pin conflicting transitive dependencies.",
      "Verify Python version compatibility for each package.",
    ],
  },
  {
    id: "junit-test-failures",
    category: "Test",
    pattern: /(Tests run:.*Failures: [1-9]|FAILED.*test|AssertionError)/,
    cause: "One or more unit tests failed.",
    remediation: [
      "Open the test report attached to this issue.",
      "Reproduce locally with the same seed/env.",
      "Fix or quarantine the failing test.",
    ],
  },
  {
    id: "timeout",
    category: "Timeout",
    pattern: /(timed out|deadline exceeded|operation was cancelled.*timeout)/i,
    cause: "Job exceeded its configured timeout.",
    remediation: [
      "Raise the job/step timeout if work is legitimate.",
      "Profile the slow step.",
      "Split into smaller stages.",
    ],
  },
  {
    id: "auth-401",
    category: "Authentication",
    pattern: /(401 Unauthorized|invalid_token|authentication failed)/i,
    cause: "Authentication failed against an external system.",
    remediation: [
      "Verify the secret/token has not expired.",
      "Confirm the secret is wired into the pipeline correctly.",
    ],
  },
  {
    id: "network-dns",
    category: "Network",
    pattern: /(getaddrinfo (ENOTFOUND|EAI_AGAIN)|temporary failure in name resolution)/i,
    cause: "DNS resolution failed.",
    remediation: [
      "Check the hostname spelling.",
      "Verify VPC/firewall egress rules.",
      "Retry — may be transient infrastructure flap.",
    ],
  },
  {
    id: "docker-build",
    category: "Build",
    pattern: /(executor failed running|returned a non-zero code|Dockerfile.*not found)/,
    cause: "Docker build step failed.",
    remediation: [
      "Inspect the failing RUN instruction.",
      "Verify the build context contains all expected files.",
    ],
  },
  {
    id: "compile-error",
    category: "Build",
    pattern: /(error TS\d+|error: cannot find|compilation failed|SyntaxError)/,
    cause: "Source compilation failed.",
    remediation: [
      "Read the first error in the log — fix imports/syntax.",
      "Re-run locally before pushing.",
    ],
  },
];

export type SignatureMatch = SignaturePattern & {
  matchedText: string;
};

export function matchSignature(input: string): SignatureMatch | null {
  for (const sig of SIGNATURES) {
    const m = sig.pattern.exec(input);
    if (m) return { ...sig, matchedText: m[0] };
  }
  return null;
}
