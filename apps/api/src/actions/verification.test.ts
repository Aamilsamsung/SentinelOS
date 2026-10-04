import { describe, expect, it } from "vitest";
import { evaluateVerification } from "./verification.js";

describe("post-action verification", () => {
  it("does not claim success without verification evidence", () => {
    expect(evaluateVerification([]).status).toBe("inconclusive");
  });

  it("fails when any required check fails", () => {
    const result = evaluateVerification([
      { name: "error-rate", passed: true, detail: "returned to baseline" },
      { name: "latency", passed: false, detail: "still elevated" }
    ]);
    expect(result.status).toBe("failed");
    expect(result.detail).toContain("still elevated");
  });

  it("passes only when all supplied checks pass", () => {
    expect(evaluateVerification([
      { name: "health", passed: true, detail: "healthy" },
      { name: "errors", passed: true, detail: "normal" }
    ]).status).toBe("passed");
  });
});
