export type AnomalyResult = {
  anomalous: boolean;
  zScore: number;
  mean: number;
  standardDeviation: number;
  sampleSize: number;
};

export function detectZScoreAnomaly(
  baseline: number[],
  observed: number,
  threshold = 3
): AnomalyResult {
  if (baseline.length < 5) {
    return { anomalous: false, zScore: 0, mean: 0, standardDeviation: 0, sampleSize: baseline.length };
  }
  const mean = baseline.reduce((sum, value) => sum + value, 0) / baseline.length;
  const variance = baseline.reduce((sum, value) => sum + (value - mean) ** 2, 0) / baseline.length;
  const standardDeviation = Math.sqrt(variance);
  const zScore = standardDeviation === 0
    ? (observed === mean ? 0 : Number.POSITIVE_INFINITY)
    : Math.abs((observed - mean) / standardDeviation);
  return {
    anomalous: zScore >= threshold,
    zScore,
    mean,
    standardDeviation,
    sampleSize: baseline.length
  };
}
