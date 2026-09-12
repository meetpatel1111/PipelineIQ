import { describe, it, expect } from "vitest";
import { handleExec } from "../index.js";

describe("handleExec - Command Execution Wrapper", () => {
  it("returns 0 when command succeeds", async () => {
    // node -e "process.exit(0)"
    const code = await handleExec(["node", "-e", "process.exit(0)"], { dryRun: true });
    expect(code).toBe(0);
  });

  it("returns non-zero exit code when command fails", async () => {
    // node -e "console.error('Fatal crash'); process.exit(42)"
    const code = await handleExec(["node", "-e", "process.exit(42)"], {
      dryRun: true,
      jiraProject: "DEVOPS",
      jiraUrl: "https://acme.atlassian.net",
      jiraEmail: "bot@acme.com",
      jiraToken: "secret",
      aiMode: "disabled",
      dedup: { enabled: false },
    });
    expect(code).toBe(42);
  });

  it("handles empty command arguments gracefully", async () => {
    const code = await handleExec([], {});
    expect(code).toBe(1);
  });
});
