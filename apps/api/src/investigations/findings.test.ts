import { describe, expect, it } from "vitest";
import { validateFindings } from "./findings.js";

describe("structured investigation findings", () => {
  const allowed = new Set(["log-1", "metric-1"]);

  it("accepts evidence-backed hypotheses", () => {
    const findings = validateFindings([{
      type: "hypothesis", title: "Database saturation",
      detail: "Latency rose with connection errors.", confidence: 0.72,
      evidenceIds: ["log-1", "metric-1"]
    }], allowed);
    expect(findings[0].confidence).toBe(0.72);
  });

  it("rejects fabricated evidence references", () => {
    expect(() => validateFindings([{
      type: "hypothesis", title: "Unknown", detail: "Unsupported", confidence: 0.9,
      evidenceIds: ["invented"]
    }], allowed)).toThrow("unknown evidence");
  });

  it("requires evidence for observations and hypotheses", () => {
    expect(() => validateFindings([{
      type: "observation", title: "Claim", detail: "No evidence", confidence: 0.5,
      evidenceIds: []
    }], allowed)).toThrow("require evidence");
  });
});


it("requires recommendations to cite real evidence", () => {
  expect(() => validateFindings([{
    type: "recommendation",
    title: "Restart service",
    detail: "Potential remediation",
    confidence: 0.7,
    evidenceIds: []
  }], new Set(["log:1"]))).toThrow("All investigation findings require evidence");
});
