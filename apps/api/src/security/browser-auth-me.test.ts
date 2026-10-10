import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { hashToken } from "./session.js";

describe("browser auth session status", () => {
  it("rejects requests without browser session cookies", async () => {
    const query = vi.fn();
    const app = await buildApp({ database: { query } as never });
    const response = await app.inject({ method: "GET", url: "/v1/browser-auth/me" });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("INVALID_SESSION");
    expect(query).not.toHaveBeenCalled();
    await app.close();
  });

  it("returns the current identity only after session validation", async () => {
    const organizationId = "aaaaaaaa-1111-4111-8111-111111111111";
    const database = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes("FROM sessions s")) {
          expect(params?.[0]).toBe(hashToken("token"));
          return { rows: [{ session_id: "session-1", user_id: "user-1", expires_at: new Date(Date.now() + 60_000), revoked_at: null, role: "admin" }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      })
    } as never;
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "GET", url: "/v1/browser-auth/me",
      headers: { cookie: `sentinelos_session=token; sentinelos_organization=${organizationId}` }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { authenticated: true, organizationId, userId: "user-1" } });
    await app.close();
  });
});
