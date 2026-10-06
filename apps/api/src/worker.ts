import { createClient } from "redis";
import { nextAttempt, parseSerializedJob } from "./jobs/types.js";
import { createDatabase } from "./db/database.js";
import { handleInvestigationJob } from "./jobs/investigation-handler.js";
import { recoverInFlightJobs } from "./jobs/recovery.js";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const database = createDatabase();

const queue = process.env.SENTINELOS_JOB_QUEUE ?? "sentinelos:jobs";
const processingQueue = `${queue}:processing`;
const deadLetterQueue = `${queue}:dead`;
const configuredMaxAttempts = Number.parseInt(process.env.SENTINELOS_JOB_MAX_ATTEMPTS ?? "3", 10);
const maxAttempts = Math.min(100, Math.max(1, Number.isFinite(configuredMaxAttempts) ? configuredMaxAttempts : 3));
const client = createClient({ url: redisUrl });

client.on("error", () => {
  console.error(JSON.stringify({ event: "worker.redis_error" }));
});

await client.connect();
const recoveredJobs = await recoverInFlightJobs(client, queue, processingQueue);
if (recoveredJobs > 0) {
  console.log(JSON.stringify({ event: "worker.jobs_recovered", count: recoveredJobs }));
}
console.log(`SentinelOS worker listening on ${queue}`);

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(JSON.stringify({ event: "worker.shutdown", signal }));
  await client.close();
  await database.end();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

while (!stopping) {
  const raw = await client.brPopLPush(queue, processingQueue, 5);
  if (!raw) continue;

  let job;
  try {
    job = parseSerializedJob(raw);
  } catch {
    console.error(JSON.stringify({ event: "job.rejected", reason: "invalid_job" }));
    await client.lRem(processingQueue, 1, raw);
    continue;
  }

  console.log(JSON.stringify({
    event: "job.received",
    type: job.type,
    jobId: job.jobId,
    investigationId: job.investigationId,
  }));

  try {
    const result = await handleInvestigationJob(database, job);
    await client.lRem(processingQueue, 1, raw);
    console.log(JSON.stringify({
      event: "job.finished",
      type: job.type,
      jobId: job.jobId,
      investigationId: job.investigationId,
      result,
    }));
  } catch {
    await client.lRem(processingQueue, 1, raw);
    const attempted = nextAttempt(job);
    const exhausted = attempted.attempt >= maxAttempts;
    await client.rPush(exhausted ? deadLetterQueue : queue, JSON.stringify(attempted));
    console.error(JSON.stringify({
      event: exhausted ? "job.dead_lettered" : "job.retry_scheduled",
      type: job.type,
      jobId: job.jobId,
      investigationId: job.investigationId,
      attempt: attempted.attempt,
      maxAttempts,
    }));
  }
}
