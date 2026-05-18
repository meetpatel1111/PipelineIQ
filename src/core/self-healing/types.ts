import type { CodeFix } from "../types/self-healing.js";

/**
 * Result of creating a Pull Request via a GitProvider
 */
export type PRCreationResult = {
  /** URL of the created PR */
  prUrl: string;
  /** PR number/ID */
  prNumber: number;
  /** Branch name used */
  branchName: string;
};

/**
 * Platform-agnostic interface for Git operations required by Self-Healing.
 *
 * Implementations create a branch → commit changes → open a PR.
 * The PR is always created as draft (when supported) and requires human review.
 */
export interface GitProvider {
  /** Human-readable name (e.g. "github", "azure-devops") */
  readonly name: string;

  /**
   * Create a branch, commit the fix, and open a Pull Request.
   *
   * @param fix        The CodeFix containing file changes
   * @param repoOwner  Repository owner / organization
   * @param repoName   Repository name
   * @param baseBranch The branch to target (the branch that failed)
   * @param baseSha    The commit SHA that failed (branch head)
   * @param issueKey   Jira issue key for cross-linking
   * @param options    Additional options (draft, reviewers, labels)
   */
  createFixPR(
    fix: CodeFix,
    repoOwner: string,
    repoName: string,
    baseBranch: string,
    baseSha: string,
    issueKey: string,
    options: PROptions,
  ): Promise<PRCreationResult>;
}

export type PROptions = {
  /** Use a draft PR (default: true) */
  draft: boolean;
  /** Reviewers to request */
  reviewers: string[];
  /** Labels to apply to the PR */
  labels: string[];
  /** Branch name to use for the fix */
  branchName: string;
};
