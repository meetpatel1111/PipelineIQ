import * as fs from "node:fs";
import * as path from "node:path";
import { getWorkspaceRoot } from "./workspace.js";

/**
 * TestImpactAnalyzer (Predictive Test Selection - PTS)
 *
 * Automatically resolves the exact test files impacted by code changes
 * to execute targeted test verification in sub-10 seconds instead of running
 * the entire repository test suite (which takes 10–30+ minutes in large monorepos).
 */
export class TestImpactAnalyzer {
  /**
   * Resolve targeted test files in the workspace matching changed source files.
   */
  static findCorrespondingTests(root: string, changedFilePaths: string[]): string[] {
    const matchedTests = new Set<string>();

    for (const changedPath of changedFilePaths) {
      const normalized = changedPath.replace(/\\/g, "/");
      const ext = path.extname(normalized);
      const baseNameWithoutExt = path.basename(normalized, ext);
      const dirName = path.dirname(normalized);

      // If the changed file itself is already a test file, include it directly
      if (this.isTestFile(normalized)) {
        if (fs.existsSync(path.resolve(root, normalized))) {
          matchedTests.add(normalized);
        }
        continue;
      }

      // Candidate test locations relative to workspace root
      const candidates: string[] = [
        // 1. Sibling test file (e.g. src/math.test.ts, src/math.spec.ts)
        `${dirName}/${baseNameWithoutExt}.test${ext}`,
        `${dirName}/${baseNameWithoutExt}.spec${ext}`,
        `${dirName}/${baseNameWithoutExt}_test${ext}`,
        `${dirName}/test_${baseNameWithoutExt}${ext}`,

        // 2. Colocated __tests__ or tests folder (e.g. src/__tests__/math.test.ts)
        `${dirName}/__tests__/${baseNameWithoutExt}.test${ext}`,
        `${dirName}/__tests__/${baseNameWithoutExt}.spec${ext}`,
        `${dirName}/tests/${baseNameWithoutExt}.test${ext}`,

        // 3. Root tests/ / test/ directory mirrored structure (e.g. tests/src/math.test.ts, tests/math.test.ts)
        `tests/${normalized.replace(/^src\//, "")}`,
        `test/${normalized.replace(/^src\//, "")}`,
        `tests/${dirName.replace(/^src\//, "")}/${baseNameWithoutExt}.test${ext}`,
        `tests/${baseNameWithoutExt}.test${ext}`,
        `tests/test_${baseNameWithoutExt}${ext}`,
        `test/test_${baseNameWithoutExt}${ext}`,

        // 4. Python conventions (e.g. tests/test_calc.py, tests/unit/test_calc.py)
        `tests/test_${baseNameWithoutExt}.py`,
        `tests/unit/test_${baseNameWithoutExt}.py`,
        `test/test_${baseNameWithoutExt}.py`,

        // 5. Go conventions (e.g. pkg/api/handler_test.go)
        `${dirName}/${baseNameWithoutExt}_test.go`,

        // 6. Rust conventions (e.g. tests/test_parser.rs)
        `tests/test_${baseNameWithoutExt}.rs`,
        `tests/${baseNameWithoutExt}.rs`,

        // 7. PHP conventions (e.g. tests/Unit/MathTest.php)
        `tests/Unit/${baseNameWithoutExt}Test.php`,
        `tests/Feature/${baseNameWithoutExt}Test.php`,
      ];

      for (const candidate of candidates) {
        const fullPath = path.resolve(root, candidate);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          matchedTests.add(candidate.replace(/\\/g, "/"));
        }
      }
    }

    return Array.from(matchedTests);
  }

  /**
   * Determine if a given file path is a test file.
   */
  static isTestFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, "/").toLowerCase();
    return (
      normalized.includes(".test.") ||
      normalized.includes(".spec.") ||
      normalized.includes("_test.") ||
      normalized.includes("/__tests__/") ||
      normalized.includes("/tests/") ||
      normalized.includes("/test/") ||
      normalized.startsWith("tests/") ||
      normalized.startsWith("test/") ||
      path.basename(normalized).startsWith("test_")
    );
  }

  /**
   * Resolve the minimal, targeted verification command for the impacted test files.
   * Returns null if no targeted test files were found (falls back to ecosystem test runner).
   */
  static resolveTargetedVerificationCommand(
    root: string,
    changedFilePaths: string[]
  ): string | null {
    const testFiles = this.findCorrespondingTests(root, changedFilePaths);
    if (testFiles.length === 0) return null;

    const exists = (f: string) => fs.existsSync(path.resolve(root, f));

    // ── 1. Node / TypeScript / JavaScript ────────────────────────────────────
    if (exists("package.json")) {
      let pkg: any = {};
      try {
        pkg = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf-8"));
      } catch { /* ignore */ }

      const devDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      if (devDeps["vitest"]) {
        return `npx vitest run ${testFiles.join(" ")}`;
      }
      if (devDeps["jest"]) {
        return `npx jest ${testFiles.join(" ")}`;
      }
      if (devDeps["mocha"]) {
        return `npx mocha ${testFiles.join(" ")}`;
      }
      if (devDeps["ava"]) {
        return `npx ava ${testFiles.join(" ")}`;
      }

      // Default to npm test with arguments
      return `npm test -- ${testFiles.join(" ")}`;
    }

    // ── 2. Python ────────────────────────────────────────────────────────────
    if (
      exists("pyproject.toml") ||
      exists("setup.py") ||
      exists("requirements.txt") ||
      exists("Pipfile")
    ) {
      if (exists("poetry.lock")) {
        return `poetry run pytest ${testFiles.join(" ")}`;
      }
      if (exists("Pipfile.lock")) {
        return `pipenv run pytest ${testFiles.join(" ")}`;
      }
      return `pytest ${testFiles.join(" ")}`;
    }

    // ── 3. Rust ──────────────────────────────────────────────────────────────
    if (exists("Cargo.toml")) {
      const testNames = testFiles
        .map((t) => path.basename(t, ".rs").replace(/^test_/, ""))
        .filter(Boolean);
      if (testNames.length > 0) {
        return `cargo test ${testNames.join(" ")}`;
      }
      return `cargo test`;
    }

    // ── 4. Go ────────────────────────────────────────────────────────────────
    if (exists("go.mod")) {
      const dirs = [...new Set(testFiles.map((t) => path.dirname(t)))];
      return `go test ${dirs.map((d) => `./${d}/...`).join(" ")}`;
    }

    // ── 5. PHP ───────────────────────────────────────────────────────────────
    if (exists("composer.json")) {
      if (exists("vendor/bin/phpunit")) {
        return `./vendor/bin/phpunit ${testFiles.join(" ")}`;
      }
      return `composer test -- ${testFiles.join(" ")}`;
    }

    return null;
  }
}
