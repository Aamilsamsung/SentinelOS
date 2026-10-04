import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createDatabase } from "./database.js";

const database = createDatabase();
const here = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(here, "../../db");

try {
  await database.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(migrationsDirectory))
    .filter(name => /^\d+.*\.sql$/.test(name))
    .sort();

  for (const name of files) {
    const alreadyApplied = await database.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [name]
    );
    if (alreadyApplied.rowCount) continue;

    const sql = await readFile(join(migrationsDirectory, name), "utf8");
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await database.end();
}
