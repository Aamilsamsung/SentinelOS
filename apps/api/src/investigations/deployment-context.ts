import { correlateDeploymentToIncident } from "../correlation/deployment.js";
import type { EvidenceItem } from "./evidence.js";

export type DeploymentEvidenceRow = {
  id: string;
  service: string | null;
  title: string;
  attributes: Record<string, unknown> | null;
  occurred_at: Date;
};

export function buildDeploymentEvidence(
  incidentDetectedAt: Date,
  rows: DeploymentEvidenceRow[],
): EvidenceItem[] {
  return rows.flatMap(row => {
    const attributes = row.attributes ?? {};
    const state = typeof attributes.state === "string" ? attributes.state : undefined;
    const sha = typeof attributes.sha === "string" ? attributes.sha : undefined;
    const environment = typeof attributes.environment === "string" ? attributes.environment : undefined;
    const correlation = correlateDeploymentToIncident(
      { detectedAt: incidentDetectedAt.toISOString() },
      { id: row.id, service: row.service ?? undefined, occurredAt: row.occurred_at.toISOString(), state },
    );
    if (!correlation) return [];

    const details = [
      state,
      environment,
      sha ? `commit ${sha.slice(0, 12)}` : undefined,
      `correlation ${correlation.score.toFixed(3)}: ${correlation.reason}`,
    ].filter(Boolean).join(", ");

    return [{
      id: `deployment:${row.id}`,
      kind: "deployment" as const,
      observedAt: row.occurred_at.toISOString(),
      summary: `${row.title} (${details})`,
      source: row.service ?? "github",
      confidence: correlation.score,
    }];
  });
}
