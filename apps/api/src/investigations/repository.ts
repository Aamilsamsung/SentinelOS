import type { PoolClient } from "pg";
import type { Finding } from "./findings.js";

export async function startInvestigation(
  client: PoolClient,
  organizationId: string,
  incidentId: string,
  userId: string
): Promise<string> {
  const result = await client.query(
    `INSERT INTO investigations (organization_id, incident_id, status, started_by, started_at)
     VALUES ($1, $2, 'running', $3, now())
     RETURNING id`,
    [organizationId, incidentId, userId]
  );
  return result.rows[0].id;
}

export async function persistFindings(
  client: PoolClient,
  organizationId: string,
  investigationId: string,
  findings: Finding[]
): Promise<void> {
  for (const finding of findings) {
    await client.query(
      `INSERT INTO investigation_findings
        (organization_id, investigation_id, finding_type, title, detail, confidence, evidence_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [organizationId, investigationId, finding.type, finding.title, finding.detail,
       finding.confidence, JSON.stringify(finding.evidenceIds)]
    );
  }
}

export async function completeInvestigation(
  client: PoolClient,
  organizationId: string,
  investigationId: string
): Promise<void> {
  await client.query(
    `UPDATE investigations
        SET status = 'completed', completed_at = now()
      WHERE organization_id = $1 AND id = $2 AND status = 'running'`,
    [organizationId, investigationId]
  );
}
