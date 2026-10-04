import { z } from "zod";

export const findingSchema = z.object({
  type: z.enum(["observation", "hypothesis", "recommendation"]),
  title: z.string().trim().min(1).max(240),
  detail: z.string().trim().min(1).max(8000),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(z.string().min(1)).max(100)
}).strict();

export type Finding = z.infer<typeof findingSchema>;

export function validateFindings(
  input: unknown,
  allowedEvidenceIds: ReadonlySet<string>
): Finding[] {
  const parsed = z.array(findingSchema).max(100).parse(input);
  for (const finding of parsed) {
    if (finding.type !== "recommendation" && finding.evidenceIds.length === 0) {
      throw new Error("Observations and hypotheses require evidence");
    }
    for (const id of finding.evidenceIds) {
      if (!allowedEvidenceIds.has(id)) {
        throw new Error(`Finding references unknown evidence: ${id}`);
      }
    }
  }
  return parsed;
}
