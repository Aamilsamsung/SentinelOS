import { describe, expect, it, vi } from "vitest";
import { recordInvestigationFailure } from "./failure.js";

function fakeDatabase() {
  const query = vi.fn(async () => ({ rowCount: 1, rows: [] }));
  return {
    query,
    connect: vi.fn(async () => ({ query, release: vi.fn() }))
  } as any;
}

describe("investigation failure sanitization", () => {
  it("does not persist raw provider or secret-bearing error details", async () => {
    const database = fakeDatabase();
    const raw = "provider rejected sk-live-super-secret at https://internal.example/v1";
    await recordInvestigationFailure(
      database, "org-a", "inv-1", "user-1", "incident-1", new Error(raw)
    );

    const serializedCalls = JSON.stringify(database.connect.mock.results.length);
    expect(serializedCalls).not.toContain(raw);

    const client = await database.connect.mock.results[0].value;
    const calls = client.query.mock.calls;
    const failedUpdate = calls.find(([sql]: [string]) => sql.includes("SET status = 'failed'"));
    const auditInsert = calls.find(([sql]: [string]) => sql.includes("INSERT INTO audit_events"));

    expect(failedUpdate?.[1]?.[2]).toBe("investigation processing failed");
    expect(JSON.stringify(auditInsert?.[1])).not.toContain("sk-live-super-secret");
    expect(JSON.stringify(auditInsert?.[1])).not.toContain("internal.example");
    expect(JSON.stringify(auditInsert?.[1])).toContain("INVESTIGATION_FAILED");
  });

  it("maps analyzer timeout to a safe stable failure", async () => {
    const database = fakeDatabase();
    await recordInvestigationFailure(
      database, "org-a", "inv-2", "user-1", "incident-1",
      new Error("Investigation analyzer timed out")
    );
    const client = await database.connect.mock.results[0].value;
    const calls = client.query.mock.calls;
    const failedUpdate = calls.find(([sql]: [string]) => sql.includes("SET status = 'failed'"));
    expect(failedUpdate?.[1]?.[2]).toBe("investigation analyzer timed out");
  });
});
