import { z } from "zod";

export const incidentSeverity = z.enum(["info", "warning", "critical"]);
export const incidentStatus = z.enum(["open", "investigating", "mitigated", "resolved"]);

export const createIncidentInput = z.object({
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().max(5000).default(""),
  severity: incidentSeverity,
  source: z.string().trim().min(1).max(120),
  detectedAt: z.iso.datetime()
}).strict();

export type CreateIncidentInput = z.infer<typeof createIncidentInput>;

export type Incident = CreateIncidentInput & {
  id: string;
  organizationId: string;
  status: z.infer<typeof incidentStatus>;
  createdAt: string;
  updatedAt: string;
};
