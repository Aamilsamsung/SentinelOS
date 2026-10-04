import { describe, expect, it } from "vitest";
import { authorizeActionTransition } from "./guard.js";

describe("remediation transition authorization", () => {
  it("prevents requester self-approval", () => {
    expect(() => authorizeActionTransition(
      { userId: "u1", role: "admin" },
      { requestedBy: "u1", status: "requested" },
      "approve"
    )).toThrow("different authorized user");
  });

  it("allows a different admin to approve", () => {
    expect(authorizeActionTransition(
      { userId: "u2", role: "admin" },
      { requestedBy: "u1", status: "requested" },
      "approve"
    )).toBe("approved");
  });
});
