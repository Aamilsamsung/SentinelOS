import { buildApp } from "./app.js";
import { createDatabase } from "./db/database.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const database = process.env.DATABASE_URL ? createDatabase() : undefined;
const app = await buildApp({ database });

const shutdown = async () => {
  await app.close();
  if (database) await database.end();
};

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  if (database) await database.end();
  process.exit(1);
}
