import { describe, expect, it } from "vitest";
import { transitionAction } from "./state-machine.js";

describe("remediation action state machine", () => {
  it("allows the guarded happy path", () => {
    expect(transitionAction("requested", "approve")).toBe("approved");
    expect(transitionAction("approved", "execute")).toBe("executing");
    expect(transitionAction("executing", "succeed")).toBe("succeeded");
  });

  it("supports explicit rejection and execution failure", () => {
    expect(transitionAction("requested", "reject")).toBe("rejected");
    expect(transitionAction("executing", "fail")).toBe("failed");
  });

  it("prevents execution before approval and terminal-state mutation", () => {
    expect(() => transitionAction("requested", "execute")).toThrow("Invalid action transition");
    expect(() => transitionAction("succeeded", "execute")).toThrow("Invalid action transition");
  });
});
