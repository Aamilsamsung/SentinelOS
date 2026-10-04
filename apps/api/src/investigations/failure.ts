import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { writeAuditEvent } from "../audit/repository.js";
import { failInvestigation } from "./repository.js";

function safeFailure(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : "INVESTIGATION_FAILED";
  const allowed = new Set([
    "AI_NOT_CONFIGURED",
    "INSUFFICIENT_EVIDENCE",
    "INVESTIGATION_ALREADY_ACTIVE",
    "INVESTIGATION_NOT_RUNNABLE"
  ]);
  if (allowed.has(code)) return { code, message: code.replaceAll("_", " ").toLowerCase() };
  if (error instanceof Error && error.message === "Investigation analyzer timed out") {
    return { code: "ANALYZER_TIMEOUT", message: "investigation analyzer timed out" };
  }
  return { code: "INVESTIGATION_FAILED", message: "investigation processing failed" };
}

export async function recordInvestigationFailure(
  database: Database, organizationId: string, investigationId: string,
  actorUserId: string, incidentId: string, error: unknown
) {
  const failure = safeFailure(error);
  await withTransaction(database, async client => {
    await failInvestigation(client, organizationId, investigationId, failure.message);
    await writeAuditEvent(client, {
      organizationId, actorUserId, action: "investigation.failed",
      resourceType: "investigation", resourceId: investigationId,
      metadata: { incidentId, code: failure.code, reason: failure.message }
    });
  });
}
