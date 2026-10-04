import { z } from "zod";

export const integrationInput = z.object({
  provider: z.enum(["github", "generic_webhook", "prometheus", "sentry"]),
  name: z.string().trim().min(1).max(120),
  configuration: z.record(z.string(), z.unknown()).default({})
}).strict();

export type IntegrationInput = z.infer<typeof integrationInput>;
