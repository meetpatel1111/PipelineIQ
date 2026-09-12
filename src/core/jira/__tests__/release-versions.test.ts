import { describe, it, expect } from "vitest";
import { extractReleaseVersions, matchJiraVersion } from "../version-extractor.js";

describe("extractReleaseVersions", () => {
  it("extracts version candidates from standard release branches", () => {
    expect(extractReleaseVersions("release/v1.2.0")).toEqual(["v1.2.0", "1.2.0"]);
    expect(extractReleaseVersions("release/2.4.0")).toEqual(["2.4.0", "v2.4.0"]);
    expect(extractReleaseVersions("releases/v3.0.1")).toEqual(["v3.0.1", "3.0.1"]);
    expect(extractReleaseVersions("rc/v2.1.0-beta.1")).toEqual(["v2.1.0-beta.1", "2.1.0-beta.1"]);
  });

  it("extracts version candidates from git semver tags", () => {
    expect(extractReleaseVersions("v1.5.0")).toEqual(["v1.5.0", "1.5.0"]);
    expect(extractReleaseVersions("2.0.0")).toEqual(["2.0.0", "v2.0.0"]);
  });

  it("returns empty array for non-release branches", () => {
    expect(extractReleaseVersions("feat/PAY-100-checkout")).toEqual([]);
    expect(extractReleaseVersions("fix/broken-tests")).toEqual([]);
    expect(extractReleaseVersions("main")).toEqual([]);
    expect(extractReleaseVersions("")).toEqual([]);
    expect(extractReleaseVersions(null)).toEqual([]);
  });

  it("supports custom release version pattern", () => {
    expect(extractReleaseVersions("deploy-prod-2026.09.1", "deploy-prod-([0-9.]+)"))
      .toEqual(["2026.09.1"]);
  });
});

describe("matchJiraVersion", () => {
  const jiraVersions = [
    { id: "100", name: "1.2.0" },
    { id: "101", name: "v2.0.0" },
    { id: "102", name: "3.0.0-rc1" },
  ];

  it("matches version case-insensitively across candidates", () => {
    expect(matchJiraVersion(["v1.2.0", "1.2.0"], jiraVersions)).toBe("1.2.0");
    expect(matchJiraVersion(["v2.0.0", "2.0.0"], jiraVersions)).toBe("v2.0.0");
    expect(matchJiraVersion(["3.0.0-rc1", "v3.0.0-rc1"], jiraVersions)).toBe("3.0.0-rc1");
  });

  it("returns undefined when no candidate exists in Jira project versions", () => {
    expect(matchJiraVersion(["9.9.9", "v9.9.9"], jiraVersions)).toBeUndefined();
    expect(matchJiraVersion([], jiraVersions)).toBeUndefined();
  });
});
