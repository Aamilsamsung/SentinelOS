import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL is required");

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
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

while (!stopping) {
  const item = await client.blPop(queue, 5);
  if (!item) continue;

  try {
    const job = JSON.parse(item.element) as { type?: unknown; payload?: unknown };
    if (typeof job.type !== "string") throw new Error("job type is required");
    console.log(JSON.stringify({ event: "job.received", type: job.type }));
  } catch {
    console.error(JSON.stringify({ event: "job.rejected", reason: "invalid_job" }));
  }
}
