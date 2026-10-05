import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase, type Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { claimInvestigation } from "../investigations/repository.js";
import { validateInvestigationJobContext } from "./investigation-handler.js";
import type { InvestigationJob } from "./types.js";

const ids = {
  organization: "a1111111-1111-4111-8111-111111111111",
  user: "a2222222-2222-4222-8222-222222222222",
  incident: "a3333333-3333-4333-8333-333333333333",
  investigation: "a4444444-4444-4444-8444-444444444444",
};

const job: InvestigationJob = {
  version: 1,
  type: "investigation.run",
  jobId: "a5555555-5555-4555-8555-555555555555",
  organizationId: ids.organization,
  investigationId: ids.investigation,
  requestedByUserId: ids.user,
  enqueuedAt: "2026-10-05T15:00:00.000Z",
};

describe.skipIf(!process.env.DATABASE_URL)("investigation worker PostgreSQL integration", () => {
  let database: Database;

  beforeAll(async () => {
    database = createDatabase();
    await database.query("DELETE FROM organizations WHERE id = $1", [ids.organization]);
    await database.query(
      "INSERT INTO organizations (id, name, slug) VALUES ($1, 'Worker Integration', $2)",
      [ids.organization, `worker-integration-${ids.organization.slice(0, 8)}`],
    );
    await database.query(
      "INSERT INTO users (id, email, display_name) VALUES ($1, $2, 'Worker Tester')",
      [ids.user, `worker-${ids.user.slice(0, 8)}@example.test`],
    );
    await database.query(
      "INSERT INTO organization_memberships (organization_id, user_id, role) VALUES ($1, $2, 'responder')",
      [ids.organization, ids.user],
    );
    await database.query(
      `INSERT INTO incidents
        (id, organization_id, title, summary, severity, status, source, detected_at)
       VALUES ($1, $2, 'Queue integration incident', '', 'warning', 'open', 'test', now())`,
      [ids.incident, ids.organization],
    );
    await database.query(
      `INSERT INTO investigations
        (id, organization_id, incident_id, status, started_by, started_at)
       VALUES ($1, $2, $3, 'queued', $4, NULL)`,
      [ids.investigation, ids.organization, ids.incident, ids.user],
    );
  });

  afterAll(async () => {
    if (database) {
      await database.query("DELETE FROM organizations WHERE id = $1", [ids.organization]);
      await database.query("DELETE FROM users WHERE id = $1", [ids.user]);
      await database.end();
    }
  });

  it("revalidates membership and atomically claims queued work", async () => {
    const incidentId = await withTransaction(database, async client => {
      await expect(validateInvestigationJobContext(client, job)).resolves.toBeUndefined();
      return claimInvestigation(client, job.organizationId, job.investigationId);
    });

    expect(incidentId).toBe(ids.incident);
    const state = await database.query(
      "SELECT status, started_at FROM investigations WHERE organization_id = $1 AND id = $2",
      [ids.organization, ids.investigation],
    );
    expect(state.rows[0].status).toBe("running");
    expect(state.rows[0].started_at).toBeTruthy();
  });

  it("rejects the same claim after the atomic transition", async () => {
    await expect(withTransaction(database, client =>
      claimInvestigation(client, job.organizationId, job.investigationId)
    )).rejects.toMatchObject({ code: "INVESTIGATION_NOT_RUNNABLE" });
  });

  it("rejects stale authorization after membership removal", async () => {
    await database.query(
      "DELETE FROM organization_memberships WHERE organization_id = $1 AND user_id = $2",
      [ids.organization, ids.user],
    );
    await database.query(
      "UPDATE investigations SET status = 'queued', started_at = NULL WHERE organization_id = $1 AND id = $2",
      [ids.organization, ids.investigation],
    );

    const client = await database.connect();
    try {
      await expect(validateInvestigationJobContext(client, job))
        .rejects.toMatchObject({ code: "INVESTIGATION_JOB_CONTEXT_INVALID" });
    } finally {
      client.release();
    }
  });
});
