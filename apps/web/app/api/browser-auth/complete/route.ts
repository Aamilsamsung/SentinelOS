import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const baseUrl = process.env.SENTINELOS_API_URL;
  if (!baseUrl) return NextResponse.json({ error: "API is not configured" }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin authentication request rejected" }, { status: 403 });
  }
  const upstream = await fetch(`${baseUrl}/v1/browser-auth/complete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
    cache: "no-store"
  });
  const response = new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store" }
  });
  for (const value of upstream.headers.getSetCookie()) response.headers.append("set-cookie", value);
  return response;
}
