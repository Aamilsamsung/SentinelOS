import { describe, expect, it } from "vitest";
import { isExecutableActionType, validateExecutableAction } from "./catalog.js";

describe("remediation action catalog", () => {
  it("allows only explicitly registered executable action types", () => {
    expect(isExecutableActionType("restart_service")).toBe(true);
    expect(isExecutableActionType("ai_recommendation")).toBe(false);
    expect(() => validateExecutableAction("ai_recommendation", {})).toThrow("not approved");
  });

  it("validates parameters for executable actions", () => {
    expect(validateExecutableAction("restart_service", { serviceId: "3fdd30df-9938-4b50-a09f-c482e46d2292" }))
      .toEqual({ serviceId: "3fdd30df-9938-4b50-a09f-c482e46d2292" });
    expect(() => validateExecutableAction("restart_service", { serviceId: "not-a-uuid" })).toThrow();
  });
});
