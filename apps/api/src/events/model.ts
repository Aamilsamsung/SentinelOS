import { z } from "zod";
import { incidentSeverity } from "../incidents/model.js";

export const ingestEventInput = z.object({
  externalId: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().min(1).max(120),
  source: z.string().trim().min(1).max(120),
  service: z.string().trim().min(1).max(160).optional(),
  severity: incidentSeverity.default("info"),
  title: z.string().trim().min(1).max(300),
  occurredAt: z.iso.datetime(),
  attributes: z.record(z.string(), z.unknown()).default({})
}).strict();

export type IngestEventInput = z.infer<typeof ingestEventInput>;
