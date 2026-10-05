import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGitHubWebhookSignature } from "./github-signature.js";

describe("GitHub webhook signature verification", () => {
  const secret = "github-webhook-secret";
  const body = JSON.stringify({ deployment: { id: 41, sha: "abc123" } });

  it("accepts the exact GitHub sha256 raw-body signature", () => {
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyGitHubWebhookSignature(secret, body, `sha256=${digest}`)).toBe(true);
  });

  it("rejects a signature when the raw body changes", () => {
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyGitHubWebhookSignature(secret, body + " ", `sha256=${digest}`)).toBe(false);
  });

  it("rejects malformed and non-sha256 signatures", () => {
    expect(verifyGitHubWebhookSignature(secret, body, "sha1=abc")).toBe(false);
    expect(verifyGitHubWebhookSignature(secret, body, "sha256=not-hex")).toBe(false);
  });
});
