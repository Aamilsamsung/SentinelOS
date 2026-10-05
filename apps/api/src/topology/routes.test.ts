import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

function fakeDatabase(role: "viewer" | "responder" = "responder") {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes("FROM sessions")) return { rows: [{
      session_id: "s1", user_id: "u1", role,
      expires_at: new Date("2099-01-01T00:00:00Z"), revoked_at: null
    }] };
    if (sql.includes("FROM services WHERE")) return { rows: [] };
    if (sql.includes("FROM service_dependencies")) return { rows: [] };
    if (sql.startsWith("INSERT INTO services")) return { rows: [{
      id: "11111111-1111-4111-8111-111111111111", name: params?.[1], description: params?.[2],
      owner_team: params?.[3], repository_url: params?.[4],
      created_at: new Date("2026-10-05T17:00:00Z"), updated_at: new Date("2026-10-05T17:00:00Z")
    }] };
    if (sql.startsWith("INSERT INTO service_dependencies")) return { rows: [{
      upstream_service_id: params?.[1], downstream_service_id: params?.[2],
      dependency_type: params?.[3], created_at: new Date("2026-10-05T17:00:00Z")
    }] };
    throw new Error(`unexpected query: ${sql} / ${JSON.stringify(params)}`);
  });
  return { query } as any;
}

const headers = { authorization: "Bearer secret", "x-organization-id": "org-a" };

describe("service topology HTTP API", () => {
  it("lists services within the authenticated organization", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({ method: "GET", url: "/v1/services", headers });
    expect(response.statusCode).toBe(200);
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).includes("FROM services WHERE"));
    expect(call?.[1]).toEqual(["org-a"]);
    await app.close();
  });

  it("creates a service in the authenticated organization", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/services",
      headers: { ...headers, "content-type": "application/json" },
      payload: { name: "payments", description: "Payment processing" }
    });
    expect(response.statusCode).toBe(201);
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO services"));
    expect(call?.[1]?.[0]).toBe("org-a");
    await app.close();
  });

  it("creates an organization-scoped dependency", async () => {
    const database = fakeDatabase();
    const app = await buildApp({ database });
    const response = await app.inject({
      method: "POST", url: "/v1/service-dependencies",
      headers: { ...headers, "content-type": "application/json" },
      payload: {
        upstreamServiceId: "11111111-1111-4111-8111-111111111111",
        downstreamServiceId: "22222222-2222-4222-8222-222222222222",
        dependencyType: "runtime"
      }
    });
    expect(response.statusCode).toBe(201);
    const call = database.query.mock.calls.find((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO service_dependencies"));
    expect(call?.[1]?.[0]).toBe("org-a");
    await app.close();
  });

  it("denies topology writes to viewers", async () => {
    const app = await buildApp({ database: fakeDatabase("viewer") });
    const response = await app.inject({
      method: "POST", url: "/v1/services",
      headers: { ...headers, "content-type": "application/json" },
      payload: { name: "payments" }
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("PERMISSION_DENIED");
    await app.close();
  });
});
