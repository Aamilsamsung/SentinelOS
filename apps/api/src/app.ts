import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

type HttpLikeError = Error & { statusCode?: number; code?: string };

function normalizeError(error: unknown): HttpLikeError {
  return error instanceof Error ? error as HttpLikeError : new Error("Unknown error");
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    requestIdHeader: "x-request-id"
  });

  await app.register(helmet);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  app.get("/health", async () => ({
    status: "ok",
    service: "sentinelos-api"
  }));

  app.get("/ready", async (_request, reply) => {
    // Dependency checks are added as persistence/queue services are introduced.
    return reply.code(200).send({ status: "ready" });
  });

  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        requestId: request.id
      }
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
