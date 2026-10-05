export type DeploymentSignal = {
  id: string;
  service?: string;
  occurredAt: string;
  state?: string;
};

export type IncidentSignal = {
  service?: string;
  detectedAt: string;
};

export type DeploymentCorrelation = {
  deploymentId: string;
  score: number;
  reason: string;
};

export function correlateDeploymentToIncident(
  incident: IncidentSignal,
  deployment: DeploymentSignal,
  windowMs = 30 * 60 * 1000,
): DeploymentCorrelation | null {
  const incidentTime = Date.parse(incident.detectedAt);
  const deploymentTime = Date.parse(deployment.occurredAt);
  if (!Number.isFinite(incidentTime) || !Number.isFinite(deploymentTime)) return null;

  const delay = incidentTime - deploymentTime;
  if (delay < 0 || delay > windowMs) return null;

  const sameService = Boolean(incident.service && deployment.service === incident.service);
  let score = 0.35 * (1 - delay / windowMs);
  if (sameService) score += 0.45;
  if (deployment.state === "failure" || deployment.state === "error") score += 0.2;
  score = Math.min(1, Number(score.toFixed(3)));
  if (score < 0.4) return null;

  const minutes = Math.round(delay / 60_000);
  const reasons = [`deployment preceded incident by ${minutes} minute${minutes === 1 ? "" : "s"}`];
  if (sameService) reasons.push("same service");
  if (deployment.state === "failure" || deployment.state === "error") reasons.push(`deployment state ${deployment.state}`);

  return { deploymentId: deployment.id, score, reason: reasons.join(", ") };
}
