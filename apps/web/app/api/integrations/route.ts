import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readCookie(header: string, name: string): string | undefined {
  return header.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="))?.slice(name.length + 1);
}
function context(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  const token = readCookie(cookies, "sentinelos_session");
  const organizationId = readCookie(cookies, "sentinelos_organization");
  return token && organizationId ? { cookies, token, organizationId } : null;
}
function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}
function validateWrite(request: Request, cookies: string): string | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return "Cross-origin requests are not permitted.";
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return "Cross-site requests are not permitted.";
  const csrf = readCookie(cookies, "sentinelos_csrf");
  if (!csrf || csrf !== request.headers.get("x-csrf-token")) return "Session verification failed.";
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return "JSON content type required.";
  return null;
}
export async function GET(request: Request) {
  if (process.env.SENTINELOS_PREVIEW_MODE === "true") return fail("Live integrations are disabled in the public preview.", 503);
  const base = process.env.SENTINELOS_API_URL;
  const auth = context(request);
  if (!base) return fail("Integration API not configured.", 503);
  if (!auth) return fail("Sign in to view your integrations.", 401);
  try {
    const upstream = await fetch(`${base}/v1/integrations`, {
      headers: { authorization: `Bearer ${auth.token}`, "x-organization-id": auth.organizationId },
      cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    return new NextResponse(await upstream.text(), { status: upstream.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch { return fail("Integration service unavailable.", 502); }
}
export async function POST(request: Request) {
  if (process.env.SENTINELOS_PREVIEW_MODE === "true") return fail("Live integrations are disabled in the public preview.", 503);
  const base = process.env.SENTINELOS_API_URL;
  const auth = context(request);
  if (!base) return fail("Integration API not configured.", 503);
  if (!auth) return fail("Sign in to create an integration.", 401);
  const rejected = validateWrite(request, auth.cookies);
  if (rejected) return fail(rejected, rejected.includes("JSON") ? 415 : 403);
  try {
    const body = await request.text();
    if (body.length > 4096) return fail("Integration settings are too large.", 413);
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { return fail("Invalid settings.", 400); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("Invalid settings.", 400);
    const entry = parsed as Record<string, unknown>;
    if (!["github","generic_webhook","prometheus","sentry"].includes(String(entry.provider))
      || typeof entry.name !== "string" || entry.name.trim().length < 1 || entry.name.trim().length > 120) {
      return fail("Select a supported provider and enter a name.", 400);
    }
    const upstream = await fetch(`${base}/v1/integrations`, {
      method: "POST",
      headers: { authorization: `Bearer ${auth.token}`, "x-organization-id": auth.organizationId, "content-type": "application/json" },
      body: JSON.stringify({ provider: entry.provider, name: entry.name.trim(), configuration: {} }),
      cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    return new NextResponse(await upstream.text(), { status: upstream.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch { return fail("Integration service unavailable.", 502); }
}
