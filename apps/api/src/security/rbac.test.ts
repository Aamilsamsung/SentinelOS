import { describe, expect, it } from "vitest";
import { assertSameOrganization, can } from "./rbac.js";

describe("RBAC", () => {
  it("keeps viewers read-only", () => {
    expect(can("viewer", "incident:read")).toBe(true);
    expect(can("viewer", "incident:write")).toBe(false);
    expect(can("viewer", "action:approve")).toBe(false);
  });

  it("does not let responders approve dangerous actions", () => {
    expect(can("responder", "action:request")).toBe(true);
    expect(can("responder", "action:approve")).toBe(false);
  });

  it("rejects cross-organization resource access", () => {
    expect(() => assertSameOrganization("org-a", "org-b")).toThrow("Cross-organization access denied");
  });

  it("allows resources from the actor organization", () => {
    expect(() => assertSameOrganization("org-a", "org-a")).not.toThrow();
  });
});


it("separates remediation requests from execution", () => {
  expect(can("responder", "action:request")).toBe(true);
  expect(can("responder", "action:execute")).toBe(false);
  expect(can("admin", "action:execute")).toBe(true);
  expect(can("owner", "action:execute")).toBe(true);
});
