import { describe, expect, it } from "vitest";
import { maskSecrets } from "../src/secret-mask.js";

describe("maskSecrets", () => {
  it("redacts GitHub personal access tokens", () => {
    const out = maskSecrets("token=ghp_abcdef1234567890ABCDEF1234567890ABCD");
    expect(out).not.toContain("ghp_abcdef");
    expect(out).toContain("[REDACTED");
  });

  it("redacts AWS access keys", () => {
    const out = maskSecrets("AKIAIOSFODNN7EXAMPLE in log");
    expect(out).toContain("[REDACTED_AWS_KEY]");
  });

  it("redacts bearer tokens", () => {
    const out = maskSecrets("Authorization: Bearer abcdef1234567890XYZ.token");
    expect(out).toContain("Bearer [REDACTED]");
  });

  it("redacts password=value patterns", () => {
    const out = maskSecrets('password="hunter2supersecret"');
    expect(out).toContain("[REDACTED]");
  });

  it("preserves non-sensitive text", () => {
    const input = "Build completed in 42s. 0 errors.";
    expect(maskSecrets(input)).toBe(input);
  });
});
