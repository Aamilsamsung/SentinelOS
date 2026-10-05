import type { PoolClient } from "pg";
import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { configuredAnalyzer } from "../investigations/analyzer.js";
import { recordInvestigationFailure } from "../investigations/failure.js";
import { runInvestigation } from "../investigations/orchestrator.js";
import { claimInvestigation } from "../investigations/repository.js";
import type { InvestigationJob } from "./types.js";

type HandlerDependencies = {
  validateContext?: typeof validateInvestigationJobContext;
  claim?: typeof claimInvestigation;
  run?: typeof runInvestigation;
  fail?: typeof recordInvestigationFailure;
};

export async function validateInvestigationJobContext(
  client: PoolClient,
  job: InvestigationJob,
): Promise<void> {
  const result = await client.query(
    `SELECT 1
       FROM investigations i
       JOIN organization_memberships m
         ON m.organization_id = i.organization_id
        AND m.user_id = $3
      WHERE i.organization_id = $1
        AND i.id = $2
        AND i.status = 'queued'`,
    [job.organizationId, job.investigationId, job.requestedByUserId],
  );

  if (!result.rowCount) {
    throw Object.assign(new Error("Investigation job context is no longer valid"), {
      code: "INVESTIGATION_JOB_CONTEXT_INVALID",
    });
  }
}

export async function handleInvestigationJob(
  database: Database,
  job: InvestigationJob,
  dependencies: HandlerDependencies = {},
): Promise<"completed" | "duplicate"> {
  const validateContext = dependencies.validateContext ?? validateInvestigationJobContext;
  const claim = dependencies.claim ?? claimInvestigation;
  const run = dependencies.run ?? runInvestigation;
  const fail = dependencies.fail ?? recordInvestigationFailure;

  let incidentId: string;
  try {
    incidentId = await withTransaction(database, async client => {
      await validateContext(client, job);
      return claim(client, job.organizationId, job.investigationId);
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error &&
        error.code === "INVESTIGATION_NOT_RUNNABLE") {
      return "duplicate";
    }
    throw error;
  }

  try {
    await run(
      database,
      configuredAnalyzer(),
      job.organizationId,
      job.investigationId,
      incidentId,
      job.requestedByUserId,
    );
    return "completed";
  } catch (error) {
    await fail(
      database,
      job.organizationId,
      job.investigationId,
      job.requestedByUserId,
      incidentId,
      error,
    );
    throw error;
  }
}
