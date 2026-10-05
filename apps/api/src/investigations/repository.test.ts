import { describe, expect, it, vi } from "vitest";
import { claimInvestigation, startInvestigation } from "./repository.js";

describe("investigation repository concurrency", () => {
  it("returns a controlled conflict when an active investigation already exists", async () => {
    const client = { query: vi.fn().mockRejectedValue({ code: "23505" }) };
    await expect(startInvestigation(client as never, "org", "incident", "user"))
      .rejects.toMatchObject({ statusCode: 409, code: "INVESTIGATION_ALREADY_ACTIVE" });
  });

  it("does not hide unrelated database errors", async () => {
    const failure = new Error("database unavailable");
    const client = { query: vi.fn().mockRejectedValue(failure) };
    await expect(startInvestigation(client as never, "org", "incident", "user")).rejects.toBe(failure);
  });

  it("claims a queued investigation exactly once", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rowCount: 1, rows: [{ incident_id: "incident" }] }) };
    await expect(claimInvestigation(client as never, "org", "investigation")).resolves.toBe("incident");
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("status = 'queued'"), ["org", "investigation"]);
  });

  it("rejects a second claim after another worker owns the investigation", async () => {
    const client = { query: vi.fn().mockResolvedValueOnce({ rowCount: 0, rows: [] }) };
    await expect(claimInvestigation(client as never, "org", "investigation"))
      .rejects.toMatchObject({ statusCode: 409, code: "INVESTIGATION_NOT_RUNNABLE" });
  });
});
