import { createHash } from "node:crypto";
import { z } from "zod";

export const knowledgeDocumentInput = z.object({
  title: z.string().trim().min(1).max(240),
  sourceType: z.enum(["manual", "runbook", "postmortem", "integration"]),
  sourceUri: z.string().trim().max(2000).optional(),
  content: z.string().trim().min(1).max(200_000)
}).strict();

export type KnowledgeDocumentInput = z.infer<typeof knowledgeDocumentInput>;

export function contentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
