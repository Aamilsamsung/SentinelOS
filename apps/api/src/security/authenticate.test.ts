import { describe, expect, it, vi } from "vitest";
import { authenticateRequest } from "./authenticate.js";
import { hashToken } from "./session.js";

describe("database-backed authentication", () => {
  it("resolves a valid session into organization role context", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{
      session_id: "s1", user_id: "u1", role: "admin",
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] });
    const database = { query } as any;
    const context = await authenticateRequest(database, "Bearer secret-token", "org-a");
    expect(context).toEqual({ userId: "u1", organizationId: "org-a", role: "admin", sessionId: "s1" });
    expect(query.mock.calls[0][1][0]).toBe(hashToken("secret-token"));
    expect(query.mock.calls[0][1][1]).toBe("org-a");
  });

  it("fails closed when organization context is absent", async () => {
    await expect(authenticateRequest({} as any, "Bearer token", undefined))
      .rejects.toThrow("Organization context required");
  });

  it("rejects unknown, expired, or revoked sessions", async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) } as any;
    await expect(authenticateRequest(database, "Bearer bad-token", "org-a"))
      .rejects.toThrow("Invalid or expired session");
  });
});
