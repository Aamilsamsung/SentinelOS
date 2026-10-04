export type Signal = {
  id: string;
  type: "event" | "metric_anomaly" | "log";
  service?: string;
  occurredAt: string;
  severity?: "info" | "warning" | "critical";
};

export type Correlation = {
  evidenceId: string;
  evidenceType: Signal["type"];
  score: number;
  reason: string;
};

const severityWeight = { info: 0, warning: 0.1, critical: 0.2 } as const;

export function correlateSignals(
  anchor: Signal,
  candidates: Signal[],
  relatedServices: ReadonlySet<string> = new Set(),
  windowMs = 15 * 60 * 1000
): Correlation[] {
  const anchorTime = Date.parse(anchor.occurredAt);
  if (!Number.isFinite(anchorTime)) return [];

  return candidates.flatMap(candidate => {
    if (candidate.id === anchor.id && candidate.type === anchor.type) return [];
    const candidateTime = Date.parse(candidate.occurredAt);
    if (!Number.isFinite(candidateTime)) return [];
    const delta = Math.abs(candidateTime - anchorTime);
    if (delta > windowMs) return [];

    let score = 0.35 * (1 - delta / windowMs);
    const sameService = Boolean(anchor.service && candidate.service === anchor.service);
    const dependencyRelated = Boolean(candidate.service && relatedServices.has(candidate.service));
    if (sameService) score += 0.4;
    else if (dependencyRelated) score += 0.25;
    score += severityWeight[candidate.severity ?? "info"];
    score = Math.min(1, Number(score.toFixed(3)));
    if (score < 0.4) return [];

    const reasons = ["within correlation window"];
    if (sameService) reasons.push("same service");
    else if (dependencyRelated) reasons.push("dependency-related service");
    if (candidate.severity === "critical") reasons.push("critical severity");

    return [{
      evidenceId: candidate.id,
      evidenceType: candidate.type,
      score,
      reason: reasons.join(", ")
    }];
  }).sort((a, b) => b.score - a.score);
}
