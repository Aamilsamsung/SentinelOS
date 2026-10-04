import { describe, expect, it } from "vitest";
import { detectZScoreAnomaly } from "./anomaly.js";

describe("metric anomaly detection", () => {
  it("flags a strong deviation from a stable baseline", () => {
    const result = detectZScoreAnomaly([99, 100, 101, 100, 99, 101, 100], 150);
    expect(result.anomalous).toBe(true);
    expect(result.zScore).toBeGreaterThan(3);
  });

  it("does not claim anomalies without enough evidence", () => {
    expect(detectZScoreAnomaly([1, 2, 3], 100).anomalous).toBe(false);
  });

  it("handles a zero-variance baseline", () => {
    expect(detectZScoreAnomaly([10,10,10,10,10], 10).anomalous).toBe(false);
    expect(detectZScoreAnomaly([10,10,10,10,10], 11).anomalous).toBe(true);
  });
});
