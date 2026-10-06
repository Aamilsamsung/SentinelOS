import { describe, expect, it } from "vitest";
import { createBrowserSession, revokeBrowserSession } from "./browser-session-repository.js";

describe("browser session repository", () => {
  it("persists only the session hash and returns the opaque token", async () => {
    let values: unknown[] = [];
    const database = {
      query: async (_sql: string, params?: unknown[]) => {
        values = params ?? [];
        return { rows: [{ id: "session-1", expires_at: new Date("2026-10-07T00:00:00Z") }], rowCount: 1 };
      }
    } as never;

    const session = await createBrowserSession(database, "user-1");
    expect(values[0]).toBe("user-1");
    expect(values[1]).toMatch(/^[a-f0-9]{64}$/);
    expect(values[1]).not.toBe(session.sessionToken);
    expect(session.csrfToken).not.toBe(session.sessionToken);
  });

  it("revokes only the requested user's active session", async () => {
    let values: unknown[] = [];
    const database = {
      query: async (_sql: string, params?: unknown[]) => {
        values = params ?? [];
        return { rows: [{ id: "session-1" }], rowCount: 1 };
      }
    } as never;

    await expect(revokeBrowserSession(database, "session-1", "user-1")).resolves.toBe(true);
    expect(values).toEqual(["session-1", "user-1"]);
  });
});
