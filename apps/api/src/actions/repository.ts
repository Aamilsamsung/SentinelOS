import type { PoolClient } from "pg";
import type { ActionState } from "./state-machine.js";

export type StoredAction = {
  id: string;
  organizationId: string;
  requestedBy: string;
  status: ActionState;
};

export async function getActionForUpdate(
  client: PoolClient,
  organizationId: string,
  actionId: string
): Promise<StoredAction | null> {
  const result = await client.query(
    `SELECT id, organization_id, requested_by, status
       FROM remediation_actions
      WHERE organization_id = $1 AND id = $2
      FOR UPDATE`,
    [organizationId, actionId]
  );
  const row = result.rows[0];
  return row ? {
    id: row.id,
    organizationId: row.organization_id,
    requestedBy: row.requested_by,
    status: row.status
  } : null;
}

export async function persistActionTransition(
  client: PoolClient,
  organizationId: string,
  actionId: string,
  fromStatus: ActionState,
  toStatus: ActionState,
  actorUserId: string,
  reason?: string
): Promise<void> {
  await client.query(
    `UPDATE remediation_actions
        SET status = $3,
            approved_by = CASE WHEN $3 = 'approved' THEN $4 ELSE approved_by END,
            approved_at = CASE WHEN $3 = 'approved' THEN now() ELSE approved_at END,
            executed_at = CASE WHEN $3 = 'executing' THEN now() ELSE executed_at END
      WHERE organization_id = $1 AND id = $2 AND status = $5`,
    [organizationId, actionId, toStatus, actorUserId, fromStatus]
  );
  await client.query(
    `INSERT INTO action_transitions
      (organization_id, action_id, from_status, to_status, actor_user_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [organizationId, actionId, fromStatus, toStatus, actorUserId, reason ?? null]
  );
}
