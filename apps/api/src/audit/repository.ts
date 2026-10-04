import type { PoolClient } from "pg";

export type AuditEventInput = {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(client: PoolClient, event: AuditEventInput): Promise<void> {
  await client.query(
    `INSERT INTO audit_events
      (organization_id, actor_user_id, action, resource_type, resource_id, request_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      event.organizationId,
      event.actorUserId,
      event.action,
      event.resourceType,
      event.resourceId ?? null,
      event.requestId ?? null,
      JSON.stringify(event.metadata ?? {})
    ]
  );
}
