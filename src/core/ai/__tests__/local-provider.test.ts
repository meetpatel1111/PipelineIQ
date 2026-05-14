import { describe, it, expect, vi } from "vitest";
import { LocalAIProvider } from "../providers.js";
import type { AIEngineConfig } from "../types.js";

const baseConfig: AIEngineConfig = {
  provider: "local",
  endpoint: "http://localhost:11434/v1",
  model: "llama3.2",
  apiKey: "ollama",
  maxTokens: 1000,
  temperature: 0.1,
  timeout: 30000,
  retryAttempts: 3,
  minConfidence: 0.6,
};

describe("LocalAIProvider constructor", () => {
  it("throws when endpoint is missing", () => {
    expect(() => new LocalAIProvider({ ...baseConfig, endpoint: undefined })).toThrow(/endpoint/i);
  });

  it("throws when model is missing", () => {
    expect(() => new LocalAIProvider({ ...baseConfig, model: undefined })).toThrow(/model/i);
  });

  it("constructs successfully with valid config", () => {
    expect(() => new LocalAIProvider(baseConfig)).not.toThrow();
  });
});

describe("LocalAIProvider.generateInsights()", () => {
  const request = {
    logs: "npm ERR! peer dep conflict",
    pipelineName: "build",
    repositoryName: "my-org/api",
    branch: "main",
  };

  it("parses a valid JSON response from the local model", async () => {
    const mockResponse = {
      summary: "npm peer dep conflict",
      rootCause: "react version mismatch",
      remediation: ["Pin react to ^18"],
      severity: "High",
      classification: "Dependency",
      confidence: 0.85,
    };

    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify(mockResponse) } }],
            }),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.summary).toBe("npm peer dep conflict");
    expect(result.confidence).toBe(0.85);

    vi.resetModules();
  });

  it("returns low-confidence fallback when model returns malformed JSON", async () => {
    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: "sorry, I cannot help with that" } }],
            }),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.confidence).toBe(0.5);

    vi.resetModules();
  });

  it("throws a descriptive error when the HTTP call fails", async () => {
    vi.doMock("openai", () => ({
      OpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error("Connection refused")),
          },
        },
      })),
    }));

    const provider = new LocalAIProvider(baseConfig);
    await expect(provider.generateInsights(request)).rejects.toThrow(/local ai error/i);

    vi.resetModules();
  });
});
