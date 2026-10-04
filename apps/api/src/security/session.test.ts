import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken, isSessionActive, tokenHashMatches } from "./session.js";

describe("session security", () => {
  it("creates opaque tokens and stores/verifies only hashes", () => {
    const token = createOpaqueToken();
    const hash = hashToken(token);
    expect(token).not.toBe(hash);
    expect(tokenHashMatches(token, hash)).toBe(true);
    expect(tokenHashMatches(token + "x", hash)).toBe(false);
  });

  it("rejects expired or revoked sessions", () => {
    const now = new Date("2026-10-04T16:00:00.000Z");
    expect(isSessionActive(new Date("2026-10-04T17:00:00.000Z"), null, now)).toBe(true);
    expect(isSessionActive(new Date("2026-10-04T15:00:00.000Z"), null, now)).toBe(false);
    expect(isSessionActive(new Date("2026-10-04T17:00:00.000Z"), now, now)).toBe(false);
  });
});
