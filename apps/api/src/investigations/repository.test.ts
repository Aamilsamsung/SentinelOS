import { describe, expect, it, vi } from "vitest";
import { startInvestigation } from "./repository.js";

describe("startInvestigation", () => {
  it("returns a controlled conflict when an active investigation already exists", async () => {
    const client = {
      query: vi.fn().mockRejectedValue({ code: "23505" })
    };
    await expect(startInvestigation(client as never, "org", "incident", "user"))
      .rejects.toMatchObject({ statusCode: 409, code: "INVESTIGATION_ALREADY_ACTIVE" });
  });

  it("does not hide unrelated database errors", async () => {
    const failure = new Error("database unavailable");
    const client = { query: vi.fn().mockRejectedValue(failure) };
    await expect(startInvestigation(client as never, "org", "incident", "user")).rejects.toBe(failure);
  });
});
