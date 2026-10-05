import { randomUUID } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { investigationJobSchema, type InvestigationJob } from "./types.js";

export const DEFAULT_JOB_QUEUE = "sentinelos:jobs";

export type EnqueueInvestigationInput = {
  organizationId: string;
  investigationId: string;
  requestedByUserId: string;
};

export function createInvestigationJob(
  input: EnqueueInvestigationInput,
  now = new Date(),
  jobId = randomUUID(),
): InvestigationJob {
  return investigationJobSchema.parse({
    version: 1,
    type: "investigation.run",
    jobId,
    ...input,
    enqueuedAt: now.toISOString(),
  });
}

export async function enqueueInvestigationJob(
  client: Pick<RedisClientType, "rPush">,
  input: EnqueueInvestigationInput,
  queue = DEFAULT_JOB_QUEUE,
): Promise<InvestigationJob> {
  const job = createInvestigationJob(input);
  await client.rPush(queue, JSON.stringify(job));
  return job;
}

export async function createQueueClient(redisUrl: string) {
  const client = createClient({ url: redisUrl });
  await client.connect();
  return client;
}
