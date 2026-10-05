import { z } from "zod";

export const investigationJobSchema = z.object({
  version: z.literal(1),
  type: z.literal("investigation.run"),
  jobId: z.uuid(),
  organizationId: z.uuid(),
  investigationId: z.uuid(),
  requestedByUserId: z.uuid(),
  enqueuedAt: z.iso.datetime(),
}).strict();

export type InvestigationJob = z.infer<typeof investigationJobSchema>;

export function parseJob(input: unknown): InvestigationJob {
  return investigationJobSchema.parse(input);
}

export function parseSerializedJob(serialized: string): InvestigationJob {
  return parseJob(JSON.parse(serialized));
}
