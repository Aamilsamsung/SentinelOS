import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { hashToken } from "../security/session.js";

function fakeDatabase(role: "viewer" | "responder" = "responder") {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes("FROM sessions")) return { rows: [{
      session_id: "s1", user_id: "u1", role,
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] };
    if (sql.includes("FROM incidents")) return { rows: [] };
    if (sql === "SELECT 1") return { rows: [{ "?column?": 1 }] };
    throw new Error(`unexpected query: ${sql} / ${JSON.stringify(params)}`);
  });
  return { query } as any;
}

describe("protected incident HTTP API", () => {
  it("requires authentication and organization context", async () => {
    const app = await buildApp({ database: fakeDatabase() });
    const response = await app.inject({ method: "GET", url: "/v1/incidents" });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("ORGANIZATION_REQUIRED");
    await app.close();
  });

  it("lists incidents for an authenticated organization member", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "GET",
      url: "/v1/incidents",
      headers: { authorization: "Bearer secret", "x-organization-id": "org-a" }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [] });
    expect(database.query.mock.calls[0][1][0]).toBe(hashToken("secret"));
    expect(database.query.mock.calls[1][1]).toEqual(["org-a"]);
    await app.close();
  });

  it("denies incident creation to a viewer", async () => {
    const app = await buildApp({ database: fakeDatabase("viewer") });
    const response = await app.inject({
      method: "POST",
      url: "/v1/incidents",
      headers: {
        authorization: "Bearer secret",
        "x-organization-id": "org-a",
        "content-type": "application/json"
      },
      payload: {
        title: "Elevated checkout errors",
        severity: "critical",
        source: "webhook",
        detectedAt: "2026-10-04T16:00:00.000Z"
      }
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("PERMISSION_DENIED");
    await app.close();
  });
});
