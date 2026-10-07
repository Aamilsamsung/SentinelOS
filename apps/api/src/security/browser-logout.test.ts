import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { hashToken } from "./session.js";

describe("browser logout", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects state-changing logout without matching CSRF proof", async () => {
    const database = { query: vi.fn() } as never;
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/browser-auth/logout",
      headers: { cookie: "sentinelos_session=token; sentinelos_organization=org; sentinelos_csrf=csrf-a", "x-csrf-token": "csrf-b" }
    });
    expect(response.statusCode).toBe(403);
    expect(database.query).not.toHaveBeenCalled();
    await app.close();
  });

  it("revokes a valid session and expires browser cookies", async () => {
    const database = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes("FROM sessions s")) {
          expect(params?.[0]).toBe(hashToken("token"));
          return { rows: [{ session_id: "session-1", user_id: "user-1", expires_at: new Date(Date.now() + 60_000), revoked_at: null, role: "admin" }], rowCount: 1 };
        }
        if (sql.includes("UPDATE sessions")) return { rows: [{ id: "session-1" }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      })
    } as never;
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/browser-auth/logout",
      headers: { cookie: "sentinelos_session=token; sentinelos_organization=aaaaaaaa-1111-4111-8111-111111111111; sentinelos_csrf=csrf-a", "x-csrf-token": "csrf-a" }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { authenticated: false } });
    expect(String(response.headers["set-cookie"])).toContain("Max-Age=0");
    await app.close();
  });
});
