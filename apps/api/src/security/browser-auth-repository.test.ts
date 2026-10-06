import { describe, expect, it } from "vitest";
import { findBrowserIdentityByEmail } from "./browser-auth-repository.js";

describe("browser auth identity repository", () => {
  it("normalizes email and returns only memberships joined to the user", async () => {
    let values: unknown[] = [];
    const database = {
      query: async (_sql: string, params?: unknown[]) => {
        values = params ?? [];
        return { rows: [
          { user_id: "user-1", email: "user@example.test", display_name: "User", organization_id: "org-1", organization_name: "Acme", slug: "acme", role: "admin" },
          { user_id: "user-1", email: "user@example.test", display_name: "User", organization_id: "org-2", organization_name: "Beta", slug: "beta", role: "viewer" }
        ] };
      }
    } as never;
    const identity = await findBrowserIdentityByEmail(database, " USER@EXAMPLE.TEST ");
    expect(values).toEqual(["user@example.test"]);
    expect(identity?.organizations).toHaveLength(2);
    expect(identity?.organizations[0]).toMatchObject({ id: "org-1", role: "admin" });
  });

  it("does not fabricate an identity for an unknown email", async () => {
    const database = { query: async () => ({ rows: [] }) } as never;
    await expect(findBrowserIdentityByEmail(database, "missing@example.test")).resolves.toBeNull();
  });
});
