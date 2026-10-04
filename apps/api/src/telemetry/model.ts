import { z } from "zod";

export const logInput = z.object({
  service: z.string().trim().min(1).max(160),
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string().min(1).max(20000),
  traceId: z.string().trim().min(1).max(200).optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.iso.datetime()
}).strict();

export const metricInput = z.object({
  service: z.string().trim().min(1).max(160),
  metricName: z.string().trim().min(1).max(200),
  value: z.number().finite(),
  unit: z.string().trim().min(1).max(40).optional(),
  dimensions: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.iso.datetime()
}).strict();
