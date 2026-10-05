import { describe, expect, it } from "vitest";
import { normalizeGitHubWebhook } from "./github.js";

describe("GitHub integration evidence", () => {
  it("normalizes deployment status failures as critical evidence", () => {
    const event = normalizeGitHubWebhook("deployment_status", {
      repository: { full_name: "acme/payments" },
      deployment: {
        id: 41,
        sha: "abc123",
        environment: "production",
        created_at: "2026-10-05T15:00:00Z",
      },
      deployment_status: {
        id: 42,
        state: "failure",
        environment: "production",
        created_at: "2026-10-05T15:01:00Z",
      },
    });

    expect(event).toMatchObject({
      externalId: "github:deployment-status:42",
      type: "deployment.status",
      source: "github",
      service: "acme/payments",
      severity: "critical",
      attributes: {
        repository: "acme/payments",
        deploymentId: "41",
        sha: "abc123",
        environment: "production",
        state: "failure",
      },
    });
  });

  it("rejects unsupported webhook events instead of fabricating evidence", () => {
    expect(normalizeGitHubWebhook("issues", {
      repository: { full_name: "acme/payments" },
    })).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(normalizeGitHubWebhook("deployment", { deployment: { id: 1 } })).toBeNull();
  });
});
