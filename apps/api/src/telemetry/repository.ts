import type { Database } from "../db/database.js";
import type { z } from "zod";
import type { logInput, metricInput } from "./model.js";

export async function createLog(database: Database, organizationId: string, input: z.infer<typeof logInput>) {
  const result = await database.query(
    `INSERT INTO log_entries (organization_id, service, level, message, trace_id, attributes, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, service, level, message, trace_id, attributes, occurred_at, received_at`,
    [organizationId, input.service, input.level, input.message, input.traceId ?? null, input.attributes, input.occurredAt]
  );
  return result.rows[0];
}

export async function listLogs(database: Database, organizationId: string, limit = 100) {
  const result = await database.query(
    `SELECT id, service, level, message, trace_id, attributes, occurred_at, received_at
     FROM log_entries WHERE organization_id=$1 ORDER BY occurred_at DESC LIMIT $2`,
    [organizationId, Math.min(Math.max(limit, 1), 500)]
  );
  return result.rows;
}

export async function createMetric(database: Database, organizationId: string, input: z.infer<typeof metricInput>) {
  const result = await database.query(
    `INSERT INTO metric_points (organization_id, service, metric_name, value, unit, dimensions, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, service, metric_name, value, unit, dimensions, occurred_at, received_at`,
    [organizationId, input.service, input.metricName, input.value, input.unit ?? null, input.dimensions, input.occurredAt]
  );
  return result.rows[0];
}

export async function listMetrics(database: Database, organizationId: string, limit = 100) {
  const result = await database.query(
    `SELECT id, service, metric_name, value, unit, dimensions, occurred_at, received_at
     FROM metric_points WHERE organization_id=$1 ORDER BY occurred_at DESC LIMIT $2`,
    [organizationId, Math.min(Math.max(limit, 1), 500)]
  );
  return result.rows;
}
