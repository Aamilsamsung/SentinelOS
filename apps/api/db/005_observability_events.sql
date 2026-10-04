CREATE TABLE observability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id text,
  event_type text NOT NULL,
  source text NOT NULL,
  service text,
  severity incident_severity NOT NULL DEFAULT 'info',
  title text NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, external_id)
);

CREATE INDEX observability_events_org_time_idx
  ON observability_events (organization_id, occurred_at DESC);
CREATE INDEX observability_events_service_time_idx
  ON observability_events (organization_id, service, occurred_at DESC);
