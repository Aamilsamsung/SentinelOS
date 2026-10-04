import { afterEach, describe, expect, it } from "vitest";
import { decryptCredential, encryptCredential } from "./credentials.js";
import { integrationInput } from "./model.js";

const originalKey = process.env.ENCRYPTION_KEY;
afterEach(() => {
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});

describe("integration credentials", () => {
  it("encrypts credentials with authenticated encryption", () => {
    process.env.ENCRYPTION_KEY = "test-key-material-that-is-long-enough-123456";
    const encrypted = encryptCredential("github-token");
    expect(encrypted).not.toContain("github-token");
    expect(decryptCredential(encrypted)).toBe("github-token");
  });

  it("fails closed without a configured encryption key", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptCredential("secret")).toThrow("not configured");
  });

  it("rejects secret-looking values in ordinary configuration", () => {
    expect(() => integrationInput.parse({
      provider: "github", name: "production", configuration: { apiToken: "do-not-store-here" }
    })).toThrow("credential endpoint");
  });
});
