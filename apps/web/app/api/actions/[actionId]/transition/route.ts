import { NextResponse } from "next/server";

function cookie(header: string | null, name: string): string | undefined {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="))?.slice(name.length + 1);
}

export async function POST(request: Request, context: { params: Promise<{ actionId: string }> }) {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const cookies = request.headers.get("cookie");
  const organizationId = cookie(cookies, "sentinelos_organization");
  const token = cookie(cookies, "sentinelos_session");
  const csrf = cookie(cookies, "sentinelos_csrf");
  const suppliedCsrf = request.headers.get("x-csrf-token");
  if (!csrf || !suppliedCsrf || csrf !== suppliedCsrf) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }
  if (!baseUrl || !organizationId || !token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
