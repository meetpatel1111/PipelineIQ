import { describe, it, expect, vi } from "vitest";
import { EnhancedJiraClient } from "../enhanced-client.js";

describe("EnhancedJiraClient.transitionIssue intelligence", () => {
  const auth = {
    baseUrl: "https://acme.atlassian.net",
    type: "cloud" as const,
    email: "bot@acme.com",
    apiToken: "secret",
  };

  it("transitions when transition name matches exact or case-insensitively", async () => {
    const client = new EnhancedJiraClient(auth);
    vi.spyOn(client, "request").mockImplementation(async (method: string, url: string) => {
      if (method === "GET" && url.includes("/transitions")) {
        return {
          transitions: [
            { id: "31", name: "In Progress" },
            { id: "41", name: "Done" },
          ],
        };
      }
      if (method === "POST" && url.includes("/transitions")) {
        return undefined;
      }
      return {};
    });

    await expect(client.transitionIssue("PROJ-1", "done")).resolves.not.toThrow();
  });

  it("resolves alias 'Done' to 'Resolved' or 'Closed' when 'Done' is not literally present", async () => {
    const client = new EnhancedJiraClient(auth);
    const postSpy = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(client, "request").mockImplementation(async (method: string, url: string, data?: any) => {
      if (method === "GET" && url.includes("/transitions")) {
        return {
          transitions: [
            { id: "11", name: "Start Work" },
            { id: "71", name: "Resolved", to: { statusCategory: { key: "done" } } },
          ],
        };
      }
      if (method === "POST" && url.includes("/transitions")) {
        return postSpy(data);
      }
      return {};
    });

    await client.transitionIssue("PROJ-1", "Done");
    expect(postSpy).toHaveBeenCalledWith({
      transition: { id: "71" },
    });
  });

  it("automatically supplies required resolution field when present on transition screen", async () => {
    const client = new EnhancedJiraClient(auth);
    const postSpy = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(client, "request").mockImplementation(async (method: string, url: string, data?: any) => {
      if (method === "GET" && url.includes("/transitions")) {
        return {
          transitions: [
            {
              id: "51",
              name: "Close Issue",
              fields: {
                resolution: {
                  required: true,
                  name: "Resolution",
                  allowedValues: [
                    { id: "1", name: "Cannot Reproduce" },
                    { id: "2", name: "Fixed" },
                  ],
                },
              },
            },
          ],
        };
      }
      if (method === "POST" && url.includes("/transitions")) {
        return postSpy(data);
      }
      return {};
    });

    await client.transitionIssue("PROJ-1", "Done");
    expect(postSpy).toHaveBeenCalledWith({
      transition: { id: "51" },
      fields: {
        resolution: { name: "Fixed" },
      },
    });
  });
});
