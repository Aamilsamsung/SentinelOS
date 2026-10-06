import type { Database } from "../db/database.js";

export type BrowserIdentity = {
  userId: string;
  email: string;
  displayName: string;
  organizations: Array<{ id: string; name: string; slug: string; role: string }>;
};

export async function findBrowserIdentityByEmail(
  database: Database,
  email: string
): Promise<BrowserIdentity | null> {
  const normalized = email.trim().toLowerCase();
  const result = await database.query(
    `SELECT u.id AS user_id, u.email, u.display_name,
            o.id AS organization_id, o.name AS organization_name, o.slug, m.role
       FROM users u
       LEFT JOIN organization_memberships m ON m.user_id = u.id
       LEFT JOIN organizations o ON o.id = m.organization_id
      WHERE lower(u.email) = $1
      ORDER BY o.name ASC`,
    [normalized]
  );
  if (result.rows.length === 0) return null;
  const first = result.rows[0];
  return {
    userId: first.user_id,
    email: first.email,
    displayName: first.display_name,
    organizations: result.rows
      .filter((row) => row.organization_id)
      .map((row) => ({
        id: row.organization_id,
        name: row.organization_name,
        slug: row.slug,
        role: row.role
      }))
  };
}

export async function hasOrganizationMembership(
  database: Database,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const result = await database.query(
    `SELECT 1
       FROM organization_memberships
      WHERE user_id = $1 AND organization_id = $2
      LIMIT 1`,
    [userId, organizationId]
  );
  return result.rows.length === 1;
}
