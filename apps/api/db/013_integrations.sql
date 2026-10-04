CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('disconnected','configured','degraded','error')),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  credential_ciphertext text,
  credential_key_version text,
  last_checked_at timestamptz,
  last_error text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, name),
  UNIQUE (organization_id, id)
);

CREATE INDEX integrations_org_provider_idx
  ON integrations (organization_id, provider, status);
