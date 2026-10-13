import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const forbiddenHost = /(^|\.)(localhost|local|internal|test|invalid|example|onion)$|\.localhost$/i;
function publicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split(".").map(Number);
    return !(p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && (p[1] === 168 || p[1] === 0)) ||
      (p[0] === 198 && (p[1] === 18 || p[1] === 19)) ||
      (p[0] === 198 && p[1] === 51 && p[2] === 100) ||
      (p[0] === 203 && p[1] === 0 && p[2] === 113));
  }
  if (isIP(ip) === 6) {
    const x = ip.toLowerCase();
    return !(x === "::" || x === "::1" || x.startsWith("fc") || x.startsWith("fd") ||
      /^fe[89ab]/.test(x) || x.startsWith("ff") || x.startsWith("2001:db8:") ||
      x.startsWith("::ffff:"));
  }
  return false;
}
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}
export async function POST(request: Request) {
  // Disabled until authenticated ownership checks and network-level egress filtering exist.
  if (process.env.SENTINELOS_WEBSITE_CHECK_ENABLED !== "true") {
    return json({ error: "Website checking is unavailable until target verification and network protections are configured." }, 503);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Cross-origin requests are not allowed." }, 403);
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return json({ error: "Cross-site requests are not allowed." }, 403);
  let input: unknown;
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) return json({ error: "Request too large." }, 413);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: "Request too large." }, 413);
    input = JSON.parse(raw);
  } catch { return json({ error: "Invalid request." }, 400); }
  const value = typeof input === "object" && input !== null && "url" in input ? (input as { url: unknown }).url : null;
  if (typeof value !== "string" || value.length > 500) return json({ error: "Provide a website URL." }, 400);
  let target: URL;
  try { target = new URL(value); } catch { return json({ error: "Invalid URL." }, 400); }
  if (target.protocol !== "https:" || target.port || target.username || target.password ||
    target.hostname.length > 253 || forbiddenHost.test(target.hostname) || isIP(target.hostname)) {
    return json({ error: "Only public HTTPS hostnames on port 443 are supported." }, 400);
  }
  // Defense in depth: DNS validation alone does not pin the resolved address. This
  // preview intentionally performs only a bounded passive HEAD request; a
  // production active scanner must use an egress proxy with IP-level filtering.
  try {
    const resolved = await lookup(target.hostname, { all: true });
    if (!resolved.length || resolved.some(x => !publicAddress(x.address))) return json({ error: "Private or reserved network targets are blocked." }, 400);
    const response = await fetch(target.origin + "/", {
      method: "HEAD", redirect: "manual", cache: "no-store",
      headers: { "user-agent": "SentinelOS-Passive-Website-Check/1.0" },
      signal: AbortSignal.timeout(7000)
    });
    const checks = [
      { name: "HTTPS", passed: true, detail: "The endpoint was contacted over HTTPS." },
      { name: "Content-Security-Policy", passed: response.headers.has("content-security-policy"), detail: "Browser content policy header." },
      { name: "Strict-Transport-Security", passed: response.headers.has("strict-transport-security"), detail: "HTTPS enforcement header." },
      { name: "X-Content-Type-Options", passed: response.headers.get("x-content-type-options")?.toLowerCase() === "nosniff", detail: "MIME sniffing protection." },
      { name: "Referrer-Policy", passed: response.headers.has("referrer-policy"), detail: "Referrer information controls." }
    ];
    return json({ data: {
      url: target.origin, status: response.status, redirect: response.headers.get("location") !== null,
      checks, checkedAt: new Date().toISOString(),
      scope: "Passive response-header check only. No authentication, crawling, exploitation, or vulnerability confirmation."
    } });
  } catch {
    return json({ error: "Website could not be reached or timed out. No security conclusion can be drawn." }, 502);
  }
}
