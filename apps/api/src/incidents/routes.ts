import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { createIncidentInput } from "./model.js";
import { createIncident, listIncidents } from "./repository.js";
import { withTransaction } from "../db/transaction.js";
import { writeAuditEvent } from "../audit/repository.js";

function organizationHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerIncidentRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/incidents", async (request) => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await listIncidents(database, context.organizationId) };
  });

  app.post("/v1/incidents", async (request, reply) => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:write", context.organizationId);
    const input = createIncidentInput.parse(request.body);

    const incident = await withTransaction(database, async client => {
      const result = await client.query(
        `INSERT INTO incidents
          (organization_id, title, summary, severity, status, source, detected_at)
         VALUES ($1, $2, $3, $4, 'open', $5, $6)
         RETURNING id, organization_id, title, summary, severity, status, source,
                   detected_at, created_at, updated_at`,
        [context.organizationId, input.title, input.summary, input.severity, input.source, input.detectedAt]
      );
      const row = result.rows[0];
      await writeAuditEvent(client, {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "incident.created",
        resourceType: "incident",
        resourceId: row.id,
        requestId: request.id
      });
      return {
        id: row.id, organizationId: row.organization_id, title: row.title, summary: row.summary,
        severity: row.severity, status: row.status, source: row.source,
        detectedAt: row.detected_at.toISOString(), createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
    });

    return reply.code(201).send({ data: incident });
  });
}
