import { afterEach, describe, expect, it, vi } from "vitest";
import { encryptCredential } from "./credentials.js";
import { resolveGitHubWebhookSecret } from "./github-secret.js";

describe("organization-scoped GitHub webhook secret", () => {
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("decrypts the configured secret only from the requested organization", async () => {
    process.env.ENCRYPTION_KEY = "test-key-that-is-long-enough-for-credential-encryption";
    const ciphertext = encryptCredential("org-a-webhook-secret");
    const query = vi.fn().mockResolvedValue({ rows: [{ credential_ciphertext: ciphertext }] });
    const secret = await resolveGitHubWebhookSecret({ query } as any, "org-a");
    expect(secret).toBe("org-a-webhook-secret");
    expect(query.mock.calls[0][1]).toEqual(["org-a"]);
  });

  it("fails closed when the organization has no configured GitHub credential", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await expect(resolveGitHubWebhookSecret({ query } as any, "org-b")).resolves.toBeNull();
  });
});
