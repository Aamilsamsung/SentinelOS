import { buildApp } from "./app.js";
import { createDatabase } from "./db/database.js";
import { createQueueClient, enqueueInvestigationJob } from "./jobs/queue.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const database = process.env.DATABASE_URL ? createDatabase() : undefined;
const redisUrl = process.env.REDIS_URL;
const queueClient = redisUrl ? await createQueueClient(redisUrl) : undefined;
const enqueueInvestigation = queueClient
  ? (input: Parameters<typeof enqueueInvestigationJob>[1]) => enqueueInvestigationJob(queueClient, input)
  : undefined;
const app = await buildApp({ database, enqueueInvestigation });

let stopping = false;
const shutdown = async () => {
  if (stopping) return;
  stopping = true;
  await app.close();
  if (queueClient) await queueClient.close();
  if (database) await database.end();
};

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  if (queueClient) await queueClient.close();
  if (database) await database.end();
  process.exit(1);
}
