import type { Database } from "../db/database.js";

export async function listNotifications(
  database: Database,
  organizationId: string,
  userId: string
) {
  const result = await database.query(
    `SELECT id, notification_type, title, body, resource_type, resource_id, read_at, created_at
       FROM notifications
      WHERE organization_id = $1 AND user_id = $2
      ORDER BY created_at DESC LIMIT 100`,
    [organizationId, userId]
  );
  return result.rows;
}

export async function markNotificationRead(
  database: Database,
  organizationId: string,
  userId: string,
  notificationId: string
): Promise<boolean> {
  const result = await database.query(
    `UPDATE notifications SET read_at = COALESCE(read_at, now())
      WHERE organization_id = $1 AND user_id = $2 AND id = $3
      RETURNING id`,
    [organizationId, userId, notificationId]
  );
  return Boolean(result.rowCount);
}
