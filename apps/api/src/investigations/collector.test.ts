import { describe, expect, it } from "vitest";
import { collectIncidentEvidence } from "./collector.js";
import type { Database } from "../db/database.js";

describe("investigation evidence collector", () => {
  it("includes nearby GitHub deployment evidence with commit context", async () => {
    const detectedAt = new Date("2026-10-05T15:10:00Z");
    const deploymentAt = new Date("2026-10-05T15:05:00Z");
    let call = 0;
    const database = {
      async query() {
        call += 1;
        if (call === 1) return { rowCount: 1, rows: [{ id: "incident-1", detected_at: detectedAt }] };
        if (call === 2) return { rowCount: 0, rows: [] };
        if (call === 3) return { rowCount: 0, rows: [] };
        if (call === 4) return { rowCount: 0, rows: [] };
        return {
          rowCount: 1,
          rows: [{
            id: "deployment-1",
            event_type: "deployment.status",
            service: "acme/payments",
            severity: "critical",
            title: "GitHub deployment failure for acme/payments",
            attributes: { sha: "abcdef1234567890", environment: "production", state: "failure" },
            occurred_at: deploymentAt,
          }],
        };
      },
    } as unknown as Database;

    const bundle = await collectIncidentEvidence(database, "org-1", "incident-1");

    expect(bundle?.items).toContainEqual(expect.objectContaining({
      id: "deployment:deployment-1",
      kind: "deployment",
      observedAt: deploymentAt.toISOString(),
      source: "acme/payments",
    }));
    const deployment = bundle?.items.find(item => item.kind === "deployment");
    expect(deployment?.confidence).toBeGreaterThanOrEqual(0.4);
    expect(deployment?.confidence).toBeLessThanOrEqual(1);
    expect(deployment?.summary).toContain("failure, production, commit abcdef123456");
    expect(deployment?.summary).toContain("deployment preceded incident by 5 minutes");
  });
});
