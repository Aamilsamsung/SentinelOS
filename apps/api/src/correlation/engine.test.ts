import { describe, expect, it } from "vitest";
import { correlateSignals } from "./engine.js";

describe("evidence correlation", () => {
  const anchor = {
    id: "e1", type: "event" as const, service: "checkout",
    occurredAt: "2026-10-04T17:00:00.000Z", severity: "critical" as const
  };

  it("ranks same-service nearby evidence highly", () => {
    const result = correlateSignals(anchor, [{
      id: "m1", type: "metric_anomaly", service: "checkout",
      occurredAt: "2026-10-04T17:01:00.000Z", severity: "critical"
    }]);
    expect(result[0].score).toBeGreaterThan(0.8);
    expect(result[0].reason).toContain("same service");
  });

  it("includes dependency-related evidence but ignores unrelated distant noise", () => {
    const result = correlateSignals(anchor, [
      { id: "l1", type: "log", service: "payments", occurredAt: "2026-10-04T17:02:00.000Z", severity: "warning" },
      { id: "l2", type: "log", service: "search", occurredAt: "2026-10-04T18:00:00.000Z", severity: "critical" }
    ], new Set(["payments"]));
    expect(result.map(x => x.evidenceId)).toEqual(["l1"]);
    expect(result[0].reason).toContain("dependency-related service");
  });

  it("returns no claims when timestamps are invalid", () => {
    expect(correlateSignals({ ...anchor, occurredAt: "invalid" }, [])).toEqual([]);
  });
});
