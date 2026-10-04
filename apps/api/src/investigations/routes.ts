import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { writeAuditEvent } from "../audit/repository.js";
import { startInvestigation } from "./repository.js";
import { listOrganizationInvestigations } from "./list.js";

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerInvestigationRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/investigations", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await listOrganizationInvestigations(database, context.organizationId) };
  });
  app.post("/v1/incidents/:incidentId/investigations", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "investigation:run", context.organizationId);
    const incidentId = (request.params as { incidentId: string }).incidentId;

    const investigationId = await withTransaction(database, async client => {
      const incident = await client.query(
        "SELECT id FROM incidents WHERE organization_id = $1 AND id = $2",
        [context.organizationId, incidentId]
      );
      if (!incident.rowCount) {
        throw Object.assign(new Error("Incident not found"), {
          statusCode: 404, code: "INCIDENT_NOT_FOUND"
        });
      }

      const id = await startInvestigation(client, context.organizationId, incidentId, context.userId);
      await writeAuditEvent(client, {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "investigation.started",
        resourceType: "investigation",
        resourceId: id,
        requestId: request.id,
        metadata: { incidentId }
      });
      return id;
    });

    return reply.code(202).send({
      data: { id: investigationId, incidentId, status: "running" }
    });
  });

  app.get("/v1/incidents/:incidentId/investigations", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    const incidentId = (request.params as { incidentId: string }).incidentId;
    const result = await database.query(
      `SELECT id, incident_id, status, conclusion, created_at, started_at, completed_at
         FROM investigations
        WHERE organization_id = $1 AND incident_id = $2
        ORDER BY created_at DESC LIMIT 100`,
      [context.organizationId, incidentId]
    );
    return reply.send({ data: result.rows });
  });
}
