import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { getCommandCenterSummary } from "./repository.js";

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerDashboardRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/dashboard/summary", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await getCommandCenterSummary(database, context.organizationId) };
  });
}
