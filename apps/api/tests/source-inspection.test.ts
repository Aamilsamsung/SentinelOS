import { afterEach, describe, expect, it, vi } from "vitest";
import { deflateRawSync } from "node:zlib";
import { createInspectionReport, inspectGitHub, inspectZip } from "../../web/lib/source-inspection";

function makeZip(files: Array<{ name: string; body: string; deflate?: boolean }>): Buffer {
  const chunks: Buffer[] = [];
  const records: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const filename = Buffer.from(file.name);
    const content = Buffer.from(file.body);
    const compressed = file.deflate ? deflateRawSync(content) : content;
    const method = file.deflate ? 8 : 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(filename.length, 26);
    chunks.push(local, filename, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    records.push(central, filename);
    offset += local.length + filename.length + compressed.length;
  }
  const dir = Buffer.concat(records);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(dir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, dir, eocd]);
}

afterEach(() => vi.unstubAllGlobals());

describe("source inspection", () => {
  it("inspects stored and deflated ZIP entries without running code", () => {
    const archive = makeZip([
      { name: "package.json", body: '{"scripts":{"test":"vitest"}}' },
      { name: "README.md", body: "Getting started" },
      { name: "src/index.ts", body: "export const ok = true; // TODO improve", deflate: true },
      { name: "src/index.test.ts", body: "it('works', () => {})" },
      { name: ".github/workflows/ci.yml", body: "name: CI" }
    ]);
    const report = inspectZip(archive, "project.zip");
    expect(report.kind).toBe("zip");
    expect(report.filesDiscovered).toBe(5);
    expect(report.filesInspected).toBe(5);
    expect(report.checks.every(check => check.passed)).toBe(true);
    expect(report.findings.some(finding => finding.title === "Outstanding work marker")).toBe(true);
  });

  it("flags authentication and API integration patterns without claiming live validation", () => {
    const files = [
      { path: "src/auth/google.ts", size: 200, content: 'const clientSecret = "actual-looking-example"; localStorage.setItem("access_token", token); // invalid_grant' },
      { path: "src/api/client.ts", size: 90, content: 'fetch("http://api.example.com/login")' }
    ];
    const report = createInspectionReport("zip", "example.zip", "sample", files, files);
    expect(report.findings.some(f => f.title === "Possible embedded authentication secret")).toBe(true);
    expect(report.findings.some(f => f.title === "Authentication token stored in browser storage")).toBe(true);
    expect(report.findings.some(f => f.title === "OAuth provider error reference")).toBe(true);
    expect(report.findings.some(f => f.title === "Unencrypted API request pattern")).toBe(true);
    expect(report.findings.every(f => !/confirmed live/i.test(f.detail))).toBe(true);
  });

  it("flags OAuth callback configuration and swallowed API failures as review items", () => {
    const files = [
      { path: "src/auth/google.ts", size: 300, content: 'const GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/callback"; verifyIdToken(token); const provider = "google";' },
      { path: "src/integrations/provider.ts", size: 100, content: 'try { await fetch(endpoint) } catch (error) {}' }
    ];
    const report = createInspectionReport("zip", "auth-review.zip", "sample", files, files);
    expect(report.findings.some(f => f.title === "Localhost OAuth callback or configuration")).toBe(true);
    expect(report.findings.some(f => f.title === "OAuth token validation configuration not evident")).toBe(true);
    expect(report.findings.some(f => f.title === "API errors may be silently ignored")).toBe(true);
    expect(report.findings.every(f => /review|not found|marker/i.test(f.title + " " + f.detail) || f.level !== "attention")).toBe(true);
  });

  it("marks large source samples as partial instead of claiming full coverage", () => {
    const archive = makeZip(Array.from({ length: 155 }, (_, index) => ({
      name: `src/file-${String(index).padStart(2, "0")}.ts`, body: "export const value = 1;"
    })));
    const report = inspectZip(archive, "large.zip");
    expect(report.filesDiscovered).toBe(155);
    expect(report.filesInspected).toBe(128);
    expect(report.partial).toBe(true);
  });

  it("refuses malformed archives and skips traversal entries", () => {
    expect(() => inspectZip(Buffer.from("not-a-zip"), "bad.zip")).toThrow(/ZIP/);
    const archive = makeZip([{ name: "../outside.ts", body: "eval('unsafe')" }, { name: "src/normal.ts", body: "export {}" }]);
    const report = inspectZip(archive, "safe.zip");
    expect(report.filesDiscovered).toBe(1);
    expect(report.sampledPaths).toEqual(["src/normal.ts"]);
  });

  it("allows only public GitHub root URLs, not arbitrary server URLs", async () => {
    await expect(inspectGitHub("http://localhost:4000/admin")).rejects.toThrow(/github/i);
    await expect(inspectGitHub("https://github.com/test/project/tree/main")).rejects.toThrow(/root URL/);
    await expect(inspectGitHub("https://github.com.evil.example/test/repo")).rejects.toThrow(/github/i);
  });

  it("checks public GitHub tree structure and only approved raw paths", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "https://api.github.com/repos/demo/sample") {
        return new Response(JSON.stringify({ default_branch: "main", private: false, full_name: "demo/sample" }), { status: 200 });
      }
      if (url.startsWith("https://api.github.com/repos/demo/sample/git/trees/")) {
        return new Response(JSON.stringify({ tree: [
          { type: "blob", path: "README.md", size: 30 },
          { type: "blob", path: "package.json", size: 30 },
          { type: "blob", path: "src/app.ts", size: 30 }
        ], truncated: false }), { status: 200 });
      }
      if (url.startsWith("https://raw.githubusercontent.com/demo/sample/main/")) {
        return new Response("export const sample = true;");
      }
      throw new Error("Unexpected outbound URL: " + url);
    });
    vi.stubGlobal("fetch", fetchMock);
    const report = await inspectGitHub("https://github.com/demo/sample");
    expect(report.kind).toBe("github");
    expect(report.filesDiscovered).toBe(3);
    expect(report.filesInspected).toBe(3);
    expect(report.checks.find(check => check.label === "Documentation")?.passed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
