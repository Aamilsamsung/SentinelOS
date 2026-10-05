import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

function fakeDatabase(role: "viewer" | "responder" = "responder") {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes("FROM sessions")) return { rows: [{
      session_id: "s1", user_id: "u1", role,
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] };
    if (sql.includes("FROM log_entries")) return { rows: [] };
    if (sql.includes("FROM metric_points")) return { rows: [] };
    if (sql.startsWith("INSERT INTO log_entries")) return { rows: [{
      id: "log-1", service: params?.[1], level: params?.[2], message: params?.[3],
      trace_id: params?.[4], attributes: params?.[5], occurred_at: new Date(String(params?.[6])),
      received_at: new Date("2026-10-05T17:00:01Z")
    }] };
    if (sql.startsWith("INSERT INTO metric_points")) return { rows: [{
      id: "1", service: params?.[1], metric_name: params?.[2], value: params?.[3],
      unit: params?.[4], dimensions: params?.[5], occurred_at: new Date(String(params?.[6])),
      received_at: new Date("2026-10-05T17:00:01Z")
    }] };
    throw new Error(`unexpected query: ${sql} / ${JSON.stringify(params)}`);
  });
  return { query } as any;
}

const headers = { authorization: "Bearer secret", "x-organization-id": "org-a" };

describe("telemetry HTTP API", () => {
  it("lists logs only through authenticated organization context", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({ method: "GET", url: "/v1/telemetry/logs?limit=25", headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [] });
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).includes("FROM log_entries"));
    expect(call?.[1]).toEqual(["org-a", 25]);
    await app.close();
  });

  it("accepts a valid log for a responder", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/telemetry/logs",
      headers: { ...headers, "content-type": "application/json" },
      payload: { service: "checkout", level: "error", message: "database timeout", occurredAt: "2026-10-05T17:00:00.000Z" }
    });
    expect(response.statusCode).toBe(201);
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO log_entries"));
    expect(call?.[1]?.[0]).toBe("org-a");
    await app.close();
  });

  it("accepts a valid metric for a responder", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/telemetry/metrics",
      headers: { ...headers, "content-type": "application/json" },
      payload: { service: "checkout", metricName: "latency_ms", value: 920, unit: "ms", occurredAt: "2026-10-05T17:00:00.000Z" }
    });
    expect(response.statusCode).toBe(201);
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO metric_points"));
    expect(call?.[1]?.[0]).toBe("org-a");
    expect(call?.[1]?.[2]).toBe("latency_ms");
    await app.close();
  });

  it("denies telemetry writes to viewers", async () => {
    const app = await buildApp({ database: fakeDatabase("viewer") });
    const response = await app.inject({
      method: "POST", url: "/v1/telemetry/metrics",
      headers: { ...headers, "content-type": "application/json" },
      payload: { service: "checkout", metricName: "latency_ms", value: 920, occurredAt: "2026-10-05T17:00:00.000Z" }
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("PERMISSION_DENIED");
    await app.close();
  });
});
