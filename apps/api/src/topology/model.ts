import { z } from "zod";

export const createServiceInput = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  ownerTeam: z.string().trim().min(1).max(160).optional(),
  repositoryUrl: z.url().max(2000).optional()
}).strict();

export const createDependencyInput = z.object({
  upstreamServiceId: z.uuid(),
  downstreamServiceId: z.uuid(),
  dependencyType: z.string().trim().min(1).max(80).default("runtime")
}).strict();
