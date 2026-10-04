import type { Role } from "../security/rbac.js";
import { mayApproveAction } from "./policy.js";
import { transitionAction, type ActionState, type Transition } from "./state-machine.js";

export type ActionActor = { userId: string; role: Role };
export type ActionRecord = { requestedBy: string; status: ActionState };

export function authorizeActionTransition(
  actor: ActionActor,
  action: ActionRecord,
  transition: Transition
): ActionState {
  if ((transition === "approve" || transition === "reject") &&
      !mayApproveAction(actor.role, actor.userId, { requestedBy: action.requestedBy })) {
    throw Object.assign(new Error("Action approval requires a different authorized user"), {
      statusCode: 403,
      code: "ACTION_APPROVAL_DENIED"
    });
  }
  return transitionAction(action.status, transition);
}
