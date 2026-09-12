import { describe, it, expect } from "vitest";
import { extractJiraKeys, findReferencedIssueKeys } from "../key-extractor.js";
import type { FailureEvent } from "../../types/index.js";

describe("extractJiraKeys", () => {
  it("extracts Jira issue keys from typical branch names", () => {
    expect(extractJiraKeys("feat/PROJ-1234-payment-flow")).toEqual(["PROJ-1234"]);
    expect(extractJiraKeys("fix/DEVOPS-42_broken-build")).toEqual(["DEVOPS-42"]);
    expect(extractJiraKeys("PROJ-101-patch-2")).toEqual(["PROJ-101"]);
  });

  it("extracts multiple unique keys from commit messages and PR titles", () => {
    const text = "fix(auth): resolve PROJ-100 and PROJ-200 token expiration (relates to PROJ-100)";
    expect(extractJiraKeys(text)).toEqual(["PROJ-100", "PROJ-200"]);
  });

  it("handles null, empty, or non-matching text safely", () => {
    expect(extractJiraKeys(null)).toEqual([]);
    expect(extractJiraKeys("")).toEqual([]);
    expect(extractJiraKeys("feature/no-jira-ticket-here")).toEqual([]);
    expect(extractJiraKeys("A-1")).toEqual([]); // prefix must be >= 2 chars
  });
});

describe("findReferencedIssueKeys", () => {
  const baseEvent: FailureEvent = {
    source: "github",
    startedAt: "2026-09-13T00:00:00.000Z",
    failedAt: "2026-09-13T00:01:00.000Z",
    branch: "feat/PAY-99-checkout-redesign",
    pipeline: {
      name: "CI Pipeline",
      runId: "1001",
      url: "https://github.com/acme/app/actions/runs/1001",
    },
    failure: {
      errorMessage: "AssertionError: Expected 200 got 500",
      logs: "",
      logsTruncated: false,
    },
    repository: {
      name: "app",
      owner: "acme",
      url: "https://github.com/acme/app",
    },
    commit: {
      sha: "abc123456789",
      url: "https://github.com/acme/app/commit/abc123456789",
      message: "fix(checkout): address PAY-100 edge cases [skip ci]",
    },
    pullRequest: {
      number: 42,
      title: "[PAY-99] [PAY-101] Redesign checkout flow",
      url: "https://github.com/acme/app/pull/42",
      author: "dev",
    },
    metadata: {},
    explicitFields: [],
  };

  it("extracts and deduplicates referenced keys across branch, commit, and PR title", () => {
    const keys = findReferencedIssueKeys(baseEvent);
    expect(keys).toEqual(["PAY-99", "PAY-100", "PAY-101"]);
  });

  it("filters out keys matching the target incident project key", () => {
    const eventWithIncidentKey: FailureEvent = {
      ...baseEvent,
      branch: "fix/DEVOPS-500-fix-ci",
      pullRequest: undefined,
      commit: {
        sha: "123",
        url: "https://github.com/acme/app/commit/123",
        message: "DEVOPS-500 fix runner error and reference PAY-88",
      },
    };

    // Ignore DEVOPS project keys
    const keys = findReferencedIssueKeys(eventWithIncidentKey, "DEVOPS");
    expect(keys).toEqual(["PAY-88"]);
  });
});
