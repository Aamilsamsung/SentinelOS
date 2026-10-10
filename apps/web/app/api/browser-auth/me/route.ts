import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const baseUrl = process.env.SENTINELOS_API_URL;
  if (!baseUrl) return NextResponse.json({ error: "API is not configured" }, { status: 503 });
  const upstream = await fetch(`${baseUrl}/v1/browser-auth/me`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store"
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store" }
  });
}
