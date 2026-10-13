import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createInspectionReport } from "./source-inspection";

describe("source inspection coverage", () => {
  it("marks reports partial when inspection is incomplete", () => {
    const allFiles = [
      { path: "package.json", size: 20 },
      { path: "src/auth.ts", size: 50 }
    ];
    const sampled = [{ ...allFiles[0], content: '{"name":"test"}' }];
    const report = createInspectionReport("zip", "sample.zip", "uploaded", allFiles, sampled, true);
    assert.equal(report.partial, true);
    assert.equal(report.filesDiscovered, 2);
    assert.equal(report.filesInspected, 1);
    assert.deepEqual(report.sampledPaths, ["package.json"]);
  });

  it("never treats unsampled source as inspected", () => {
    const allFiles = [{ path: "src/auth.ts", size: 1024 }];
    const report = createInspectionReport("github", "example", "github", allFiles, [], true);
    assert.equal(report.filesDiscovered, 1);
    assert.equal(report.filesInspected, 0);
    expect(report.partial).toBe(true);
  });
});
