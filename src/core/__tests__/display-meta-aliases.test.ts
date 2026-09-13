import { describe, it, expect } from "vitest";
import { renderDescription, METADATA_FIELD_ALIASES } from "../renderer.js";
import type { FailureEvent } from "../types/index.js";

const testEvent: FailureEvent = {
  source: "github",
  startedAt: new Date().toISOString(),
  failedAt: new Date().toISOString(),
  pipeline: {
    name: "ci-build",
    url: "https://github.com/my-org/my-app/actions/runs/42",
    runUrl: "https://github.com/my-org/my-app/actions/runs/42",
    runId: "42",
    runNumber: 42,
    step: "test",
    stage: "build-and-test",
    runnerOs: "Linux",
  },
  repository: {
    owner: "my-org",
    name: "my-app",
    url: "https://github.com/my-org/my-app",
  },
  branch: "main",
  commit: {
    sha: "a1b2c3d4e5f67890",
    url: "https://github.com/my-org/my-app/commit/a1b2c3d4e5f67890",
    message: "feat: add user authentication",
    author: "Alice",
  },
  failure: {
    exitCode: 1,
    failedStep: "npm test",
    errorMessage: "TypeError: Cannot read properties of undefined",
    logs: "error: test failed",
    logsTruncated: false,
  },
  metadata: {
    customTeam: "Platform",
  },
  explicitFields: [],
};

describe("displayMetadata Smart Canonical Aliases & repoName", () => {
  it("resolves exact keys: repository, commit, runNumber", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["repository", "commit", "runNumber"]
    );

    expect(desc).toContain("| Repository | [my-org/my-app](https://github.com/my-org/my-app) |");
    expect(desc).toContain("| Commit | [`a1b2c3d`](https://github.com/my-org/my-app/commit/a1b2c3d4e5f67890) |");
    expect(desc).toContain("| Run Number | 42 |");

    // Other fields should NOT be in the table
    expect(desc).not.toContain("| Branch |");
    expect(desc).not.toContain("| Runner OS |");
    expect(desc).not.toContain("| CustomTeam |");
  });

  it("resolves aliases: repo, commit_id, run_number", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["repo", "commit_id", "run_number"]
    );

    expect(desc).toContain("| Repository | [my-org/my-app](https://github.com/my-org/my-app) |");
    expect(desc).toContain("| Commit | [`a1b2c3d`](https://github.com/my-org/my-app/commit/a1b2c3d4e5f67890) |");
    expect(desc).toContain("| Run Number | 42 |");

    expect(desc).not.toContain("| Branch |");
  });

  it("resolves sha, build_number, and url aliases", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["sha", "build_number", "url"]
    );

    expect(desc).toContain("| Commit | [`a1b2c3d`](https://github.com/my-org/my-app/commit/a1b2c3d4e5f67890) |");
    expect(desc).toContain("| Run Number | 42 |");
    expect(desc).toContain("| Pipeline Run | [View Execution](https://github.com/my-org/my-app/actions/runs/42) |");
  });

  it("supports standalone repoName field (just the repo name without owner)", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["repoName", "commit", "runNumber"]
    );

    expect(desc).toContain("| Repository Name | my-app |");
    expect(desc).not.toContain("| Repository | [my-org/my-app]");
    expect(desc).toContain("| Commit | [`a1b2c3d`]");
    expect(desc).toContain("| Run Number | 42 |");
  });

  it("resolves repo_name, reponame, repository_name aliases to repoName", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["repo_name", "commit"]
    );

    expect(desc).toContain("| Repository Name | my-app |");
    expect(desc).toContain("| Commit | [`a1b2c3d`]");
  });

  it("handles whitespace and case-insensitivity in displayMetadata", () => {
    const desc = renderDescription(
      testEvent,
      {},
      10,
      true,
      ["  REPO  ", " COMMIT_ID ", "  RUN_NUMBER  "]
    );

    expect(desc).toContain("| Repository | [my-org/my-app](https://github.com/my-org/my-app) |");
    expect(desc).toContain("| Commit | [`a1b2c3d`](https://github.com/my-org/my-app/commit/a1b2c3d4e5f67890) |");
    expect(desc).toContain("| Run Number | 42 |");
  });

  it("exports METADATA_FIELD_ALIASES lookup dictionary", () => {
    expect(METADATA_FIELD_ALIASES.repo).toBe("repository");
    expect(METADATA_FIELD_ALIASES.commit_id).toBe("commit");
    expect(METADATA_FIELD_ALIASES.sha).toBe("commit");
    expect(METADATA_FIELD_ALIASES.run_number).toBe("runNumber");
    expect(METADATA_FIELD_ALIASES.build_number).toBe("runNumber");
    expect(METADATA_FIELD_ALIASES.repo_name).toBe("repoName");
  });
});
