import { createDatabase } from "./database.js";
import { createOpaqueToken, hashToken } from "../security/session.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Development seed is disabled in production");
}

const database = createDatabase();
const token = process.env.SEED_SESSION_TOKEN ?? createOpaqueToken();

try {
  const org = await database.query(
    `INSERT INTO organizations (name, slug)
     VALUES ('SentinelOS Demo', 'sentinelos-demo')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`
  );
  const user = await database.query(
    `INSERT INTO users (email, display_name)
     VALUES ('admin@sentinelos.local', 'Demo Administrator')
     ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING id`
  );
  await database.query(
    `INSERT INTO organization_memberships (organization_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'`,
    [org.rows[0].id, user.rows[0].id]
  );
  await database.query("DELETE FROM sessions WHERE user_id = $1", [user.rows[0].id]);
  await database.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '24 hours')`,
    [user.rows[0].id, hashToken(token)]
  );
  console.log("Development seed ready.");
  console.log(`Organization ID: ${org.rows[0].id}`);
  console.log(`Session token: ${token}`);
} finally {
  await database.end();
}
