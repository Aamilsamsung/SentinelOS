import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

describe("browser auth start route", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns organization choices but never a session token from email alone", async () => {
    const database = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("FROM users u")) return { rows: [{
          user_id: "user-1", email: "user@example.test", display_name: "User",
          organization_id: "org-1", organization_name: "Acme", slug: "acme", role: "admin"
        }] };
        return { rows: [] };
      })
    } as never;
    const app = await buildApp({ database });
    const response = await app.inject({ method: "POST", url: "/v1/browser-auth/start", payload: { email: "user@example.test" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { challengeRequired: true, organizations: [{ id: "org-1", name: "Acme", slug: "acme" }] } });
    expect(response.body).not.toContain("sessionToken");
    await app.close();
  });

  it("uses a generic authentication failure for unknown accounts", async () => {
    const database = { query: vi.fn(async () => ({ rows: [] })) } as never;
    const app = await buildApp({ database });
    const response = await app.inject({ method: "POST", url: "/v1/browser-auth/start", payload: { email: "missing@example.test" } });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("AUTHENTICATION_FAILED");
    await app.close();
  });
});
