import { describe, expect, it, vi } from "vitest";
import { createInvestigationJob, enqueueInvestigationJob } from "./queue.js";

const input = {
  organizationId: "22222222-2222-4222-8222-222222222222",
  investigationId: "33333333-3333-4333-8333-333333333333",
  requestedByUserId: "44444444-4444-4444-8444-444444444444",
};

describe("investigation queue", () => {
  it("creates a deterministic validated job when clock and id are supplied", () => {
    expect(createInvestigationJob(
      input,
      new Date("2026-10-05T13:43:00.000Z"),
      "11111111-1111-4111-8111-111111111111",
    )).toEqual({
      version: 1,
      type: "investigation.run",
      jobId: "11111111-1111-4111-8111-111111111111",
      ...input,
      enqueuedAt: "2026-10-05T13:43:00.000Z",
      attempt: 0,
    });
  });

  it("pushes only the validated serialized job to the configured queue", async () => {
    const rPush = vi.fn().mockResolvedValue(1);
    const job = await enqueueInvestigationJob({ rPush } as never, input, "test:jobs");

    expect(rPush).toHaveBeenCalledOnce();
    expect(rPush).toHaveBeenCalledWith("test:jobs", JSON.stringify(job));
  });

  it("does not push invalid tenant context", async () => {
    const rPush = vi.fn();
    await expect(enqueueInvestigationJob(
      { rPush } as never,
      { ...input, organizationId: "not-an-org" },
    )).rejects.toThrow();
    expect(rPush).not.toHaveBeenCalled();
  });
});
