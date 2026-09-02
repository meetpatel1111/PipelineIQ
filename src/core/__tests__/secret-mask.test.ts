import { describe, it, expect } from "vitest";
import { maskSecrets } from "../secret-mask.js";

describe("Secret Masking Module (maskSecrets)", () => {
  it("masks AWS access keys", () => {
    const input = "Failed to upload artifact: AKIAIOSFODNN7EXAMPLE";
    const masked = maskSecrets(input);
    expect(masked).toBe("Failed to upload artifact: [REDACTED_AWS_KEY]");
  });

  it("masks GitHub personal access tokens and OAuth tokens", () => {
    expect(maskSecrets("token: ghp_1234567890123456789012345")).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(maskSecrets("oauth: gho_1234567890123456789012345")).toContain("[REDACTED_GITHUB_OAUTH]");
  });

  it("masks OpenAI, Anthropic, and HuggingFace API keys", () => {
    expect(maskSecrets("key: sk-123456789012345678901234")).toContain("[REDACTED_OPENAI_KEY]");
    expect(maskSecrets("key: sk-ant-api03-123456789012345678901234567890123456789012345678901234567890123456789012345678901234")).toContain("[REDACTED_ANTHROPIC_KEY]");
    expect(maskSecrets("token: hf_1234567890123456789012345678901234")).toContain("[REDACTED_HUGGINGFACE_TOKEN]");
  });

  it("masks GCP / Google AI API keys", () => {
    expect(maskSecrets("AIzaSyD-1234567890abcdef1234567890abcde")).toContain("[REDACTED_GCP_API_KEY]");
  });

  it("masks database connection strings with passwords", () => {
    const pg = "Connecting to postgres://admin:superSecretPassword123@db.prod.internal:5432/main";
    expect(maskSecrets(pg)).toBe("Connecting to postgres://admin:[REDACTED]@db.prod.internal:5432/main");

    const mongo = "mongodb+srv://user:pass123@cluster0.mongodb.net/test";
    expect(maskSecrets(mongo)).toBe("mongodb+srv://user:[REDACTED]@cluster0.mongodb.net/test");
  });

  it("masks Bearer and Basic auth headers", () => {
    expect(maskSecrets("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMC6Y9JaGQOThnuCQso5HyMW20fU")).toContain("Bearer [REDACTED]");
    expect(maskSecrets("Authorization: Basic dXNlcjpwYXNz")).toContain("Authorization: Basic [REDACTED]");
  });

  it("masks private keys", () => {
    const rsa = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----";
    expect(maskSecrets(rsa)).toContain("[REDACTED_PRIVATE_KEY]");
  });

  it("masks sensitive UUIDs in context while preserving standard run IDs (SEC-5)", () => {
    // Preserves non-sensitive run IDs and container GUIDs
    const runLog = "Pipeline run 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d finished with exit code 1";
    expect(maskSecrets(runLog)).toBe(runLog);

    // Masks UUIDs in secret contexts
    const secretLog = "api_key=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
    expect(maskSecrets(secretLog)).toContain("[REDACTED_UUID]");

    const tokenLog = "token: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
    expect(maskSecrets(tokenLog)).toContain("[REDACTED_UUID]");
  });
});
