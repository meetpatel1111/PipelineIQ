import { describe, it, expect } from "vitest";
import { TestImpactAnalyzer } from "../test-impact.js";
import * as path from "node:path";

describe("TestImpactAnalyzer (Predictive Test Selection - PTS)", () => {
  it("identifies test files vs source files", () => {
    expect(TestImpactAnalyzer.isTestFile("src/utils/math.test.ts")).toBe(true);
    expect(TestImpactAnalyzer.isTestFile("src/utils/math.spec.ts")).toBe(true);
    expect(TestImpactAnalyzer.isTestFile("tests/test_calc.py")).toBe(true);
    expect(TestImpactAnalyzer.isTestFile("pkg/api/handler_test.go")).toBe(true);
    expect(TestImpactAnalyzer.isTestFile("src/utils/math.ts")).toBe(false);
    expect(TestImpactAnalyzer.isTestFile("app/services/auth.py")).toBe(false);
  });

  it("finds corresponding test files for modified source files in local workspace", () => {
    const root = process.cwd();
    // Test matching on an existing file in PipelineIQ
    const changedFiles = ["src/core/secret-mask.ts"];
    const foundTests = TestImpactAnalyzer.findCorrespondingTests(root, changedFiles);

    // PipelineIQ has src/core/__tests__/secret-mask.test.ts
    expect(foundTests.length).toBeGreaterThan(0);
    expect(foundTests[0]).toContain("secret-mask.test.ts");
  });

  it("resolves targeted vitest verification command for changed TypeScript files", () => {
    const root = process.cwd();
    const changedFiles = ["src/core/secret-mask.ts"];
    const targetedCommand = TestImpactAnalyzer.resolveTargetedVerificationCommand(root, changedFiles);

    expect(targetedCommand).toBeDefined();
    expect(targetedCommand).toContain("vitest run");
    expect(targetedCommand).toContain("secret-mask.test.ts");
  });

  it("returns null when no matching test files exist", () => {
    const root = process.cwd();
    const changedFiles = ["src/non-existent-module-xyz123.ts"];
    const targetedCommand = TestImpactAnalyzer.resolveTargetedVerificationCommand(root, changedFiles);

    expect(targetedCommand).toBeNull();
  });
});
