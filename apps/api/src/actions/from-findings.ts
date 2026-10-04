import type { PoolClient } from "pg";
import type { Finding } from "../investigations/findings.js";
import { recommendationsFromFindings } from "./recommendation.js";

export async function createRecommendedActions(
  client: PoolClient,
  organizationId: string,
  incidentId: string,
  requestedBy: string,
  findings: Finding[]
): Promise<string[]> {
  const recommendations = recommendationsFromFindings(findings);
  const ids: string[] = [];
  for (const recommendation of recommendations) {
    const result = await client.query(
      `INSERT INTO remediation_actions
        (organization_id, incident_id, action_type, rationale, parameters, status, requested_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,'requested',$6)
       RETURNING id`,
      [organizationId, incidentId, "ai_recommendation", recommendation.rationale,
       JSON.stringify({ title: recommendation.title, confidence: recommendation.confidence, evidenceIds: recommendation.evidenceIds }),
       requestedBy]
    );
    ids.push(result.rows[0].id);
  }
  return ids;
}
