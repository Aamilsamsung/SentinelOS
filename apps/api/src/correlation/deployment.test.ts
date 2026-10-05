import { describe, expect, it } from "vitest";
import { correlateDeploymentToIncident } from "./deployment.js";

describe("deployment incident correlation", () => {
  it("strongly correlates a failed same-service deployment shortly before an incident", () => {
    expect(correlateDeploymentToIncident(
      { service: "payments", detectedAt: "2026-10-05T15:10:00Z" },
      { id: "deploy-1", service: "payments", occurredAt: "2026-10-05T15:05:00Z", state: "failure" },
    )).toEqual({
      deploymentId: "deploy-1",
      score: 0.942,
      reason: "deployment preceded incident by 5 minutes, same service, deployment state failure",
    });
  });

  it("does not claim causality for a deployment after the incident", () => {
    expect(correlateDeploymentToIncident(
      { service: "payments", detectedAt: "2026-10-05T15:10:00Z" },
      { id: "deploy-2", service: "payments", occurredAt: "2026-10-05T15:11:00Z" },
    )).toBeNull();
  });

  it("does not correlate a distant unrelated deployment", () => {
    expect(correlateDeploymentToIncident(
      { service: "payments", detectedAt: "2026-10-05T15:40:00Z" },
      { id: "deploy-3", service: "search", occurredAt: "2026-10-05T15:00:00Z" },
    )).toBeNull();
  });
});
