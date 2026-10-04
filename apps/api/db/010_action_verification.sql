ALTER TABLE remediation_actions
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS rationale text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text
    CHECK (verification_status IN ('passed','failed','inconclusive')),
  ADD COLUMN IF NOT EXISTS verification_detail text;

CREATE TABLE action_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_id uuid NOT NULL,
  from_status action_status,
  to_status action_status NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, action_id)
    REFERENCES remediation_actions(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX action_transitions_action_idx
  ON action_transitions (organization_id, action_id, created_at);
