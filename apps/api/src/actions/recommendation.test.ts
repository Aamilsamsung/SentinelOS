import { describe, expect, it } from "vitest";
import { recommendationsFromFindings } from "./recommendation.js";

describe("investigation recommendation handoff", () => {
  it("marks every remediation recommendation as approval-required", () => {
    const result = recommendationsFromFindings([{
      type: "recommendation",
      title: "Rollback release",
      detail: "Rollback is suggested based on correlated deployment evidence.",
      confidence: 0.81,
      evidenceIds: ["deploy-1"]
    }]);
    expect(result).toEqual([expect.objectContaining({ requiresApproval: true })]);
  });

  it("does not convert hypotheses directly into actions", () => {
    expect(recommendationsFromFindings([{
      type: "hypothesis", title: "Possible cause", detail: "Investigate further",
      confidence: 0.6, evidenceIds: ["log-1"]
    }])).toEqual([]);
  });
});
