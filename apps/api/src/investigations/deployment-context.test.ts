import { describe, expect, it } from "vitest";
import { buildDeploymentEvidence } from "./deployment-context.js";

describe("deployment investigation context", () => {
  it("emits explainable scored evidence for a failed deployment before an incident", () => {
    const items = buildDeploymentEvidence(new Date("2026-10-05T15:10:00Z"), [{
      id: "deploy-1",
      service: "payments",
      title: "GitHub deployment failure for payments",
      attributes: { state: "failure", environment: "production", sha: "abcdef1234567890" },
      occurred_at: new Date("2026-10-05T15:05:00Z"),
    }]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "deployment:deploy-1",
      kind: "deployment",
      source: "payments",
    });
    expect(items[0].confidence).toBeGreaterThanOrEqual(0.4);
    expect(items[0].summary).toContain("correlation");
    expect(items[0].summary).toContain("deployment preceded incident by 5 minutes");
  });

  it("excludes deployments that happen after the incident", () => {
    expect(buildDeploymentEvidence(new Date("2026-10-05T15:10:00Z"), [{
      id: "deploy-2",
      service: "payments",
      title: "later deployment",
      attributes: { state: "success" },
      occurred_at: new Date("2026-10-05T15:11:00Z"),
    }])).toEqual([]);
  });
});
