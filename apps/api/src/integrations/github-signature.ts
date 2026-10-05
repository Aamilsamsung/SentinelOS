import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGitHubWebhookSignature(secret: string, rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader.startsWith("sha256=")) return false;
  const signature = signatureHeader.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
