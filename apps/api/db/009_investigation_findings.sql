ALTER TABLE investigations
  ADD COLUMN IF NOT EXISTS started_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text;

CREATE TABLE investigation_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  investigation_id uuid NOT NULL,
  finding_type text NOT NULL CHECK (finding_type IN ('observation','hypothesis','recommendation')),
  title text NOT NULL,
  detail text NOT NULL,
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, investigation_id)
    REFERENCES investigations(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX investigation_findings_run_idx
  ON investigation_findings (organization_id, investigation_id, created_at);
