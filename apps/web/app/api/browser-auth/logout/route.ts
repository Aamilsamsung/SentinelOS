import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const baseUrl = process.env.SENTINELOS_API_URL;
  if (!baseUrl) return NextResponse.json({ error: "API is not configured" }, { status: 503 });
  const csrfHeader = request.headers.get("x-csrf-token");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const csrfCookie = cookieHeader.split(";").map((value) => value.trim()).find((value) => value.startsWith("sentinelos_csrf="))?.slice("sentinelos_csrf=".length);
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }
  const upstream = await fetch(`${baseUrl}/v1/browser-auth/logout`, {
    method: "POST",
    headers: { cookie: cookieHeader, "x-csrf-token": csrfHeader },
    cache: "no-store"
  });
  const payload = await upstream.text();
  const response = new NextResponse(payload, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" }
  });
  const setCookies = upstream.headers.getSetCookie();
  for (const value of setCookies) response.headers.append("set-cookie", value);
  return response;
}
