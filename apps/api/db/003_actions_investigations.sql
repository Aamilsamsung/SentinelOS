CREATE TYPE investigation_status AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE action_status AS ENUM ('requested', 'approved', 'rejected', 'executing', 'succeeded', 'failed');

CREATE TABLE investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL,
  status investigation_status NOT NULL DEFAULT 'queued',
  conclusion text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, incident_id)
    REFERENCES incidents(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  investigation_id uuid NOT NULL,
  evidence_type text NOT NULL,
  source text NOT NULL,
  content jsonb NOT NULL,
  observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, investigation_id)
    REFERENCES investigations(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE remediation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL,
  action_type text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status action_status NOT NULL DEFAULT 'requested',
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  executed_at timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, incident_id)
    REFERENCES incidents(organization_id, id) ON DELETE CASCADE,
  CHECK (approved_by IS NULL OR approved_by IS DISTINCT FROM requested_by)
);

CREATE INDEX evidence_investigation_idx ON evidence (organization_id, investigation_id, observed_at);
CREATE INDEX remediation_actions_incident_idx ON remediation_actions (organization_id, incident_id, requested_at DESC);
