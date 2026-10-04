CREATE TABLE incident_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL,
  evidence_type text NOT NULL,
  evidence_id text NOT NULL,
  service text,
  reason text NOT NULL,
  score double precision NOT NULL CHECK (score >= 0 AND score <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, incident_id)
    REFERENCES incidents(organization_id, id) ON DELETE CASCADE,
  UNIQUE (organization_id, incident_id, evidence_type, evidence_id)
);

CREATE INDEX incident_correlations_incident_idx
  ON incident_correlations (organization_id, incident_id, score DESC);
