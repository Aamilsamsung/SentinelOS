import type { Role } from "../security/rbac.js";
import { can } from "../security/rbac.js";
import { transitionAction, type ActionState, type Transition } from "./state-machine.js";

export type ActionActor = { userId: string; role: Role };
export type ActionRecord = { requestedBy: string; status: ActionState; verificationStatus?: "passed" | "failed" | "inconclusive" | null };

export function authorizeActionTransition(
  actor: ActionActor,
  action: ActionRecord,
  transition: Transition
): ActionState {
  if (transition === "approve" || transition === "reject") {
    if (!can(actor.role, "action:approve") || actor.userId === action.requestedBy) {
      throw Object.assign(new Error("Action approval requires a different authorized user"), {
        statusCode: 403,
        code: "ACTION_APPROVAL_DENIED"
      });
    }
  }
  if (transition === "succeed" && action.verificationStatus !== "passed") {
    throw Object.assign(new Error("Action cannot succeed before verification passes"), {
      statusCode: 409,
      code: "ACTION_VERIFICATION_REQUIRED"
    });
  }
  return transitionAction(action.status, transition);
}
