import { describe, expect, it } from "vitest";
import { matchSignature } from "../src/signatures.js";

describe("matchSignature", () => {
  it("identifies terraform state lock", () => {
    const m = matchSignature("Error acquiring the state lock\nLock Info: ID: 8d7a6");
    expect(m?.category).toBe("Infrastructure");
    expect(m?.id).toBe("terraform-state-lock");
  });

  it("identifies k8s image pull failures", () => {
    const m = matchSignature("Failed to pull image: ImagePullBackOff");
    expect(m?.category).toBe("Deployment");
  });

  it("identifies test failures via JUnit-style output", () => {
    const m = matchSignature("Tests run: 42, Failures: 3, Errors: 0");
    expect(m?.category).toBe("Test");
  });

  it("identifies npm peer dep conflicts", () => {
    const m = matchSignature("ERESOLVE could not resolve dependency tree");
    expect(m?.category).toBe("Dependency");
  });

  it("returns null on unrecognized logs", () => {
    expect(matchSignature("some unrelated chatter")).toBeNull();
  });
});
