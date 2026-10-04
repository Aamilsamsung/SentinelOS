import type { Permission, Role } from "./rbac.js";
import { assertSameOrganization, can } from "./rbac.js";

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: Role;
  sessionId: string;
};

export function authorize(
  context: AuthContext,
  permission: Permission,
  resourceOrganizationId: string
): void {
  assertSameOrganization(context.organizationId, resourceOrganizationId);
  if (!can(context.role, permission)) {
    throw Object.assign(new Error("Permission denied"), {
      statusCode: 403,
      code: "PERMISSION_DENIED"
    });
  }
}
