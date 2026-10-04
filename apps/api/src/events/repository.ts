import type { Database } from "../db/database.js";
import type { IngestEventInput } from "./model.js";

export async function ingestEvent(database: Database, organizationId: string, input: IngestEventInput) {
  const result = await database.query(
    `INSERT INTO observability_events
      (organization_id, external_id, event_type, source, service, severity, title, attributes, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
     ON CONFLICT (organization_id, source, external_id)
       WHERE external_id IS NOT NULL
     DO NOTHING
     RETURNING id, received_at`,
    [
      organizationId, input.externalId ?? null, input.type, input.source, input.service ?? null,
      input.severity, input.title, JSON.stringify(input.attributes), input.occurredAt
    ]
  );
  return result.rows[0] ?? null;
}
