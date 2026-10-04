import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { ingestEventInput } from "./model.js";
import { ingestEvent } from "./repository.js";
import { assertFreshTimestamp, verifyWebhookSignature } from "./signature.js";

export async function registerEventRoutes(app: FastifyInstance, database: Database) {
  app.post("/v1/webhooks/events/:organizationId", { config: { rawBody: true } }, async (request, reply) => {
    const organizationId = (request.params as { organizationId: string }).organizationId;
    const timestamp = request.headers["x-sentinel-timestamp"];
    const signature = request.headers["x-sentinel-signature"];
    if (typeof timestamp !== "string" || typeof signature !== "string") {
      return reply.code(401).send({ error: { code: "WEBHOOK_SIGNATURE_REQUIRED", message: "Signed webhook required", requestId: request.id } });
    }
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      request.log.error("WEBHOOK_SECRET is not configured");
      return reply.code(503).send({ error: { code: "WEBHOOK_NOT_CONFIGURED", message: "Webhook ingestion unavailable", requestId: request.id } });
    }

    assertFreshTimestamp(timestamp);
    const body = (request as typeof request & { rawBody?: string }).rawBody;
    if (typeof body !== "string") {
      request.log.error("Raw webhook body was not captured");
      return reply.code(500).send({ error: { code: "WEBHOOK_RAW_BODY_UNAVAILABLE", message: "Webhook verification unavailable", requestId: request.id } });
    }
    if (!verifyWebhookSignature(secret, timestamp, body, signature)) {
      return reply.code(401).send({ error: { code: "INVALID_WEBHOOK_SIGNATURE", message: "Invalid webhook signature", requestId: request.id } });
    }

    const input = ingestEventInput.parse(typeof request.body === "string" ? JSON.parse(request.body) : request.body);
    const created = await ingestEvent(database, organizationId, input);
    return reply.code(created ? 202 : 200).send({ accepted: true, duplicate: !created });
  });
}
