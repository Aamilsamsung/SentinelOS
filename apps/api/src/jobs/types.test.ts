import { describe, expect, it } from "vitest";
import { nextAttempt, parseSerializedJob } from "./types.js";

const validJob = {
  version: 1,
  type: "investigation.run",
  jobId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  investigationId: "33333333-3333-4333-8333-333333333333",
  requestedByUserId: "44444444-4444-4444-8444-444444444444",
  enqueuedAt: "2026-10-05T13:35:00.000Z",
};

describe("investigation queue job contract", () => {
  it("accepts a versioned, tenant-scoped investigation job", () => {
    expect(parseSerializedJob(JSON.stringify(validJob))).toEqual({ ...validJob, attempt: 0 });
  });

  it.each([
    ["invalid JSON", "{"],
    ["unknown job type", JSON.stringify({ ...validJob, type: "shell.execute" })],
    ["missing organization", JSON.stringify((({ organizationId: _omit, ...job }) => job)(validJob))],
    ["invalid investigation id", JSON.stringify({ ...validJob, investigationId: "inv-1" })],
    ["unexpected fields", JSON.stringify({ ...validJob, command: "rm -rf /" })],
  ])("rejects %s", (_label, serialized) => {
    expect(() => parseSerializedJob(serialized)).toThrow();
  });
  it("increments retry attempts without mutating job identity", () => {
    const job = parseSerializedJob(JSON.stringify({
      version: 1, type: "investigation.run",
      jobId: "11111111-1111-4111-8111-111111111111",
      organizationId: "22222222-2222-4222-8222-222222222222",
      investigationId: "33333333-3333-4333-8333-333333333333",
      requestedByUserId: "44444444-4444-4444-8444-444444444444",
      enqueuedAt: "2026-10-05T15:00:00.000Z"
    }));
    expect(job.attempt).toBe(0);
    const retried = nextAttempt(job);
    expect(retried.attempt).toBe(1);
    expect(retried.jobId).toBe(job.jobId);
  });
});
