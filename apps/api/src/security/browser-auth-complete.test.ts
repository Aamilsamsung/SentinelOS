import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { signBrowserProof } from "./browser-proof.js";

describe("browser auth completion", () => {
  afterEach(() => { delete process.env.BROWSER_AUTH_PROOF_SECRET; vi.restoreAllMocks(); });

  it("issues cookies only for a verified proof with selected tenant membership", async () => {
    const secret = "ci-browser-proof-secret-at-least-32-bytes";
    process.env.BROWSER_AUTH_PROOF_SECRET = secret;
    const database = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("FROM organization_memberships")) return { rows: [{ "?column?": 1 }], rowCount: 1 };
        if (sql.includes("INSERT INTO sessions")) return { rows: [{ id: "session-1", expires_at: new Date("2026-10-07T00:00:00Z") }], rowCount: 1 };
        return { rows: [] };
      })
    } as never;
    const app = await buildApp({ database });
    const proof = signBrowserProof({ userId: "bbbbbbbb-2222-4222-8222-222222222222", email: "user@example.test", exp: Date.now() + 60_000 }, secret);
    const response = await app.inject({ method: "POST", url: "/v1/browser-auth/complete", payload: { proof, organizationId: "aaaaaaaa-1111-4111-8111-111111111111" } });
    expect(response.statusCode).toBe(200);
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(String(cookies)).toContain("sentinelos_session=");
    expect(String(cookies)).toContain("sentinelos_organization=");
    expect(String(cookies)).toContain("sentinelos_csrf=");
    expect(response.body).not.toContain("sessionToken");
    await app.close();
  });

  it("rejects a valid proof when the user is not a member of the selected tenant", async () => {
    const secret = "ci-browser-proof-secret-at-least-32-bytes";
    process.env.BROWSER_AUTH_PROOF_SECRET = secret;
    const database = { query: vi.fn(async () => ({ rows: [], rowCount: 0 })) } as never;
    const app = await buildApp({ database });
    const proof = signBrowserProof({ userId: "bbbbbbbb-2222-4222-8222-222222222222", email: "user@example.test", exp: Date.now() + 60_000 }, secret);
    const response = await app.inject({ method: "POST", url: "/v1/browser-auth/complete", payload: { proof, organizationId: "aaaaaaaa-1111-4111-8111-111111111111" } });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
