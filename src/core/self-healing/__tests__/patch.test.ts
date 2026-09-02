import { describe, it, expect } from "vitest";
import { applyPatch } from "../patch.js";

describe("applyPatch (Safe Fuzzy Patch Matching)", () => {
  it("matches exact substrings (Strategy 1)", () => {
    const original = `const x = 1;\nconst y = 2;\n`;
    const snippet = `const y = 2;`;
    const replacement = `const y = 20;`;

    const patched = applyPatch(original, snippet, replacement, "src/math.ts");
    expect(patched).toBe(`const x = 1;\nconst y = 20;\n`);
  });

  it("matches line-by-line trimmed lines with different indentation (Strategy 2)", () => {
    const original = `function calc() {\n    const x = 1;\n    return x;\n}`;
    // AI provided 2 spaces instead of 4
    const snippet = `function calc() {\n  const x = 1;\n  return x;\n}`;
    const replacement = `function calc() {\n    const x = 42;\n    return x;\n}`;

    const patched = applyPatch(original, snippet, replacement, "src/math.ts");
    expect(patched).toContain("const x = 42;");
  });

  it("matches whitespace-collapsed snippets (Strategy 3 & 4)", () => {
    const original = `const result = compute(   a,   b,   c   );`;
    const snippet = `const result = compute( a, b, c );`;
    const replacement = `const result = compute( a, b, c, true );`;

    const patched = applyPatch(original, snippet, replacement, "src/math.ts");
    expect(patched).toContain("compute( a, b, c, true )");
  });

  it("throws clear error when snippet is completely hallucinated instead of corrupting file", () => {
    const original = `const x = 1;\nconst y = 2;\n`;
    const hallucinated = `function somethingFake() {}`;
    const replacement = `export function added() { return x + y; }`;

    expect(() => applyPatch(original, hallucinated, replacement, "src/math.ts")).toThrow(
      /Patch application failed in src\/math\.ts/
    );
  });

  it("preserves UTF-8 Byte Order Mark (BOM) when patching Windows/Visual Studio files", () => {
    const originalWithBOM = `\uFEFFusing System;\n\nnamespace App {\n    public class Program {\n        public static void Main() {\n            Console.WriteLine("Hello");\n        }\n    }\n}`;
    const originalSnippet = `Console.WriteLine("Hello");`;
    const newSnippet = `Console.WriteLine("Hello World");`;

    const patched = applyPatch(originalWithBOM, originalSnippet, newSnippet, "Program.cs");

    expect(patched.startsWith("\uFEFF")).toBe(true);
    expect(patched).toContain(`Console.WriteLine("Hello World");`);
    expect(patched).not.toContain(`Console.WriteLine("Hello");`);
  });
});
