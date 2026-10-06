import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "../db/database.js";
import { findBrowserIdentityByEmail } from "./browser-auth-repository.js";
import { createBrowserSession } from "./browser-session-repository.js";

const startSchema = z.object({
  email: z.string().email().max(320)
});

export async function registerBrowserAuthRoutes(app: FastifyInstance, database: Database) {
  app.post("/v1/browser-auth/start", async (request, reply) => {
    const parsed = startSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "Valid email required", requestId: request.id } });
    }

    const identity = await findBrowserIdentityByEmail(database, parsed.data.email);
    if (!identity || identity.organizations.length === 0) {
      return reply.code(401).send({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication failed", requestId: request.id } });
    }

    // This endpoint intentionally does not establish a session from email alone.
    // A verified identity-provider or magic-link proof must precede createBrowserSession.
    return reply.code(200).send({
      data: {
        challengeRequired: true,
        organizations: identity.organizations.map(({ id, name, slug }) => ({ id, name, slug }))
      }
    });
  });
}
