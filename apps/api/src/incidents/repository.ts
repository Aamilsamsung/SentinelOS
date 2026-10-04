import type { Database } from "../db/database.js";
import type { CreateIncidentInput, Incident } from "./model.js";

export async function createIncident(
  database: Database,
  organizationId: string,
  input: CreateIncidentInput
): Promise<Incident> {
  const result = await database.query(
    `INSERT INTO incidents
      (organization_id, title, summary, severity, status, source, detected_at)
     VALUES ($1, $2, $3, $4, 'open', $5, $6)
     RETURNING id, organization_id, title, summary, severity, status, source,
               detected_at, created_at, updated_at`,
    [organizationId, input.title, input.summary, input.severity, input.source, input.detectedAt]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    summary: row.summary,
    severity: row.severity,
    status: row.status,
    source: row.source,
    detectedAt: row.detected_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function listIncidents(database: Database, organizationId: string): Promise<Incident[]> {
  const result = await database.query(
    `SELECT id, organization_id, title, summary, severity, status, source,
            detected_at, created_at, updated_at
       FROM incidents
      WHERE organization_id = $1
      ORDER BY detected_at DESC
      LIMIT 100`,
    [organizationId]
  );
  return result.rows.map(row => ({
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    summary: row.summary,
    severity: row.severity,
    status: row.status,
    source: row.source,
    detectedAt: row.detected_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }));
}
