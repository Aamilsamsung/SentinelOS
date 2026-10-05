import { describe, expect, it, vi } from "vitest";
import { recoverInFlightJobs } from "./recovery.js";

describe("in-flight job recovery", () => {
  it("returns stranded jobs to the ready queue until processing is empty", async () => {
    const rPopLPush = vi.fn()
      .mockResolvedValueOnce("job-2")
      .mockResolvedValueOnce("job-1")
      .mockResolvedValueOnce(null);

    await expect(recoverInFlightJobs(
      { rPopLPush },
      "sentinelos:jobs",
      "sentinelos:jobs:processing",
    )).resolves.toBe(2);

    expect(rPopLPush).toHaveBeenCalledTimes(3);
    expect(rPopLPush).toHaveBeenCalledWith("sentinelos:jobs:processing", "sentinelos:jobs");
  });

  it("bounds startup recovery work", async () => {
    const rPopLPush = vi.fn().mockResolvedValue("job");
    await expect(recoverInFlightJobs(
      { rPopLPush },
      "ready",
      "processing",
      3,
    )).resolves.toBe(3);
    expect(rPopLPush).toHaveBeenCalledTimes(3);
  });
});
