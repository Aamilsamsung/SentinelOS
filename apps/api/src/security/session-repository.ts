import type { Database } from "../db/database.js";
import type { AuthContext } from "./context.js";
import { hashToken, isSessionActive } from "./session.js";

export async function resolveSession(
  database: Database,
  token: string,
  organizationId: string
): Promise<AuthContext | null> {
  const result = await database.query(
    `SELECT s.id AS session_id, s.user_id, s.expires_at, s.revoked_at, m.role
       FROM sessions s
       JOIN organization_memberships m ON m.user_id = s.user_id
      WHERE s.token_hash = $1
        AND m.organization_id = $2
      LIMIT 1`,
    [hashToken(token), organizationId]
  );

  const row = result.rows[0];
  if (!row || !isSessionActive(row.expires_at, row.revoked_at)) return null;

  return {
    userId: row.user_id,
    organizationId,
    role: row.role,
    sessionId: row.session_id
  };
}
