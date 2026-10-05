import type { PoolClient } from "pg";
import type { Finding } from "./findings.js";

export async function startInvestigation(
  client: PoolClient,
  organizationId: string,
  incidentId: string,
  userId: string
): Promise<string> {
  try {
    const result = await client.query(
      `INSERT INTO investigations (organization_id, incident_id, status, started_by, started_at)
       VALUES ($1, $2, 'queued', $3, NULL)
       RETURNING id`,
      [organizationId, incidentId, userId]
    );
    return result.rows[0].id;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw Object.assign(new Error("An investigation is already active for this incident"), {
        statusCode: 409,
        code: "INVESTIGATION_ALREADY_ACTIVE"
      });
    }
    throw error;
  }
}

export async function claimInvestigation(
  client: PoolClient,
  organizationId: string,
  investigationId: string
): Promise<string> {
  const result = await client.query(
    `UPDATE investigations
        SET status = 'running', started_at = now()
      WHERE organization_id = $1 AND id = $2 AND status = 'queued'
      RETURNING incident_id`,
    [organizationId, investigationId]
  );
  if (!result.rowCount) {
    throw Object.assign(new Error("Investigation is not runnable"), {
      statusCode: 409,
      code: "INVESTIGATION_NOT_RUNNABLE"
    });
  }
  return result.rows[0].incident_id as string;
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


export async function failInvestigation(
  client: PoolClient,
  organizationId: string,
  investigationId: string,
  reason: string
): Promise<void> {
  await client.query(
    `UPDATE investigations
        SET status = 'failed', completed_at = now(), failure_reason = $3
      WHERE organization_id = $1 AND id = $2 AND status = 'running'`,
    [organizationId, investigationId, reason.slice(0, 2000)]
  );
}
