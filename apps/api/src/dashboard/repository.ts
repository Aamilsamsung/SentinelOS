import type { Database } from "../db/database.js";

export async function getCommandCenterSummary(database: Database, organizationId: string) {
  const [incidents, investigations, actions, integrations] = await Promise.all([
    database.query(
      `SELECT count(*)::int AS count FROM incidents
        WHERE organization_id = $1 AND status <> 'resolved'`, [organizationId]),
    database.query(
      `SELECT count(*)::int AS count FROM investigations
        WHERE organization_id = $1 AND status IN ('queued','running')`, [organizationId]),
    database.query(
      `SELECT count(*)::int AS count FROM remediation_actions
        WHERE organization_id = $1 AND status = 'requested'`, [organizationId]),
    database.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status IN ('degraded','error'))::int AS unhealthy
         FROM integrations WHERE organization_id = $1`, [organizationId])
  ]);
  return {
    openIncidents: incidents.rows[0].count,
    activeInvestigations: investigations.rows[0].count,
    pendingApprovals: actions.rows[0].count,
    integrations: {
      total: integrations.rows[0].total,
      unhealthy: integrations.rows[0].unhealthy
    }
  };
}
