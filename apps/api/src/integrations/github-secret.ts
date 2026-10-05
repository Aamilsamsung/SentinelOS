import type { Database } from "../db/database.js";
import { decryptCredential } from "./credentials.js";

export async function resolveGitHubWebhookSecret(database: Database, organizationId: string): Promise<string | null> {
  const result = await database.query(
    `SELECT credential_ciphertext
     FROM integrations
     WHERE organization_id=$1 AND provider='github' AND status IN ('configured','degraded')
       AND credential_ciphertext IS NOT NULL
     ORDER BY updated_at DESC
     LIMIT 1`,
    [organizationId]
  );
  const ciphertext = result.rows[0]?.credential_ciphertext;
  if (!ciphertext) return null;
  return decryptCredential(ciphertext);
}
