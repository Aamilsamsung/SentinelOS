import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
function cookie(header: string, key: string): string | undefined {
  return header.split(";").map(s => s.trim()).find(s => s.startsWith(key + "="))?.slice(key.length + 1);
}
function deny(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}
export async function PUT(request: Request, context: { params: Promise<{ integrationId: string }> }) {
  if (process.env.SENTINELOS_PREVIEW_MODE === "true") return deny("Credentials cannot be saved in the public preview.", 503);
  const base = process.env.SENTINELOS_API_URL;
  if (!base) return deny("Integration API is not configured.", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return deny("Cross-origin request blocked.", 403);
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return deny("Cross-site request blocked.", 403);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return deny("JSON content type required.", 415);
  const cookies = request.headers.get("cookie") ?? "";
  const token = cookie(cookies, "sentinelos_session");
  const org = cookie(cookies, "sentinelos_organization");
  const csrf = cookie(cookies, "sentinelos_csrf");
  if (!token || !org) return deny("Sign in to configure a connection.", 401);
  if (!csrf || csrf !== request.headers.get("x-csrf-token")) return deny("Session verification failed.", 403);
  const { integrationId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(integrationId)) return deny("Invalid integration identifier.", 400);
  let body: unknown;
  try { body = await request.json(); } catch { return deny("Invalid JSON request.", 400); }
  const secret = body && typeof body === "object" && "credential" in body ? (body as { credential?: unknown }).credential : null;
  if (typeof secret !== "string" || secret.length < 1 || secret.length > 20000) return deny("Credential must be between 1 and 20000 characters.", 400);
  try {
    const response = await fetch(`${base}/v1/integrations/${encodeURIComponent(integrationId)}/credential`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": org, "content-type": "application/json" },
      body: JSON.stringify({ credential: secret }),
      cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    if (response.status === 204) return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
    return new NextResponse(await response.text(), { status: response.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch { return deny("Credential service is unavailable.", 502); }
}
