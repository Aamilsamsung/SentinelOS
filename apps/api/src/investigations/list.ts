import type { Database } from "../db/database.js";

export async function listOrganizationInvestigations(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT i.id, i.incident_id, i.status, i.conclusion, i.started_at, i.completed_at, i.created_at,
            inc.title AS incident_title, inc.severity AS incident_severity
       FROM investigations i
       JOIN incidents inc ON inc.organization_id = i.organization_id AND inc.id = i.incident_id
      WHERE i.organization_id = $1
      ORDER BY i.created_at DESC
      LIMIT 100`,
    [organizationId]
  );
  return result.rows;
}
