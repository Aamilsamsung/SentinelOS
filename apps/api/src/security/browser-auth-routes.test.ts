import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";

describe("browser auth start route", () => {
  it("does not reveal whether an email belongs to an account", async () => {
    const query = vi.fn();
    const app = await buildApp({ database: { query } as never });
    const known = await app.inject({ method: "POST", url: "/v1/browser-auth/start", payload: { email: "user@example.test" } });
    const unknown = await app.inject({ method: "POST", url: "/v1/browser-auth/start", payload: { email: "missing@example.test" } });
    expect(known.statusCode).toBe(200);
    expect(unknown.statusCode).toBe(200);
    expect(known.json()).toEqual(unknown.json());
    expect(known.json()).toEqual({ data: { challengeRequired: true, challengeDispatched: false } });
    expect(known.body).not.toContain("organizations");
    expect(known.body).not.toContain("sessionToken");
    expect(query).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects malformed email input", async () => {
    const app = await buildApp({ database: { query: vi.fn() } as never });
    const response = await app.inject({ method: "POST", url: "/v1/browser-auth/start", payload: { email: "invalid" } });
    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
