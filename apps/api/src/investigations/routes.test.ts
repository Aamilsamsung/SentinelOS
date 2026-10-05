import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

function claimedDatabase() {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes("FROM sessions")) return { rowCount: 1, rows: [{
      session_id: "s1", user_id: "u1", role: "responder",
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] };
    if (sql.includes("SELECT 1 FROM investigations")) return { rowCount: 1, rows: [{ "?column?": 1 }] };
    if (sql.includes("SET status = 'running'")) return { rowCount: 0, rows: [] };
    if (sql === "BEGIN" || sql === "ROLLBACK" || sql === "COMMIT") return { rowCount: 0, rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });
  return {
    query,
    connect: vi.fn(async () => ({ query, release: vi.fn() }))
  } as any;
}

describe("protected investigation HTTP API", () => {
  it("rejects a second run after another worker has claimed the investigation", async () => {
    const database = claimedDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST",
      url: "/v1/investigations/inv-1/run",
      headers: {
        authorization: "Bearer secret",
        "x-organization-id": "org-a"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("INVESTIGATION_NOT_RUNNABLE");
    expect(database.query.mock.calls.some(([sql]: [string]) => sql.includes("investigation_findings"))).toBe(false);
    await app.close();
  });
});
