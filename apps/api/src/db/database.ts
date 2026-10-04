import pg from "pg";

const { Pool } = pg;

export type Database = InstanceType<typeof Pool>;

export function createDatabase(connectionString = process.env.DATABASE_URL): Database {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  return new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
  });
}

export async function checkDatabase(database: Database): Promise<void> {
  await database.query("SELECT 1");
}
