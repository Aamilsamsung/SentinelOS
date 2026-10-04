import type { Finding } from "../investigations/findings.js";

export type ActionRecommendation = {
  title: string;
  rationale: string;
  confidence: number;
  evidenceIds: string[];
  requiresApproval: true;
};

export function recommendationsFromFindings(findings: Finding[]): ActionRecommendation[] {
  return findings
    .filter(finding => finding.type === "recommendation")
    .map(finding => ({
      title: finding.title,
      rationale: finding.detail,
      confidence: finding.confidence,
      evidenceIds: finding.evidenceIds,
      requiresApproval: true as const
    }));
}
