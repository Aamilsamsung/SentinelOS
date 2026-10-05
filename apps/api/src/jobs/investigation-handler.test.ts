import { describe, expect, it, vi } from "vitest";
import { handleInvestigationJob } from "./investigation-handler.js";
import type { InvestigationJob } from "./types.js";

const job: InvestigationJob = {
  version: 1,
  type: "investigation.run",
  jobId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  investigationId: "33333333-3333-4333-8333-333333333333",
  requestedByUserId: "44444444-4444-4444-8444-444444444444",
  enqueuedAt: "2026-10-05T14:00:00.000Z",
};

function database() {
  const query = vi.fn(async (sql: string) => {
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rowCount: 0, rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });
  return { query, connect: vi.fn(async () => ({ query, release: vi.fn() })) } as any;
}

describe("investigation worker handler", () => {
  it("claims then runs using the tenant-scoped job context", async () => {
    const claim = vi.fn().mockResolvedValue("55555555-5555-4555-8555-555555555555");
    const run = vi.fn().mockResolvedValue({ findings: [], evidenceCount: 1 });
    const fail = vi.fn();

    await expect(handleInvestigationJob(database(), job, { claim, run, fail })).resolves.toBe("completed");
    expect(claim).toHaveBeenCalledWith(expect.anything(), job.organizationId, job.investigationId);
    expect(run).toHaveBeenCalledWith(
      expect.anything(), expect.anything(), job.organizationId, job.investigationId,
      "55555555-5555-4555-8555-555555555555", job.requestedByUserId,
    );
    expect(fail).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate job without running the investigation", async () => {
    const claim = vi.fn().mockRejectedValue(Object.assign(new Error("not runnable"), {
      code: "INVESTIGATION_NOT_RUNNABLE",
    }));
    const run = vi.fn();

    await expect(handleInvestigationJob(database(), job, { claim, run })).resolves.toBe("duplicate");
    expect(run).not.toHaveBeenCalled();
  });

  it("records a failure after a successful claim and rethrows", async () => {
    const claim = vi.fn().mockResolvedValue("55555555-5555-4555-8555-555555555555");
    const failure = new Error("provider secret must not persist");
    const run = vi.fn().mockRejectedValue(failure);
    const fail = vi.fn().mockResolvedValue(undefined);

    await expect(handleInvestigationJob(database(), job, { claim, run, fail })).rejects.toThrow(failure);
    expect(fail).toHaveBeenCalledWith(
      expect.anything(), job.organizationId, job.investigationId, job.requestedByUserId,
      "55555555-5555-4555-8555-555555555555", failure,
    );
  });
});
