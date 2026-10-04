import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { integrationInput } from "./model.js";
import { listIntegrations, rotateIntegrationCredential, upsertIntegration } from "./repository.js";
import { encryptCredential } from "./credentials.js";

const credentialInput = z.object({ credential: z.string().min(1).max(20000) }).strict();

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerIntegrationRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/integrations", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await listIntegrations(database, context.organizationId) };
  });

  app.post("/v1/integrations", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "integration:manage", context.organizationId);
    const input = integrationInput.parse(request.body);
    const integration = await upsertIntegration(database, context.organizationId, context.userId, input);
    return reply.code(201).send({ data: integration });
  });

  app.put("/v1/integrations/:integrationId/credential", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "integration:manage", context.organizationId);
    const integrationId = (request.params as { integrationId: string }).integrationId;
    const input = credentialInput.parse(request.body);
    const updated = await rotateIntegrationCredential(
      database, context.organizationId, integrationId, encryptCredential(input.credential), "v1"
    );
    if (!updated) {
      return reply.code(404).send({
        error: { code: "INTEGRATION_NOT_FOUND", message: "Integration not found", requestId: request.id }
      });
    }
    return reply.code(204).send();
  });
}
