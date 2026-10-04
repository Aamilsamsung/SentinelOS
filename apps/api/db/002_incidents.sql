CREATE TYPE incident_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'mitigated', 'resolved');

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  severity incident_severity NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  source text NOT NULL,
  detected_at timestamptz NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE TABLE incident_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id uuid NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, incident_id)
    REFERENCES incidents(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX incidents_org_status_idx ON incidents (organization_id, status, detected_at DESC);
CREATE INDEX incident_events_incident_time_idx ON incident_events (organization_id, incident_id, occurred_at);
