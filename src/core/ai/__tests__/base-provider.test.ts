import { describe, it, expect } from "vitest";
import { BaseAIProvider } from "../base-provider.js";
import type { AIRequest, AIResponse } from "../types.js";

class TestAIProvider extends BaseAIProvider {
  name = "test-provider";
  isAvailable(): boolean {
    return true;
  }
  async generateInsights(request: AIRequest): Promise<AIResponse> {
    return this.parseResponse('{"summary": "Test failure", "confidence": 0.9}');
  }

  // Public test wrappers for protected methods
  public testBuildPrompt(req: AIRequest) {
    return this.buildPrompt(req);
  }
  public testParseResponse(content: string, usage?: any) {
    return this.parseResponse(content, usage);
  }
  public testCalculateCost(model: string, inTokens: number, outTokens: number) {
    return this.calculateCost(model, inTokens, outTokens);
  }
  public testIsRetryable(msg: string) {
    return this.isRetryableError(msg);
  }
}

describe("BaseAIProvider (DRY-1 & F-6 Token Cost Tracking)", () => {
  const provider = new TestAIProvider();

  it("builds structured prompt with failure details", () => {
    const prompt = provider.testBuildPrompt({
      logs: "Error: build failed",
      errorMessage: "SyntaxError",
      pipelineName: "CI Workflow",
      repositoryName: "org/repo",
      branch: "main",
      category: "Build",
    });

    expect(prompt).toContain("Pipeline: CI Workflow");
    expect(prompt).toContain("Repository: org/repo");
    expect(prompt).toContain("Branch: main");
    expect(prompt).toContain("SyntaxError");
    expect(prompt).toContain("Error: build failed");
  });

  it("parses valid JSON response and attaches token usage and estimated cost", () => {
    const rawJson = JSON.stringify({
      summary: "Package missing",
      rootCause: "npm package lodash is not listed in dependencies",
      remediation: ["Run npm install lodash"],
      severity: "High",
      classification: "Dependency",
      confidence: 0.95,
      failingFiles: ["package.json"],
    });

    const parsed = provider.testParseResponse(rawJson, {
      input: 1000,
      output: 500,
      model: "gpt-4o-mini",
    });

    expect(parsed.summary).toBe("Package missing");
    expect(parsed.rootCause).toBe("npm package lodash is not listed in dependencies");
    expect(parsed.remediation).toEqual(["Run npm install lodash"]);
    expect(parsed.severity).toBe("High");
    expect(parsed.classification).toBe("Dependency");
    expect(parsed.confidence).toBe(0.95);
    expect(parsed.failingFiles).toEqual(["package.json"]);

    // Token usage & cost tracking (F-6)
    expect(parsed.tokensUsed).toEqual({
      input: 1000,
      output: 500,
      total: 1500,
    });
    expect(parsed.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("gracefully falls back when JSON is malformed or freeform", () => {
    const freeform = 'summary: "Something broke"\nrootCause: "Network timeout"\nseverity: "High"';
    const parsed = provider.testParseResponse(freeform);

    expect(parsed.summary).toBe("Something broke");
    expect(parsed.rootCause).toBe("Network timeout");
    expect(parsed.confidence).toBe(0.5);
  });

  it("calculates cost accurately based on model pricing", () => {
    // 1M input tokens + 1M output tokens for gpt-4o ($2.50 in + $10.00 out = $12.50)
    const cost = provider.testCalculateCost("gpt-4o", 1_000_000, 1_000_000);
    expect(cost).toBe(12.50);

    // 10K input + 2K output for claude-3-5-sonnet ($3.00/1M in + $15.00/1M out)
    // 10,000 * 0.000003 = 0.03
    // 2,000 * 0.000015 = 0.03
    // Total = 0.06
    const sonnetCost = provider.testCalculateCost("claude-3-5-sonnet", 10_000, 2_000);
    expect(sonnetCost).toBe(0.06);
  });

  it("correctly identifies retryable errors", () => {
    expect(provider.testIsRetryable("Rate limit exceeded: 429")).toBe(true);
    expect(provider.testIsRetryable("Server 503 unavailable")).toBe(true);
    expect(provider.testIsRetryable("Connection timeout")).toBe(true);
    expect(provider.testIsRetryable("Invalid API key")).toBe(false);
  });
});
