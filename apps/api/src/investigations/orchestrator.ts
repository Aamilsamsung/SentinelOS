import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { writeAuditEvent } from "../audit/repository.js";
import { collectIncidentEvidence } from "./collector.js";
import { validateFindings } from "./findings.js";
import { completeInvestigation, persistFindings } from "./repository.js";
import type { InvestigationAnalyzer } from "./analyzer.js";

export async function runInvestigation(
  database: Database,
  analyzer: InvestigationAnalyzer | null,
  organizationId: string,
  investigationId: string,
  incidentId: string,
  actorUserId: string
) {
  if (!analyzer) throw Object.assign(new Error("Investigation AI is not configured"), { statusCode: 503, code: "AI_NOT_CONFIGURED" });
  const bundle = await collectIncidentEvidence(database, organizationId, incidentId);
  if (!bundle || bundle.items.length === 0) {
    throw Object.assign(new Error("No evidence is available for this incident"), { statusCode: 422, code: "INSUFFICIENT_EVIDENCE" });
  }

  const raw = await analyzer.analyze(bundle);
  const allowed = new Set(bundle.items.map(item => item.id));
  const findings = validateFindings(raw, allowed);

  await withTransaction(database, async client => {
    await persistFindings(client, organizationId, investigationId, findings);
    await completeInvestigation(client, organizationId, investigationId);
    await writeAuditEvent(client, {
      organizationId,
      actorUserId,
      action: "investigation.completed",
      resourceType: "investigation",
      resourceId: investigationId,
      metadata: { incidentId, findingCount: findings.length, evidenceCount: bundle.items.length }
    });
  });
  return { findings, evidenceCount: bundle.items.length };
}
