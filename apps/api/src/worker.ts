import { createClient } from "redis";
import { parseSerializedJob } from "./jobs/types.js";
import { createDatabase } from "./db/database.js";
import { handleInvestigationJob } from "./jobs/investigation-handler.js";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const database = createDatabase();

const queue = process.env.SENTINELOS_JOB_QUEUE ?? "sentinelos:jobs";
const client = createClient({ url: redisUrl });

client.on("error", (error) => {
  console.error("worker redis error", error instanceof Error ? error.message : "unknown error");
});

await client.connect();
console.log(`SentinelOS worker listening on ${queue}`);

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`SentinelOS worker received ${signal}`);
  await client.close();
  await database.end();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

while (!stopping) {
  const item = await client.blPop(queue, 5);
  if (!item) continue;

  try {
    const job = parseSerializedJob(item.element);
    console.log(JSON.stringify({ event: "job.received", type: job.type, jobId: job.jobId, investigationId: job.investigationId }));
    const result = await handleInvestigationJob(database, job);
    console.log(JSON.stringify({ event: "job.finished", type: job.type, jobId: job.jobId, investigationId: job.investigationId, result }));
  } catch {
    console.error(JSON.stringify({ event: "job.rejected", reason: "invalid_job" }));
  }
}
