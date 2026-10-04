import type { Database } from "../db/database.js";

export async function listOrganizationActions(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT a.id, a.incident_id, a.action_type, a.rationale, a.status, a.requested_by,
            a.approved_by, a.requested_at, a.approved_at, a.executed_at,
            a.verification_status, a.verification_detail, inc.title AS incident_title
       FROM remediation_actions a
       JOIN incidents inc ON inc.organization_id = a.organization_id AND inc.id = a.incident_id
      WHERE a.organization_id = $1
      ORDER BY a.requested_at DESC
      LIMIT 100`,
    [organizationId]
  );
  return result.rows;
}
