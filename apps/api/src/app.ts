import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import rawBody from "fastify-raw-body";
import type { Database } from "./db/database.js";
import { checkDatabase } from "./db/database.js";
import { registerIncidentRoutes } from "./incidents/routes.js";
import { registerEventRoutes } from "./events/routes.js";
import { registerActionRoutes } from "./actions/routes.js";
import { registerInvestigationRoutes } from "./investigations/routes.js";
import { registerNotificationRoutes } from "./notifications/routes.js";
import { registerKnowledgeRoutes } from "./knowledge/routes.js";
import { registerIntegrationRoutes } from "./integrations/routes.js";
import { registerDashboardRoutes } from "./dashboard/routes.js";
import { registerActivityRoutes } from "./activity/routes.js";
import type { EnqueueInvestigationInput } from "./jobs/queue.js";

type HttpLikeError = Error & { statusCode?: number; code?: string };

function normalizeError(error: unknown): HttpLikeError {
  return error instanceof Error ? error as HttpLikeError : new Error("Unknown error");
}

export type AppDependencies = {
  database?: Database;
  enqueueInvestigation?: (input: EnqueueInvestigationInput) => Promise<{ jobId: string }>;
};

export async function buildApp(dependencies: AppDependencies = {}) {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    requestIdHeader: "x-request-id"
  });

  await app.register(helmet);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(rawBody, { field: "rawBody", global: false, encoding: "utf8", runFirst: true });

  if (dependencies.database) {
    await registerIncidentRoutes(app, dependencies.database);
    await registerEventRoutes(app, dependencies.database);
    await registerActionRoutes(app, dependencies.database);
    await registerInvestigationRoutes(app, dependencies.database, dependencies.enqueueInvestigation);
    await registerNotificationRoutes(app, dependencies.database);
    await registerKnowledgeRoutes(app, dependencies.database);
    await registerIntegrationRoutes(app, dependencies.database);
    await registerDashboardRoutes(app, dependencies.database);
    await registerActivityRoutes(app, dependencies.database);
  }

  app.get("/health", async () => ({
    status: "ok",
    service: "sentinelos-api"
  }));

  app.get("/ready", async (_request, reply) => {
    if (!dependencies.database) {
      return reply.code(503).send({
        status: "not_ready",
        dependencies: { database: "not_configured" }
      });
    }
    try {
      await checkDatabase(dependencies.database);
      return reply.code(200).send({
        status: "ready",
        dependencies: { database: "ok" }
      });
    } catch {
      return reply.code(503).send({
        status: "not_ready",
        dependencies: { database: "unavailable" }
      });
    }
  });

  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: { code: "NOT_FOUND", message: "Route not found", requestId: request.id }
    });
  });

  app.setErrorHandler(async (unknownError, request, reply) => {
    const error = normalizeError(unknownError);
    request.log.error({ err: error }, "request failed");
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return reply.code(status).send({
      error: {
        code: error.code ?? (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
        message: status === 500 ? "Internal server error" : error.message,
        requestId: request.id
      }
    });
  });

  return app;
}
