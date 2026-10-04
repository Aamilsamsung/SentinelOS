import { describe, expect, it } from "vitest";
import { validateFindings } from "./findings.js";

describe("validateFindings", () => {
  it("accepts an evidence-backed hypothesis", () => {
    const result = validateFindings([{ type:"hypothesis", title:"DB saturation", detail:"Latency aligns with DB pressure", confidence:.7, evidenceIds:["metric:1"] }], new Set(["metric:1"]));
    expect(result).toHaveLength(1);
  });

  it("rejects fabricated evidence references", () => {
    expect(() => validateFindings([{ type:"observation", title:"Error", detail:"Observed error", confidence:1, evidenceIds:["log:fake"] }], new Set(["log:real"]))).toThrow("unknown evidence");
  });

  it("requires every finding type to cite evidence", () => {
    for (const type of ["observation","hypothesis","recommendation"] as const) {
      expect(() => validateFindings([{ type, title:"Finding", detail:"Detail", confidence:.5, evidenceIds:[] }], new Set(["log:1"]))).toThrow("All investigation findings require evidence");
    }
  });
});
