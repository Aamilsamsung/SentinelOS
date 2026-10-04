import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { writeAuditEvent } from "../audit/repository.js";
import { failInvestigation } from "./repository.js";

export async function recordInvestigationFailure(
  database: Database, organizationId: string, investigationId: string,
  actorUserId: string, incidentId: string, error: unknown
) {
  const message = error instanceof Error ? error.message : "Unknown investigation failure";
  await withTransaction(database, async client => {
    await failInvestigation(client, organizationId, investigationId, message);
    await writeAuditEvent(client, {
      organizationId, actorUserId, action: "investigation.failed",
      resourceType: "investigation", resourceId: investigationId,
      metadata: { incidentId, reason: message.slice(0, 500) }
    });
  });
}
