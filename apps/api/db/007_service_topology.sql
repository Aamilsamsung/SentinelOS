CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  owner_team text,
  repository_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, id)
);

CREATE TABLE service_dependencies (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  upstream_service_id uuid NOT NULL,
  downstream_service_id uuid NOT NULL,
  dependency_type text NOT NULL DEFAULT 'runtime',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, upstream_service_id, downstream_service_id),
  FOREIGN KEY (organization_id, upstream_service_id) REFERENCES services(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, downstream_service_id) REFERENCES services(organization_id, id) ON DELETE CASCADE,
  CHECK (upstream_service_id <> downstream_service_id)
);

CREATE INDEX service_dependencies_downstream_idx
  ON service_dependencies (organization_id, downstream_service_id);
