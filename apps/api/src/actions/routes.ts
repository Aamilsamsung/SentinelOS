import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { authenticateRequest } from "../security/authenticate.js";
import { authorize } from "../security/context.js";
import { writeAuditEvent } from "../audit/repository.js";
import { authorizeActionTransition } from "./guard.js";
import { getActionForUpdate, persistActionTransition } from "./repository.js";
import { listOrganizationActions } from "./list.js";
import type { Transition } from "./state-machine.js";

const transitionInput = z.object({
  transition: z.enum(["approve", "reject", "execute", "succeed", "fail"]),
  reason: z.string().trim().max(2000).optional()
}).strict();

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerActionRoutes(app: FastifyInstance, database: Database) {
  app.get("/v1/actions", async request => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    authorize(context, "incident:read", context.organizationId);
    return { data: await listOrganizationActions(database, context.organizationId) };
  });
  app.post("/v1/actions/:actionId/transitions", async (request, reply) => {
    const organizationId = header(request.headers["x-organization-id"]);
    const context = await authenticateRequest(database, request.headers.authorization, organizationId);
    const input = transitionInput.parse(request.body);
    const actionId = (request.params as { actionId: string }).actionId;

    if (input.transition === "approve" || input.transition === "reject") {
      authorize(context, "action:approve", context.organizationId);
    } else {
      authorize(context, "action:request", context.organizationId);
    }

    const result = await withTransaction(database, async client => {
      const action = await getActionForUpdate(client, context.organizationId, actionId);
      if (!action) {
        throw Object.assign(new Error("Action not found"), { statusCode: 404, code: "ACTION_NOT_FOUND" });
      }
      const next = authorizeActionTransition(
        { userId: context.userId, role: context.role },
        { requestedBy: action.requestedBy, status: action.status, verificationStatus: action.verificationStatus },
        input.transition as Transition
      );
      await persistActionTransition(
        client, context.organizationId, action.id, action.status, next, context.userId, input.reason
      );
      await writeAuditEvent(client, {
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: `remediation.${input.transition}`,
        resourceType: "remediation_action",
        resourceId: action.id,
        requestId: request.id,
        metadata: { fromStatus: action.status, toStatus: next, reason: input.reason ?? null }
      });
      return { id: action.id, status: next };
    });

    return reply.code(200).send({ data: result });
  });
}
