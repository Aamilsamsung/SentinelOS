import type { Database } from "../db/database.js";

export async function listActivity(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT id, actor_user_id, action, resource_type, resource_id, request_id, metadata, created_at
       FROM audit_events
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
    [organizationId]
  );
  return result.rows;
}
