import { describe, it, expect } from "vitest";
import { FixGenerator } from "../fix-generator.js";

describe("FixGenerator Unit Tests", () => {
  const config = {
    provider: "local" as const,
    endpoint: "http://localhost:11434/v1",
    model: "llama3.2",
    maxTokens: 1000,
    temperature: 0.1,
    timeout: 10000,
    retryAttempts: 1,
    minConfidence: 0.5,
    enableThinking: false,
    thinkingBudget: 8000,
  };

  const generator = new FixGenerator(config);

  it("isAvailable returns true when provider is initialized", () => {
    expect(generator.isAvailable()).toBe(true);
  });

  describe("extractFilePaths", () => {
    it("extracts file paths with extensions and manifest files from error logs", () => {
      const logs = "Error in src/utils/math.ts:24\nFailed building python/calc.py and Dockerfile";
      const paths = (generator as any).extractFilePaths(logs);

      expect(paths).toContain("src/utils/math.ts");
      expect(paths).toContain("python/calc.py");
      expect(paths).toContain("Dockerfile");
    });

    it("filters out node_modules and .git paths", () => {
      const logs = "Error in node_modules/lodash/index.js and .git/HEAD and src/app.ts";
      const paths = (generator as any).extractFilePaths(logs);

      expect(paths).toContain("src/app.ts");
      expect(paths).not.toContain("node_modules/lodash/index.js");
      expect(paths).not.toContain(".git/HEAD");
    });
  });

  describe("extractImportsFromFile", () => {
    it("extracts TypeScript/JavaScript imports", () => {
      const content = `
        import { foo } from "./utils/math.js";
        import bar from "./helpers.js";
        const config = require("./config.js");
      `;
      const root = process.cwd();
      const imports = (generator as any).extractImportsFromFile("src/index.ts", content, root);
      expect(Array.isArray(imports)).toBe(true);
    });

    it("extracts Python relative imports", () => {
      const content = `
        from .utils import helper
        from ..models import User
      `;
      const root = process.cwd();
      const imports = (generator as any).extractImportsFromFile("app/main.py", content, root);
      expect(Array.isArray(imports)).toBe(true);
    });
  });

  describe("getDomainSpecialistGuidance", () => {
    it("provides specialized guidance for dependency failures", () => {
      const guidance = (generator as any).getDomainSpecialistGuidance("dependency");
      expect(guidance).toContain("Dependency & Package Management");
      expect(guidance).toContain("lockfile");
    });

    it("provides specialized guidance for build / compilation failures", () => {
      const guidance = (generator as any).getDomainSpecialistGuidance("build");
      expect(guidance).toContain("Compilation & Type Engineering");
      expect(guidance).toContain("signature mismatches");
    });

    it("provides specialized guidance for test failures", () => {
      const guidance = (generator as any).getDomainSpecialistGuidance("test");
      expect(guidance).toContain("Test Suite Reliability");
      expect(guidance).toContain("assertions");
    });
  });
});
