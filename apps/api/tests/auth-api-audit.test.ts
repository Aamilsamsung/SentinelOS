import { describe, expect, it } from "vitest";
import { auditAuthApiSource } from "../../web/lib/auth-api-audit";
import { createInspectionReport } from "../../web/lib/source-inspection";

describe("authentication and API integration source audit", () => {
  it("flags unsafe Google OAuth authorization and callback patterns with locations", () => {
    const start = auditAuthApiSource("src/auth/google.ts",
      'const authorize = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code";');
    expect(start).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "OAuth authorization state not evident", category: "oauth", line: 1 })
    ]));
    const callback = auditAuthApiSource("src/auth/callback.ts",
      'const code = searchParams.get("code");');
    expect(callback.some(f => f.title === "OAuth callback state validation not evident")).toBe(true);
    const safe = auditAuthApiSource("src/auth/callback.ts",
      'const code = searchParams.get("code"); verifyState(searchParams.get("state"));');
    expect(safe.some(f => f.title === "OAuth callback state validation not evident")).toBe(false);
  });

  it("flags public client secrets and URL credential leaks without returning secret values", () => {
    const source = 'const key = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;\nconst target = "/login?access_token=super-secret-value";';
    const issues = auditAuthApiSource("src/auth/login.ts", source);
    expect(issues.some(f => f.title === "Potentially public OAuth/API secret" && f.level === "attention")).toBe(true);
    expect(issues.some(f => f.title === "Sensitive credential in URL pattern" && f.line === 2)).toBe(true);
    expect(JSON.stringify(issues)).not.toContain("super-secret-value");
  });

  it("flags opaque fetch and insecure API endpoints", () => {
    const issues = auditAuthApiSource("src/api/provider.ts",
      'const baseURL = "http://api.example.com";\nfetch(endpoint, { mode: "no-cors" });');
    expect(issues.some(f => f.title === "Plaintext API base URL")).toBe(true);
    expect(issues.some(f => f.title === "Opaque API response mode")).toBe(true);
  });

  it("flags missing webhook verification and swallowed login errors", () => {
    const webhook = auditAuthApiSource("src/api/webhooks/stripe.ts",
      'export async function POST(request: Request) { await processEvent(request); }');
    expect(webhook.some(f => f.title === "Webhook signature verification not evident")).toBe(true);
    const auth = auditAuthApiSource("src/auth/session.ts", "try { await signIn() } catch (err) {}");
    expect(auth.some(f => f.title === "Authentication error may be swallowed")).toBe(true);
  });

  it("avoids test/example files and avoids claiming runtime failures", () => {
    expect(auditAuthApiSource("tests/auth.test.ts", 'const baseURL = "http://api.example.com";')).toEqual([]);
    const files = [
      { path: "src/auth/google.ts", size: 100, content: 'const authorize = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code";' },
      { path: "src/api/provider.ts", size: 100, content: 'fetch(url, { mode: "no-cors" });' }
    ];
    const report = createInspectionReport("zip", "test.zip", "test", files, files);
    expect(report.findings.some(f => f.category === "oauth" && f.recommendation && f.line === 1)).toBe(true);
    expect(report.findings.some(f => f.category === "api")).toBe(true);
    expect(report.findings.every(f => !/confirmed vulnerability|confirmed runtime failure/i.test(f.detail))).toBe(true);
  });
});
