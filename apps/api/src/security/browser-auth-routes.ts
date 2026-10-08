import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "../db/database.js";
import { findBrowserIdentityByEmail, hasOrganizationMembership } from "./browser-auth-repository.js";
import { verifyBrowserProof } from "./browser-proof.js";
import { createBrowserSession } from "./browser-session-repository.js";
import { BROWSER_ORGANIZATION_COOKIE, BROWSER_SESSION_COOKIE, CSRF_COOKIE, clearBrowserCookie, clearCsrfCookie, csrfCookie, csrfMatches, organizationCookie, readCookie, sessionCookie } from "./browser-session.js";
import { resolveSession } from "./session-repository.js";
import { revokeBrowserSession } from "./browser-session-repository.js";

const startSchema = z.object({ email: z.string().email().max(320) });

const completeSchema = z.object({
  proof: z.string().min(1).max(4096),
  organizationId: z.string().uuid()
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

  app.post("/v1/browser-auth/complete", async (request, reply) => {
    const parsed = completeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: { code: "INVALID_REQUEST", message: "Valid proof and organization required", requestId: request.id } });
    const secret = process.env.BROWSER_AUTH_PROOF_SECRET;
    if (!secret || secret.length < 32) return reply.code(503).send({ error: { code: "AUTH_NOT_CONFIGURED", message: "Browser authentication is not configured", requestId: request.id } });
    const proof = verifyBrowserProof(parsed.data.proof, secret);
    if (!proof || !(await hasOrganizationMembership(database, proof.userId, parsed.data.organizationId))) {
      return reply.code(401).send({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication failed", requestId: request.id } });
    }
    const session = await createBrowserSession(database, proof.userId);
    const secure = process.env.NODE_ENV === "production";
    reply.header("set-cookie", [sessionCookie(session.sessionToken, secure), organizationCookie(parsed.data.organizationId, secure), csrfCookie(session.csrfToken, secure)]);
    return reply.code(200).send({ data: { authenticated: true, organizationId: parsed.data.organizationId, expiresAt: session.expiresAt } });
  });
}
