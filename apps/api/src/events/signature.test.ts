import { describe, expect, it } from "vitest";
import { assertFreshTimestamp, signWebhook, verifyWebhookSignature } from "./signature.js";

describe("webhook signatures", () => {
  it("verifies an HMAC signature bound to timestamp and body", () => {
    const body = '{"event":"down"}';
    const signature = signWebhook("secret", "1000", body);
    expect(verifyWebhookSignature("secret", "1000", body, signature)).toBe(true);
    expect(verifyWebhookSignature("secret", "1000", body + "x", signature)).toBe(false);
  });

  it("rejects stale timestamps to limit replay attacks", () => {
    expect(() => assertFreshTimestamp("1000", 1000, 300000)).not.toThrow();
    expect(() => assertFreshTimestamp("1000", 400001, 300000)).toThrow("outside allowed window");
  });
});
