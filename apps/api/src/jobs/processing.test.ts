import { describe, expect, it, vi } from "vitest";
import { nextAttempt, parseSerializedJob } from "./types.js";

const serialized = JSON.stringify({
  version: 1,
  type: "investigation.run",
  jobId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  investigationId: "33333333-3333-4333-8333-333333333333",
  requestedByUserId: "44444444-4444-4444-8444-444444444444",
  enqueuedAt: "2026-10-05T15:00:00.000Z",
  it("moves exhausted work to a dead-letter queue instead of retrying forever", async () => {
    const client = { lRem: vi.fn().mockResolvedValue(1), rPush: vi.fn().mockResolvedValue(1) };
    const job = parseSerializedJob(serialized);
    const exhausted = nextAttempt(nextAttempt(nextAttempt(job)));
    await client.lRem("sentinelos:jobs:processing", 1, serialized);
    await client.rPush("sentinelos:jobs:dead", JSON.stringify(exhausted));
    expect(exhausted.attempt).toBe(3);
    expect(client.rPush).toHaveBeenCalledWith("sentinelos:jobs:dead", expect.stringContaining('"attempt":3'));
  });
});

async function acknowledge(client: { lRem: Function }, processingQueue: string, raw: string) {
  await client.lRem(processingQueue, 1, raw);
}

async function retry(client: { lRem: Function; rPush: Function }, readyQueue: string, processingQueue: string, raw: string) {
  await client.lRem(processingQueue, 1, raw);
  await client.rPush(readyQueue, raw);
}

describe("worker processing queue semantics", () => {
  it("keeps a valid job parseable while it is in-flight", () => {
    expect(parseSerializedJob(serialized).jobId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("acknowledges completed work by removing the exact in-flight payload", async () => {
    const client = { lRem: vi.fn().mockResolvedValue(1) };
    await acknowledge(client, "sentinelos:jobs:processing", serialized);
    expect(client.lRem).toHaveBeenCalledWith("sentinelos:jobs:processing", 1, serialized);
  });

  it("moves failed work back to the ready queue instead of dropping it", async () => {
    const client = {
      lRem: vi.fn().mockResolvedValue(1),
      rPush: vi.fn().mockResolvedValue(1),
    };
    await retry(client, "sentinelos:jobs", "sentinelos:jobs:processing", serialized);
    expect(client.lRem).toHaveBeenCalledWith("sentinelos:jobs:processing", 1, serialized);
    expect(client.rPush).toHaveBeenCalledWith("sentinelos:jobs", serialized);
  });
});
