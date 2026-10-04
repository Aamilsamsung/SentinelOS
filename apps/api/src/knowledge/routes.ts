import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { knowledgeDocumentInput } from "./model.js";
import { createKnowledgeDocument, listKnowledgeDocuments } from "./repository.js";

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerKnowledgeRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/knowledge", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await listKnowledgeDocuments(database, context.organizationId) };
  });

  app.post("/v1/knowledge", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:write", context.organizationId);
    const input = knowledgeDocumentInput.parse(request.body);
    const document = await createKnowledgeDocument(database, context.organizationId, context.userId, input);
    return reply.code(201).send({ data: document });
  });
}
