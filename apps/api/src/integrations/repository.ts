import type { Database } from "../db/database.js";
import type { IntegrationInput } from "./model.js";

export async function upsertIntegration(
  database: Database,
  organizationId: string,
  userId: string,
  input: IntegrationInput
) {
  const result = await database.query(
    `INSERT INTO integrations
      (organization_id, provider, name, configuration, created_by)
     VALUES ($1,$2,$3,$4::jsonb,$5)
     ON CONFLICT (organization_id, provider, name) DO UPDATE
       SET configuration = EXCLUDED.configuration, updated_at = now()
     RETURNING id, provider, name, status, configuration, last_checked_at, last_error, created_at, updated_at`,
    [organizationId, input.provider, input.name, JSON.stringify(input.configuration), userId]
  );
  return result.rows[0];
}

export async function listIntegrations(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT id, provider, name, status, configuration, last_checked_at, last_error, created_at, updated_at
       FROM integrations
      WHERE organization_id = $1
      ORDER BY provider, name`,
    [organizationId]
  );
  return result.rows;
}
