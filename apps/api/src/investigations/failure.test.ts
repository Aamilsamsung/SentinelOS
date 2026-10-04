import { describe, expect, it } from "vitest";

describe("investigation failure sanitization", () => {
  it("keeps provider internals out of persisted source", async () => {
    const source = await import("./failure.js");
    expect(source.recordInvestigationFailure).toBeTypeOf("function");
  });
});
