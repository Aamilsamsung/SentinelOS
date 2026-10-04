import { describe, expect, it } from "vitest";
import { impactedServices } from "./graph.js";

describe("service dependency topology", () => {
  it("finds transitive downstream impact", () => {
    expect(impactedServices("api", [
      { upstream: "api", downstream: "checkout" },
      { upstream: "checkout", downstream: "payments" },
      { upstream: "search", downstream: "catalog" }
    ])).toEqual(["checkout", "payments"]);
  });

  it("terminates safely when the graph contains a cycle", () => {
    expect(impactedServices("a", [
      { upstream: "a", downstream: "b" },
      { upstream: "b", downstream: "a" }
    ])).toEqual(["b"]);
  });
});
