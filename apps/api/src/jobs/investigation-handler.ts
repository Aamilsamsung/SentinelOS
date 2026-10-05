import type { Database } from "../db/database.js";
import { withTransaction } from "../db/transaction.js";
import { configuredAnalyzer } from "../investigations/analyzer.js";
import { recordInvestigationFailure } from "../investigations/failure.js";
import { runInvestigation } from "../investigations/orchestrator.js";
import { claimInvestigation } from "../investigations/repository.js";
import type { InvestigationJob } from "./types.js";

type HandlerDependencies = {
  claim?: typeof claimInvestigation;
  run?: typeof runInvestigation;
  fail?: typeof recordInvestigationFailure;
};

export async function handleInvestigationJob(
  database: Database,
  job: InvestigationJob,
  dependencies: HandlerDependencies = {},
): Promise<"completed" | "duplicate"> {
  const claim = dependencies.claim ?? claimInvestigation;
  const run = dependencies.run ?? runInvestigation;
  const fail = dependencies.fail ?? recordInvestigationFailure;

  let incidentId: string;
  try {
    incidentId = await withTransaction(database, client =>
      claim(client, job.organizationId, job.investigationId)
    );
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
