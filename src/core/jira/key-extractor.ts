import type { FailureEvent } from "../types/index.js";

/**
 * Regex matching standard Jira issue keys (e.g. PROJ-123, DEVOPS-456).
 * Project key: Starts with an uppercase letter, followed by 1 to 30 alphanumeric characters.
 * Issue number: One or more digits.
 * Boundaries: Not preceded by an alphanumeric character, and not followed by a digit.
 */
export const JIRA_KEY_REGEX = /(?:(?<=[^A-Za-z0-9])|^)([A-Z][A-Z0-9]{1,30}-\d+)(?=[^0-9]|$)/g;

/**
 * Extracts all unique Jira issue keys found in a string of text.
 */
export function extractJiraKeys(text?: string | null): string[] {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(JIRA_KEY_REGEX);
  if (!matches) return [];
  // Trim any non-alphanumeric boundary artifacts if needed and deduplicate
  return Array.from(new Set(matches.map((k) => k.trim().toUpperCase())));
}

/**
 * Inspects branch name, commit message, and pull request title from a FailureEvent,
 * returning all unique referenced Jira issue keys.
 *
 * Optionally excludes keys from an ignored project key (e.g. the incident project).
 */
export function findReferencedIssueKeys(
  event: FailureEvent,
  ignoreProjectKey?: string
): string[] {
  const candidates: string[] = [];

  // 1. Branch name (e.g. feat/PROJ-123-add-stripe, PROJ-456_fix)
  if (event.branch) {
    candidates.push(...extractJiraKeys(event.branch));
  }

  // 2. Commit message
  const commitMsg = event.commit?.message || (event.repository as any)?.commit?.message;
  if (commitMsg) {
    candidates.push(...extractJiraKeys(commitMsg));
  }

  // 3. Pull Request title
  const prTitle = event.pullRequest?.title || (event.repository as any)?.pullRequest?.title;
  if (prTitle) {
    candidates.push(...extractJiraKeys(prTitle));
  }

  const unique = Array.from(new Set(candidates));

  if (!ignoreProjectKey) {
    return unique;
  }

  const prefixToIgnore = `${ignoreProjectKey.toUpperCase()}-`;
  return unique.filter((key) => !key.startsWith(prefixToIgnore));
}
