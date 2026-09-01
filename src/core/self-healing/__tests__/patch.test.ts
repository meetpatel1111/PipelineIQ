import { describe, it, expect } from "vitest";
import { applyPatch } from "../patch.js";

describe("applyPatch", () => {
  it("should append snippet when original snippet cannot be found (Strategy 4 fallback)", () => {
    const originalFileContent = `const x = 1;\nconst y = 2;\n`;
    // An AI hallucinated or empty snippet that doesn't match anywhere precisely
    const aiOriginalSnippet = `function somethingFake() {}`;
    const aiNewSnippet = `export function added() { return x + y; }`;

    const patched = applyPatch(originalFileContent, aiOriginalSnippet, aiNewSnippet, "src/math.ts");

    expect(patched).toContain("const x = 1;");
    expect(patched).toContain("const y = 2;");
    expect(patched).toContain("export function added() { return x + y; }");
    // Ensure it was appended
    expect(patched.trim().endsWith("export function added() { return x + y; }")).toBe(true);
  });

  it("should append correctly even if file doesn't have trailing newline", () => {
    const originalFileContent = `const x = 1;`;
    const aiOriginalSnippet = `something`;
    const aiNewSnippet = `const y = 2;`;

    const patched = applyPatch(originalFileContent, aiOriginalSnippet, aiNewSnippet, "src/math.ts");

    expect(patched).toBe(`const x = 1;\nconst y = 2;`);
  });

  it("should preserve UTF-8 Byte Order Mark (BOM) when patching Windows/Visual Studio files", () => {
    const originalWithBOM = `\uFEFFusing System;\n\nnamespace App {\n    public class Program {\n        public static void Main() {\n            Console.WriteLine("Hello");\n        }\n    }\n}`;
    const originalSnippet = `Console.WriteLine("Hello");`;
    const newSnippet = `Console.WriteLine("Hello World");`;

    const patched = applyPatch(originalWithBOM, originalSnippet, newSnippet, "Program.cs");

    expect(patched.startsWith("\uFEFF")).toBe(true);
    expect(patched).toContain(`Console.WriteLine("Hello World");`);
    expect(patched).not.toContain(`Console.WriteLine("Hello");`);
  });
});
