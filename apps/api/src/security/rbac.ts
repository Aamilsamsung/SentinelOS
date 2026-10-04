export const roles = ["viewer", "responder", "admin", "owner"] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  "incident:read",
  "incident:write",
  "investigation:run",
  "action:request",
  "action:approve",
  "integration:manage",
  "member:manage",
  "audit:read"
] as const;
export type Permission = (typeof permissions)[number];

const grants: Record<Role, ReadonlySet<Permission>> = {
  viewer: new Set(["incident:read"]),
  responder: new Set(["incident:read", "incident:write", "investigation:run", "action:request"]),
  admin: new Set([
    "incident:read", "incident:write", "investigation:run", "action:request",
    "action:approve", "integration:manage", "member:manage", "audit:read"
  ]),
  owner: new Set(permissions)
};

export function can(role: Role, permission: Permission): boolean {
  return grants[role].has(permission);
}

export function assertSameOrganization(actorOrganizationId: string, resourceOrganizationId: string): void {
  if (!actorOrganizationId || actorOrganizationId !== resourceOrganizationId) {
    throw Object.assign(new Error("Cross-organization access denied"), {
      statusCode: 403,
      code: "TENANT_BOUNDARY_VIOLATION"
    });
  }
}
