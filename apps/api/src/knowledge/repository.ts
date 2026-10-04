import type { Database } from "../db/database.js";
import type { KnowledgeDocumentInput } from "./model.js";
import { contentHash } from "./model.js";

export async function createKnowledgeDocument(
  database: Database,
  organizationId: string,
  userId: string,
  input: KnowledgeDocumentInput
) {
  const result = await database.query(
    `INSERT INTO knowledge_documents
      (organization_id, title, source_type, source_uri, content, content_sha256, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (organization_id, content_sha256) DO UPDATE
       SET title = EXCLUDED.title, source_type = EXCLUDED.source_type,
           source_uri = EXCLUDED.source_uri, updated_at = now()
     RETURNING id, title, source_type, source_uri, created_at, updated_at`,
    [organizationId, input.title, input.sourceType, input.sourceUri ?? null,
     input.content, contentHash(input.content), userId]
  );
  return result.rows[0];
}

export async function listKnowledgeDocuments(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT id, title, source_type, source_uri, created_at, updated_at
       FROM knowledge_documents WHERE organization_id = $1
       ORDER BY updated_at DESC LIMIT 100`,
    [organizationId]
  );
  return result.rows;
}
