import { createHmac, timingSafeEqual } from "node:crypto";

type ProofPayload = { userId: string; email: string; exp: number };

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function signBrowserProof(payload: ProofPayload, secret: string): string {
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyBrowserProof(token: string, secret: string, now = Date.now()): ProofPayload | null {
  const [body, supplied, extra] = token.split(".");
  if (!body || !supplied || extra) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let actual: Buffer;
  try { actual = Buffer.from(supplied, "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ProofPayload;
    if (!payload.userId || !payload.email || !Number.isFinite(payload.exp) || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
