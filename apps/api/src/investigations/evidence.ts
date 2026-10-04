export type EvidenceItem = {
  id: string;
  kind: "event" | "metric" | "log" | "deployment" | "topology";
  observedAt: string;
  summary: string;
  source: string;
  confidence: number;
};

export type EvidenceBundle = {
  incidentId: string;
  generatedAt: string;
  items: EvidenceItem[];
};

export function buildEvidenceBundle(
  incidentId: string,
  items: EvidenceItem[],
  generatedAt = new Date().toISOString()
): EvidenceBundle {
  const valid = items
    .filter(item =>
      item.id.length > 0 &&
      item.summary.length > 0 &&
      Number.isFinite(Date.parse(item.observedAt)) &&
      item.confidence >= 0 &&
      item.confidence <= 1
    )
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  return { incidentId, generatedAt, items: valid };
}
