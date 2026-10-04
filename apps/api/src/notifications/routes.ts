import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { authenticateRequest } from "../security/authenticate.js";
import { listNotifications, markNotificationRead } from "./repository.js";

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerNotificationRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/notifications", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    return { data: await listNotifications(database, context.organizationId, context.userId) };
  });

  app.post("/v1/notifications/:notificationId/read", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    const notificationId = (request.params as { notificationId: string }).notificationId;
    const found = await markNotificationRead(database, context.organizationId, context.userId, notificationId);
    if (!found) {
      throw Object.assign(new Error("Notification not found"), {
        statusCode: 404, code: "NOTIFICATION_NOT_FOUND"
      });
    }
    return reply.send({ data: { id: notificationId, read: true } });
  });
}
