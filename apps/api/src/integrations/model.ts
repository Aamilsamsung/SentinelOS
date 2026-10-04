import { z } from "zod";

const secretKey = /(secret|token|password|credential|api[_-]?key|private[_-]?key)/i;

export const integrationInput = z.object({
  provider: z.enum(["github", "generic_webhook", "prometheus", "sentry"]),
  name: z.string().trim().min(1).max(120),
  configuration: z.record(z.string(), z.unknown()).default({})
}).strict().superRefine((value, ctx) => {
  for (const key of Object.keys(value.configuration)) {
    if (secretKey.test(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["configuration", key], message: "Secrets must use the credential endpoint" });
  }
});

export type IntegrationInput = z.infer<typeof integrationInput>;
