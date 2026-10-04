import { describe, expect, it } from "vitest";
import { mayApproveAction, mayRequestAction } from "./policy.js";

const request = {
  requestedBy: "user-requester",
  organizationId: "org-a",
  actionType: "restart-service"
};

describe("remediation approval policy", () => {
  it("allows responders to request but not approve actions", () => {
    expect(mayRequestAction("responder")).toBe(true);
    expect(mayApproveAction("responder", "user-2", request)).toBe(false);
  });

  it("requires separation between requester and approver", () => {
    expect(mayApproveAction("admin", "user-requester", request)).toBe(false);
    expect(mayApproveAction("admin", "user-approver", request)).toBe(true);
  });
});
