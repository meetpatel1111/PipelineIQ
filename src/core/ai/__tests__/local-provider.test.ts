import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — intercepts the dynamic import("openai") inside generateInsights()
vi.mock("openai", () => ({
  OpenAI: vi.fn(),
}));

import { LocalAIProvider } from "../providers.js";
import type { AIEngineConfig } from "../types.js";
import { OpenAI } from "openai";

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
  enableThinking: false,
  thinkingBudget: 8000,
};

const MockedOpenAI = vi.mocked(OpenAI);

function mockCreate(response: unknown) {
  MockedOpenAI.mockImplementation(function (this: any) {
    return {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: typeof response === "string" ? response : JSON.stringify(response) } }],
          }),
        },
      },
    };
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("does not throw when apiKey is undefined (Ollama case)", () => {
    expect(() => new LocalAIProvider({ ...baseConfig, apiKey: undefined })).not.toThrow();
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
    mockCreate({
      summary: "npm peer dep conflict",
      rootCause: "react version mismatch",
      remediation: ["Pin react to ^18"],
      severity: "High",
      classification: "Dependency",
      confidence: 0.85,
    });

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.summary).toBe("npm peer dep conflict");
    expect(result.confidence).toBe(0.85);
  });

  it("returns low-confidence fallback when model returns malformed JSON", async () => {
    mockCreate("sorry, I cannot help with that");

    const provider = new LocalAIProvider(baseConfig);
    const result = await provider.generateInsights(request);
    expect(result.confidence).toBe(0.5);
  });

  it("throws a descriptive error when the HTTP call fails", async () => {
    MockedOpenAI.mockImplementation(function (this: any) {
      return {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error("Connection refused")),
          },
        },
      };
    } as any);

    const provider = new LocalAIProvider(baseConfig);
    await expect(provider.generateInsights(request)).rejects.toThrow(/local ai error/i);
  });

  it("uses the configured baseURL and apiKey when constructing the client", async () => {
    mockCreate({ summary: "test", confidence: 0.9 });

    const provider = new LocalAIProvider(baseConfig);
    await provider.generateInsights(request);

    expect(MockedOpenAI).toHaveBeenCalledWith({
      baseURL: "http://localhost:11434/v1",
      apiKey: "ollama",
    });
  });

  it("uses 'local' as apiKey when config.apiKey is undefined", async () => {
    mockCreate({ summary: "test", confidence: 0.9 });

    const provider = new LocalAIProvider({ ...baseConfig, apiKey: undefined });
    await provider.generateInsights(request);

    expect(MockedOpenAI).toHaveBeenCalledWith({
      baseURL: "http://localhost:11434/v1",
      apiKey: "local",
    });
  });
});
