import { describe, expect, it } from "vitest";
import { createInspectionReport } from "./source-inspection";

describe("source inspection coverage", () => {
  it("marks reports partial when inspection is incomplete", () => {
    const allFiles = [
      { path: "package.json", size: 20 },
      { path: "src/auth.ts", size: 50 }
    ];
    const sampled = [{ ...allFiles[0], content: '{"name":"test"}' }];
    const report = createInspectionReport("zip", "sample.zip", "uploaded", allFiles, sampled, true);
    expect(report.partial).toBe(true);
    expect(report.filesDiscovered).toBe(2);
    expect(report.filesInspected).toBe(1);
    expect(report.sampledPaths).toEqual(["package.json"]);
  });

  it("never treats unsampled source as inspected", () => {
    const allFiles = [{ path: "src/auth.ts", size: 1024 }];
    const report = createInspectionReport("github", "example", "github", allFiles, [], true);
    expect(report.filesDiscovered).toBe(1);
    expect(report.filesInspected).toBe(0);
    expect(report.partial).toBe(true);
  });
});
