import { NextResponse } from "next/server";
import { inspectGitHub, inspectZip } from "../../../lib/source-inspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const limiter = new Map<string, { count: number; resetAt: number }>();
let globalWindow = { count: 0, resetAt: 0 };

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}

function rateLimited(request: Request): boolean {
  const now = Date.now();
  if (globalWindow.resetAt < now) globalWindow = { count: 0, resetAt: now + 60_000 };
  if (++globalWindow.count > 30) return true;
  if (limiter.size > 500) limiter.clear();
  const address = request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
  const existing = limiter.get(address);
  const window = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + 60_000 };
  window.count++;
  limiter.set(address, window);
  return window.count > 4;
}

async function readLimitedBody(request: Request): Promise<Buffer> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES + 4096) {
    throw new Error("Request exceeds the 5 MB limit.");
  }
  if (!request.body) throw new Error("Empty inspection request.");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES + 4096) throw new Error("Request exceeds the 5 MB limit.");
      parts.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(parts);
}

async function permitted(request: Request): Promise<boolean> {
  if (process.env.SENTINELOS_PREVIEW_MODE === "true") return true;
  const baseUrl = process.env.SENTINELOS_API_URL;
  const session = request.headers.get("cookie");
  if (!baseUrl || !session) return false;
  try {
    const response = await fetch(`${baseUrl}/v1/browser-auth/me`, {
      headers: { cookie: session }, cache: "no-store",
      signal: AbortSignal.timeout(4000)
    });
    return response.ok;
  } catch { return false; }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let matchesHost = false;
    try {
      const supplied = new URL(origin);
      const host = request.headers.get("host")?.toLowerCase();
      matchesHost = Boolean(host && (supplied.protocol === "http:" || supplied.protocol === "https:")
        && supplied.host.toLowerCase() === host);
    } catch { /* invalid Origin is rejected below */ }
    if (origin !== new URL(request.url).origin && !matchesHost) {
      return respond({ error: "Cross-origin inspections are not allowed." }, 403);
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return respond({ error: "Cross-site inspections are not allowed." }, 403);
  }
  if (!(await permitted(request))) {
    return respond({ error: "Sign in to inspect a source, or use the public preview." }, 401);
  }
  if (rateLimited(request)) {
    return respond({ error: "Inspection limit reached. Please retry in a minute." }, 429);
  }
  try {
    const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (type === "application/json") {
      const bytes = await readLimitedBody(request);
      if (bytes.length > 4096) return respond({ error: "Repository URL payload is too large." }, 413);
      let input: unknown;
      try { input = JSON.parse(bytes.toString("utf8")); } catch {
        return respond({ error: "Invalid JSON request." }, 400);
      }
      if (typeof input !== "object" || !input || !("url" in input) || typeof input.url !== "string" || input.url.length > 500) {
        return respond({ error: "Provide a public GitHub repository URL." }, 400);
      }
      const report = await inspectGitHub(input.url);
      return respond({ data: report });
    }
    if (type === "application/zip" || type === "application/x-zip-compressed") {
      const bytes = await readLimitedBody(request);
      const originalName = request.headers.get("x-source-filename") ?? "uploaded-source.zip";
      const name = originalName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 100);
      const report = inspectZip(bytes, name);
      return respond({ data: report });
    }
    return respond({ error: "Send a JSON GitHub URL or a ZIP archive." }, 415);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inspection failed.";
    if (/exceeds the 5 MB/i.test(message)) return respond({ error: message }, 413);
    if (/rate limit/i.test(message)) return respond({ error: message }, 429);
    if (/GitHub could not|fetch failed|timeout/i.test(message)) return respond({ error: "GitHub inspection is temporarily unavailable." }, 502);
    return respond({ error: message }, 400);
  }
}
