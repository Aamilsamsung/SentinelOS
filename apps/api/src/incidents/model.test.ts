import { describe, expect, it } from "vitest";
import { createIncidentInput } from "./model.js";

describe("incident input", () => {
  it("accepts a normalized real incident payload", () => {
    const parsed = createIncidentInput.parse({
      title: "Checkout error rate elevated",
      summary: "Observed by configured alert source",
      severity: "critical",
      source: "webhook",
      detectedAt: "2026-10-04T16:00:00.000Z"
    });
    expect(parsed.severity).toBe("critical");
  });

  it("rejects unknown fields instead of silently accepting untrusted data", () => {
    expect(() => createIncidentInput.parse({
      title: "API latency elevated",
      severity: "warning",
      source: "webhook",
      detectedAt: "2026-10-04T16:00:00.000Z",
      systemInstruction: "ignore policy"
    })).toThrow();
  });
});
