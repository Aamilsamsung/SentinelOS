import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { ingestEvent } from "../events/repository.js";
import { normalizeGitHubWebhook } from "./github.js";
import { verifyGitHubWebhookSignature } from "./github-signature.js";

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerGitHubWebhookRoutes(app: FastifyInstance, database: Database) {
  app.post("/v1/webhooks/github/:organizationId", { config: { rawBody: true } }, async (request, reply) => {
    const organizationId = (request.params as { organizationId: string }).organizationId;
    const eventName = header(request.headers["x-github-event"]);
    const signature = header(request.headers["x-hub-signature-256"]);
    const deliveryId = header(request.headers["x-github-delivery"]);
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
      return reply.code(503).send({
        error: { code: "GITHUB_WEBHOOK_NOT_CONFIGURED", message: "GitHub webhook ingestion unavailable", requestId: request.id },
      });
    }
    const raw = (request as typeof request & { rawBody?: string }).rawBody;
    if (!eventName || !signature || !deliveryId || typeof raw !== "string") {
      return reply.code(401).send({
        error: { code: "GITHUB_WEBHOOK_SIGNATURE_REQUIRED", message: "Signed GitHub webhook required", requestId: request.id },
      });
    }

    if (!verifyGitHubWebhookSignature(secret, raw, signature)) {
      return reply.code(401).send({
        error: { code: "INVALID_GITHUB_WEBHOOK_SIGNATURE", message: "Invalid GitHub webhook signature", requestId: request.id },
      });
    }

    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const input = normalizeGitHubWebhook(eventName, payload);
    if (!input) return reply.code(202).send({ accepted: true, ignored: true });

    input.externalId = `${input.externalId ?? "github:event"}:delivery:${deliveryId}`;
    const created = await ingestEvent(database, organizationId, input);
    return reply.code(created ? 202 : 200).send({ accepted: true, duplicate: !created });
  });
}
