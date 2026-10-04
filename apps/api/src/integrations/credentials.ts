import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw Object.assign(new Error("Credential encryption is not configured"), { statusCode: 503, code: "ENCRYPTION_NOT_CONFIGURED" });
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(part => part.toString("base64url")).join(".");
}

export function decryptCredential(payload: string): string {
  const [ivText, tagText, encryptedText] = payload.split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Invalid encrypted credential");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}
