import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import { codeOwnerEnricher } from "../codeowners.js";
import type { EnrichmentContext } from "../types.js";
import type { FailureEvent } from "../../types/index.js";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe("codeOwnerEnricher", () => {
  let mockContext: EnrichmentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      event: {} as FailureEvent,
      config: {} as any,
      fields: {
        failingFiles: ["src/auth/login.ts", "docs/api.md"],
        labels: ["pipelineiq"],
      },
      provenance: {},
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should assign reviewers and assignee based on CODEOWNERS rules", async () => {
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      return String(path).includes("CODEOWNERS");
    });
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      return `
# This is a comment
* @global-owner
src/auth/* @auth-team bob@example.com
docs/* @docs-team
      `;
    });

    await codeOwnerEnricher.enrich(mockContext);

    expect(mockContext.codeowners).toEqual(expect.arrayContaining(["@auth-team", "bob@example.com", "@docs-team"]));
    expect(mockContext.fields.labels).toContain("owner:auth-team");
    expect(mockContext.fields.labels).toContain("owner:docs-team");
    expect(mockContext.fields.assignee).toBe("bob@example.com");
  });

  it("should do nothing if failingFiles is empty", async () => {
    mockContext.fields.failingFiles = [];
    
    await codeOwnerEnricher.enrich(mockContext);

    expect(fs.existsSync).not.toHaveBeenCalled();
    expect(mockContext.codeowners).toBeUndefined();
  });

  it("should handle missing CODEOWNERS file gracefully", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await codeOwnerEnricher.enrich(mockContext);

    expect(mockContext.codeowners).toBeUndefined();
  });
});
