import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { createDependencyInput, createServiceInput } from "./model.js";
import { createDependency, createService, listDependencies, listServices } from "./repository.js";

function organizationHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerTopologyRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/services", async request => {
    const context = await authenticateRequest(database, request.headers.authorization, organizationHeader(request.headers["x-organization-id"]));
    authorize(context, "incident:read", context.organizationId);
    return { data: await listServices(database, context.organizationId) };
  });

  app.post("/v1/services", async (request, reply) => {
    const context = await authenticateRequest(database, request.headers.authorization, organizationHeader(request.headers["x-organization-id"]));
    authorize(context, "incident:write", context.organizationId);
    return reply.code(201).send({ data: await createService(database, context.organizationId, createServiceInput.parse(request.body)) });
  });

  app.get("/v1/service-dependencies", async request => {
    const context = await authenticateRequest(database, request.headers.authorization, organizationHeader(request.headers["x-organization-id"]));
    authorize(context, "incident:read", context.organizationId);
    return { data: await listDependencies(database, context.organizationId) };
  });

  app.post("/v1/service-dependencies", async (request, reply) => {
    const context = await authenticateRequest(database, request.headers.authorization, organizationHeader(request.headers["x-organization-id"]));
    authorize(context, "incident:write", context.organizationId);
    return reply.code(201).send({ data: await createDependency(database, context.organizationId, createDependencyInput.parse(request.body)) });
  });
}
