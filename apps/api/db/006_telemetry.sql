CREATE TABLE log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service text NOT NULL,
  level text NOT NULL,
  message text NOT NULL,
  trace_id text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE metric_points (
  id bigserial PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service text NOT NULL,
  metric_name text NOT NULL,
  value double precision NOT NULL,
  unit text,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX log_entries_org_service_time_idx ON log_entries (organization_id, service, occurred_at DESC);
CREATE INDEX log_entries_trace_idx ON log_entries (organization_id, trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX metric_points_series_time_idx ON metric_points (organization_id, service, metric_name, occurred_at DESC);
