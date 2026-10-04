import { z } from "zod";

const secretKey = /(secret|token|password|credential|api[_-]?key|private[_-]?key)/i;

function findSecretPath(value: unknown, path: (string | number)[] = []): (string | number)[] | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findSecretPath(value[index], [...path, index]);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];
    if (secretKey.test(key)) return nextPath;
    const found = findSecretPath(child, nextPath);
    if (found) return found;
  }
  return null;
}

export const integrationInput = z.object({
  provider: z.enum(["github", "generic_webhook", "prometheus", "sentry"]),
  name: z.string().trim().min(1).max(120),
  configuration: z.record(z.string(), z.unknown()).default({})
}).strict().superRefine((value, ctx) => {
  const path = findSecretPath(value.configuration);
  if (path) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["configuration", ...path],
      message: "Secrets must use the credential endpoint"
    });
  }
});

export type IntegrationInput = z.infer<typeof integrationInput>;
