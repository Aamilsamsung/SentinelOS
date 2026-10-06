import type { Database } from "../db/database.js";
import { createBrowserSessionMaterial } from "./browser-session.js";

export async function createBrowserSession(
  database: Database,
  userId: string,
  ttlHours = 8
) {
  const material = createBrowserSessionMaterial();
  const result = await database.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 * interval '1 hour'))
     RETURNING id, expires_at`,
    [userId, material.sessionHash, ttlHours]
  );
  return {
    sessionId: result.rows[0].id as string,
    expiresAt: result.rows[0].expires_at as Date,
    sessionToken: material.sessionToken,
    csrfToken: material.csrfToken
  };
}

export async function revokeBrowserSession(
  database: Database,
  sessionId: string,
  userId: string
): Promise<boolean> {
  const result = await database.query(
    `UPDATE sessions
        SET revoked_at = now()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
      RETURNING id`,
    [sessionId, userId]
  );
  return result.rowCount === 1;
}
