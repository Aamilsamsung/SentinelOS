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


it("does not allow success before verification passes", () => {
  expect(() => authorizeActionTransition(
    { userId: "responder-1", role: "responder" },
    { requestedBy: "requester", status: "executing", verificationStatus: "inconclusive" },
    "succeed"
  )).toThrow("verification passes");

  expect(authorizeActionTransition(
    { userId: "responder-1", role: "responder" },
    { requestedBy: "requester", status: "executing", verificationStatus: "passed" },
    "succeed"
  )).toBe("succeeded");
});
