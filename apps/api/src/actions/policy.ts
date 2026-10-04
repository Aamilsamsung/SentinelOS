import { can, type Role } from "../security/rbac.js";

export type ActionRequest = {
  requestedBy: string;
  organizationId: string;
  actionType: string;
};

export function mayRequestAction(role: Role): boolean {
  return can(role, "action:request");
}

export function mayApproveAction(
  role: Role,
  approverUserId: string,
  request: ActionRequest
): boolean {
  return can(role, "action:approve") && approverUserId !== request.requestedBy;
}
