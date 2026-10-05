import type { Database } from "../db/database.js";
import { buildEvidenceBundle, type EvidenceItem } from "./evidence.js";
import { buildDeploymentEvidence } from "./deployment-context.js";

const MAX_EVIDENCE_ITEMS = 300;
const MAX_SUMMARY_CHARS = 2000;
const MAX_TOTAL_CHARS = 120000;

function boundedSummary(value: string) {
  return value.length <= MAX_SUMMARY_CHARS ? value : `${value.slice(0, MAX_SUMMARY_CHARS)}…`;
}

function boundEvidence(items: EvidenceItem[]) {
  const bounded: EvidenceItem[] = [];
  let totalChars = 0;
  for (const item of items) {
    if (bounded.length >= MAX_EVIDENCE_ITEMS) break;
    const summary = boundedSummary(item.summary);
    if (totalChars + summary.length > MAX_TOTAL_CHARS) break;
    totalChars += summary.length;
    bounded.push({ ...item, summary });
  }
  return bounded;
}

export async function collectIncidentEvidence(database: Database, organizationId: string, incidentId: string) {
  const incidentResult = await database.query(
    `SELECT id, detected_at FROM incidents WHERE organization_id = $1 AND id = $2`,
    [organizationId, incidentId]
  );
  if (!incidentResult.rowCount) return null;
  const detectedAt = incidentResult.rows[0].detected_at as Date;
  const from = new Date(detectedAt.getTime() - 30 * 60_000);
  const to = new Date(detectedAt.getTime() + 30 * 60_000);

  const [events, logs, metrics, deployments] = await Promise.all([
    database.query(
      `SELECT id, event_type, source, payload, occurred_at FROM incident_events
        WHERE organization_id=$1 AND incident_id=$2 ORDER BY occurred_at ASC LIMIT 200`,
      [organizationId, incidentId]),
    database.query(
      `SELECT id, service, level, message, occurred_at FROM log_entries
        WHERE organization_id=$1 AND occurred_at BETWEEN $2 AND $3
        ORDER BY occurred_at ASC LIMIT 200`,
      [organizationId, from, to]),
    database.query(
      `SELECT id, service, metric_name, value, unit, occurred_at FROM metric_points
        WHERE organization_id=$1 AND occurred_at BETWEEN $2 AND $3
        ORDER BY occurred_at ASC LIMIT 200`,
      [organizationId, from, to]),
    database.query(
      `SELECT id, event_type, service, severity, title, attributes, occurred_at FROM observability_events
        WHERE organization_id=$1
          AND source='github'
          AND event_type IN ('deployment.created','deployment.status')
          AND occurred_at BETWEEN $2 AND $3
        ORDER BY occurred_at ASC LIMIT 100`,
      [organizationId, from, to])
  ]);

  const items: EvidenceItem[] = [
    ...events.rows.map(row => ({
      id: `event:${row.id}`, kind: "event" as const, observedAt: row.occurred_at.toISOString(),
      summary: boundedSummary(`${row.event_type} from ${row.source}`), source: row.source, confidence: 1
    })),
    ...logs.rows.map(row => ({
      id: `log:${row.id}`, kind: "log" as const, observedAt: row.occurred_at.toISOString(),
      summary: boundedSummary(`[${row.level}] ${row.service}: ${row.message}`), source: row.service, confidence: 1
    })),
    ...metrics.rows.map(row => ({
      id: `metric:${row.id}`, kind: "metric" as const, observedAt: row.occurred_at.toISOString(),
      summary: boundedSummary(`${row.service} ${row.metric_name}=${row.value}${row.unit ? ` ${row.unit}` : ""}`),
      source: row.service, confidence: 1
    })),
    ...buildDeploymentEvidence(detectedAt, deployments.rows).map(item => ({
      ...item,
      summary: boundedSummary(item.summary),
    }))
  ];
  return buildEvidenceBundle(incidentId, boundEvidence(items));
}
