import { describe, expect, it } from "vitest";
import { authorize, type AuthContext } from "./context.js";

const viewer: AuthContext = {
  userId: "u1",
  organizationId: "org-a",
  role: "viewer",
  sessionId: "s1"
};

describe("request authorization context", () => {
  it("allows granted permissions inside the active organization", () => {
    expect(() => authorize(viewer, "incident:read", "org-a")).not.toThrow();
  });

  it("denies missing permissions", () => {
    expect(() => authorize(viewer, "incident:write", "org-a")).toThrow("Permission denied");
  });

  it("checks tenant boundary before permission grants", () => {
    expect(() => authorize(viewer, "incident:read", "org-b")).toThrow("Cross-organization access denied");
  });
});
