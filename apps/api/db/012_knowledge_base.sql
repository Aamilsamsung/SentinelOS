CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL,
  source_uri text,
  content text NOT NULL,
  content_sha256 text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, content_sha256)
);

CREATE INDEX knowledge_documents_org_created_idx
  ON knowledge_documents (organization_id, created_at DESC);
