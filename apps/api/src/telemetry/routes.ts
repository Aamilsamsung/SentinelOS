import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { logInput, metricInput } from "./model.js";
import { createLog, createMetric, listLogs, listMetrics } from "./repository.js";

function organizationHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function limitValue(value: unknown) {
  const parsed = Number(value ?? 100);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;
}

export async function registerTelemetryRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/telemetry/logs", async request => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    const query = request.query as { limit?: string };
    return { data: await listLogs(database, context.organizationId, limitValue(query.limit)) };
  });

  app.post("/v1/telemetry/logs", async (request, reply) => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:write", context.organizationId);
    const data = await createLog(database, context.organizationId, logInput.parse(request.body));
    return reply.code(201).send({ data });
  });

  app.get("/v1/telemetry/metrics", async request => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    const query = request.query as { limit?: string };
    return { data: await listMetrics(database, context.organizationId, limitValue(query.limit)) };
  });

  app.post("/v1/telemetry/metrics", async (request, reply) => {
    const organizationId = organizationHeader(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:write", context.organizationId);
    const data = await createMetric(database, context.organizationId, metricInput.parse(request.body));
    return reply.code(201).send({ data });
  });
}
