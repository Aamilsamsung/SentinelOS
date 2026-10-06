import { describe, expect, it } from "vitest";
import { signBrowserProof, verifyBrowserProof } from "./browser-proof.js";

describe("browser identity proof", () => {
  const secret = "test-proof-secret-at-least-32-bytes-long";

  it("accepts a valid unexpired signed proof", () => {
    const now = Date.parse("2026-10-06T15:00:00Z");
    const token = signBrowserProof({ userId: "user-1", email: "user@example.test", exp: now + 60_000 }, secret);
    expect(verifyBrowserProof(token, secret, now)).toMatchObject({ userId: "user-1", email: "user@example.test" });
  });

  it("rejects tampering and expiry", () => {
    const now = Date.parse("2026-10-06T15:00:00Z");
    const token = signBrowserProof({ userId: "user-1", email: "user@example.test", exp: now + 1_000 }, secret);
    expect(verifyBrowserProof(token + "x", secret, now)).toBeNull();
    expect(verifyBrowserProof(token, secret, now + 2_000)).toBeNull();
  });

  it("rejects a proof signed by another issuer secret", () => {
    const now = Date.parse("2026-10-06T15:00:00Z");
    const token = signBrowserProof({ userId: "user-1", email: "user@example.test", exp: now + 60_000 }, secret);
    expect(verifyBrowserProof(token, "different-secret-different-issuer", now)).toBeNull();
  });
});
