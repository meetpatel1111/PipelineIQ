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
    id: "aws-throttling",
    category: "CloudProvider",
    pattern: /Rate exceeded|ThrottlingException|RequestLimitExceeded/i,
    cause: "AWS API request was throttled due to rate limiting.",
    remediation: [
      "Implement or increase exponential backoff in the client.",
      "Check if multiple jobs are making simultaneous API calls.",
      "Request a quota increase for the affected service.",
    ],
  },
  {
    id: "azure-resource-not-found",
    category: "Infrastructure",
    pattern: /ResourceGroupNotFound|ResourceNotFound|ParentResourceNotFound/i,
    cause: "Azure resource or resource group could not be found.",
    remediation: [
      "Verify the resource name and resource group are correct.",
      "Check if the resource was deleted or moved.",
      "Ensure the deployment target region is correct.",
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
  {
    id: "security-scan-vulnerability",
    category: "Security",
    pattern: /(Vulnerability found|CVE-\d+|Critical vulnerability|High severity issue)/i,
    cause: "Security scan detected vulnerabilities in the codebase or dependencies.",
    remediation: [
      "Review the security scan report.",
      "Update vulnerable dependencies to a patched version.",
      "If the vulnerability is a false positive, document and whitelist it.",
    ],
  },
  {
    id: "memory-limit-exceeded",
    category: "Infrastructure",
    pattern: /(OOMKill|out of memory|process killed with signal 9|java.lang.OutOfMemoryError)/i,
    cause: "Process exceeded the allocated memory limit.",
    remediation: [
      "Increase the memory limit for the job/container.",
      "Optimize the application to reduce memory usage.",
      "Check for memory leaks in the application logic.",
    ],
  },
  {
    id: "disk-full",
    category: "Infrastructure",
    pattern: /(No space left on device|Disk full|ENOSPC)/i,
    cause: "Runner or target system ran out of disk space.",
    remediation: [
      "Clean up temporary files or logs.",
      "Increase the disk size of the runner/environment.",
      "Check for large build artifacts that are not being cleaned up.",
    ],
  },
  {
    id: "git-conflict",
    category: "Build",
    pattern: /(CONFLICT \(content\): Merge conflict|Automatic merge failed|fix conflicts and then commit)/i,
    cause: "Merge conflicts detected during git operations.",
    remediation: [
      "Resolve the merge conflicts manually in the codebase.",
      "Ensure you are working on the latest version of the target branch.",
      "Rebase your feature branch on top of the main branch.",
    ],
  },
  {
    id: "api-connection-refused",
    category: "Network",
    pattern: /(ECONNREFUSED|connect ECONNREFUSED|Connection refused)/i,
    cause: "Target service is not reachable or the connection was refused.",
    remediation: [
      "Verify the target service is running.",
      "Check the target host and port are correct.",
      "Review firewall and security group rules between source and target.",
    ],
  },
  {
    id: "db-connection-failed",
    category: "Infrastructure",
    pattern: /(Connection to the database failed|failed to connect to server|Database is starting up)/i,
    cause: "Failed to establish a connection to the database.",
    remediation: [
      "Check database availability and status.",
      "Verify database credentials and connection string.",
      "Ensure the database host is reachable from the runner.",
    ],
  },
];

export type SignatureMatch = SignaturePattern & {
  matchedText: string;
  confidence: number;
};

// Pre-compute grouped signatures for performance
const GROUPED_SIGNATURES = SIGNATURES.reduce((acc, sig) => {
  const cat = sig.category;
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(sig);
  return acc;
}, {} as Record<FailureCategory, SignaturePattern[]>);

/**
 * Enhanced signature matching logic.
 *
 * Performant: Uses pre-grouped patterns.
 * Granular: Supports category hints to narrow the search space.
 */
export function matchSignature(
  input: string,
  options: { categoryHint?: FailureCategory | undefined } = {}
): SignatureMatch | null {
  // If we have a hint, search that category first for better performance and accuracy
  if (options.categoryHint && GROUPED_SIGNATURES[options.categoryHint]) {
    for (const sig of GROUPED_SIGNATURES[options.categoryHint]!) {
      const m = sig.pattern.exec(input);
      if (m) return { ...sig, matchedText: m[0], confidence: 1.0 };
    }
  }

  // Fallback to full search
  for (const sig of SIGNATURES) {
    // Skip if already checked via hint
    if (options.categoryHint && sig.category === options.categoryHint) continue;

    const m = sig.pattern.exec(input);
    if (m) return { ...sig, matchedText: m[0], confidence: 0.9 }; // Slightly lower confidence if hint didn't match
  }

  return null;
}
