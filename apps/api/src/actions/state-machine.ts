export type ActionState = "requested" | "approved" | "rejected" | "executing" | "succeeded" | "failed";
export type Transition = "approve" | "reject" | "execute" | "succeed" | "fail";

const transitions: Record<ActionState, Partial<Record<Transition, ActionState>>> = {
  requested: { approve: "approved", reject: "rejected" },
  approved: { execute: "executing" },
  rejected: {},
  executing: { succeed: "succeeded", fail: "failed" },
  succeeded: {},
  failed: {}
};

export function transitionAction(current: ActionState, transition: Transition): ActionState {
  const next = transitions[current][transition];
  if (!next) {
    throw Object.assign(new Error(`Invalid action transition: ${current} -> ${transition}`), {
      statusCode: 409,
      code: "INVALID_ACTION_TRANSITION"
    });
  }
  return next;
}
