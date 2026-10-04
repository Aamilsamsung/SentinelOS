import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ actionId: string }> }) {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const organizationId = process.env.SENTINELOS_ORGANIZATION_ID;
  const token = process.env.SENTINELOS_SESSION_TOKEN;
  if (!baseUrl || !organizationId || !token) {
    return NextResponse.json({ error: "SentinelOS API is not configured" }, { status: 503 });
  }

  const { actionId } = await context.params;
  const body = await request.text();
  const upstream = await fetch(`${baseUrl}/v1/actions/${encodeURIComponent(actionId)}/transitions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "x-organization-id": organizationId,
      "content-type": "application/json"
    },
    body,
    cache: "no-store"
  });
  const payload = await upstream.text();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" }
  });
}
