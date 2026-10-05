import { z } from "zod";
import type { IngestEventInput } from "../events/model.js";

const repositorySchema = z.object({
  full_name: z.string().min(1),
}).passthrough();

const deploymentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sha: z.string().min(1),
  ref: z.string().optional(),
  environment: z.string().optional(),
  created_at: z.string().optional(),
}).passthrough();

const deploymentStatusSchema = z.object({
  id: z.union([z.string(), z.number()]),
  state: z.string().min(1),
  environment: z.string().optional(),
  created_at: z.string().optional(),
  deployment_url: z.string().optional(),
}).passthrough();

function occurredAt(value: string | undefined, fallback: Date) {
  const parsed = value ? new Date(value) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

export function normalizeGitHubWebhook(
  eventName: string,
  payload: unknown,
  now = new Date(),
): IngestEventInput | null {
  const body = z.object({ repository: repositorySchema }).passthrough().safeParse(payload);
  if (!body.success) return null;
  const repository = body.data.repository.full_name;

  if (eventName === "deployment") {
    const parsed = z.object({ deployment: deploymentSchema }).passthrough().safeParse(payload);
    if (!parsed.success) return null;
    const deployment = parsed.data.deployment;
    return {
      externalId: `github:deployment:${deployment.id}`,
      type: "deployment.created",
      source: "github",
      service: repository,
      severity: "info",
      title: `Deployment created for ${repository}`,
      occurredAt: occurredAt(deployment.created_at, now),
      attributes: {
        repository,
        sha: deployment.sha,
        ref: deployment.ref ?? null,
        environment: deployment.environment ?? null,
      },
    };
  }

  if (eventName === "deployment_status") {
    const parsed = z.object({
      deployment: deploymentSchema,
      deployment_status: deploymentStatusSchema,
    }).passthrough().safeParse(payload);
    if (!parsed.success) return null;
    const status = parsed.data.deployment_status;
    const deployment = parsed.data.deployment;
    return {
      externalId: `github:deployment-status:${status.id}`,
      type: "deployment.status",
      source: "github",
      service: repository,
      severity: status.state === "failure" || status.state === "error" ? "critical" : "info",
      title: `GitHub deployment ${status.state} for ${repository}`,
      occurredAt: occurredAt(status.created_at, now),
      attributes: {
        repository,
        deploymentId: String(deployment.id),
        sha: deployment.sha,
        environment: status.environment ?? deployment.environment ?? null,
        state: status.state,
        deploymentUrl: status.deployment_url ?? null,
      },
    };
  }

  return null;
}
