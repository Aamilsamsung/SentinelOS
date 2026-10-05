import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

function existingInvestigationDatabase() {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes("FROM sessions")) return { rowCount: 1, rows: [{
      session_id: "s1", user_id: "11111111-1111-4111-8111-111111111111", role: "responder",
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] };
    if (sql.includes("SELECT 1 FROM investigations")) return { rowCount: 1, rows: [{ "?column?": 1 }] };
    throw new Error(`unexpected query: ${sql}`);
  });
  return { query, connect: vi.fn() } as any;
}

describe("protected investigation HTTP API", () => {
  it("enqueues work and returns 202 without claiming the investigation in the request", async () => {
    const database = existingInvestigationDatabase();
    const enqueueInvestigation = vi.fn().mockResolvedValue({
      jobId: "22222222-2222-4222-8222-222222222222"
    });
    const app = await buildApp({ database, enqueueInvestigation });
    const response = await app.inject({
      method: "POST",
      url: "/v1/investigations/33333333-3333-4333-8333-333333333333/run",
      headers: { authorization: "Bearer secret", "x-organization-id": "org-a" }
    });

    expect(response.statusCode).toBe(202);
    expect(enqueueInvestigation).toHaveBeenCalledWith({
      organizationId: "org-a",
      investigationId: "33333333-3333-4333-8333-333333333333",
      requestedByUserId: "11111111-1111-4111-8111-111111111111"
    });
    expect(database.query.mock.calls.some(([sql]: [string]) => sql.includes("SET status = 'running'"))).toBe(false);
    expect(response.json().data.status).toBe("queued");
    await app.close();
  });

  it("fails closed when the queue is not configured", async () => {
    const app = await buildApp({ database: existingInvestigationDatabase() });
    const response = await app.inject({
      method: "POST",
      url: "/v1/investigations/33333333-3333-4333-8333-333333333333/run",
      headers: { authorization: "Bearer secret", "x-organization-id": "org-a" }
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe("QUEUE_NOT_CONFIGURED");
    await app.close();
  });
});
