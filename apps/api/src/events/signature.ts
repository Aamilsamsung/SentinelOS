import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhook(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const actual = Buffer.from(signWebhook(secret, timestamp, body), "hex");
  const supplied = Buffer.from(signature, "hex");
  return actual.length === supplied.length && timingSafeEqual(actual, supplied);
}

export function assertFreshTimestamp(timestamp: string, nowMs = Date.now(), toleranceMs = 300_000): void {
  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed) || Math.abs(nowMs - parsed) > toleranceMs) {
    throw Object.assign(new Error("Webhook timestamp outside allowed window"), {
      statusCode: 401,
      code: "STALE_WEBHOOK"
    });
  }
}
