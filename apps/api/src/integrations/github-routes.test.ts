import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { encryptCredential } from "./credentials.js";

const secret = "organization-specific-webhook-secret";
function signature(body: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function database(insertRows: unknown[] = [{ id: "event-1", received_at: new Date() }]) {
  const ciphertext = encryptCredential(secret);
  return { query: vi.fn(async (sql: string) => {
    if (sql.includes("FROM integrations")) return { rows: [{ credential_ciphertext: ciphertext }] };
    if (sql.startsWith("INSERT INTO observability_events")) return { rows: insertRows };
    throw new Error(`unexpected query: ${sql}`);
  }) } as any;
}

describe("signed GitHub webhook HTTP route", () => {
  afterEach(() => delete process.env.ENCRYPTION_KEY);

  it("accepts a correctly signed deployment and persists it for the route organization", async () => {
    process.env.ENCRYPTION_KEY = "test-key-that-is-long-enough-for-credential-encryption";
    const db = database();
    const app = await buildApp({ database: db });
    const body = JSON.stringify({
      repository: { full_name: "acme/payments" },
      deployment: { id: 41, sha: "abc123", environment: "production", created_at: "2026-10-05T15:00:00Z" },
      deployment_status: { id: 42, state: "failure", environment: "production", created_at: "2026-10-05T15:01:00Z" }
    });
    const response = await app.inject({
      method: "POST", url: "/v1/webhooks/github/org-a",
      headers: { "content-type": "application/json", "x-github-event": "deployment_status", "x-github-delivery": "delivery-1", "x-hub-signature-256": signature(body) },
      payload: body
    });
    expect(response.statusCode).toBe(202);
    const insert = db.query.mock.calls.find((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO observability_events"));
    expect(insert?.[1]?.[0]).toBe("org-a");
    expect(insert?.[1]?.[1]).toContain("delivery:delivery-1");
    await app.close();
  });

  it("rejects a modified payload before event persistence", async () => {
    process.env.ENCRYPTION_KEY = "test-key-that-is-long-enough-for-credential-encryption";
    const db = database();
    const app = await buildApp({ database: db });
    const original = JSON.stringify({ repository: { full_name: "acme/payments" } });
    const response = await app.inject({
      method: "POST", url: "/v1/webhooks/github/org-a",
      headers: { "content-type": "application/json", "x-github-event": "deployment_status", "x-github-delivery": "delivery-2", "x-hub-signature-256": signature(original) },
      payload: JSON.stringify({ repository: { full_name: "evil/modified" } })
    });
    expect(response.statusCode).toBe(401);
    expect(db.query.mock.calls.some((entry: unknown[]) => String(entry[0]).startsWith("INSERT INTO observability_events"))).toBe(false);
    await app.close();
  });

  it("reports a repeated delivery as a duplicate", async () => {
    process.env.ENCRYPTION_KEY = "test-key-that-is-long-enough-for-credential-encryption";
    const db = database([]);
    const app = await buildApp({ database: db });
    const body = JSON.stringify({
      repository: { full_name: "acme/payments" },
      deployment: { id: 41, sha: "abc123", environment: "production", created_at: "2026-10-05T15:00:00Z" },
      deployment_status: { id: 42, state: "success", environment: "production", created_at: "2026-10-05T15:01:00Z" }
    });
    const response = await app.inject({
      method: "POST", url: "/v1/webhooks/github/org-a",
      headers: { "content-type": "application/json", "x-github-event": "deployment_status", "x-github-delivery": "delivery-repeat", "x-hub-signature-256": signature(body) },
      payload: body
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ accepted: true, duplicate: true });
    await app.close();
  });
});
