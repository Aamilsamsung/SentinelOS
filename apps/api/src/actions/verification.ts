export type VerificationCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type VerificationResult = {
  status: "passed" | "failed" | "inconclusive";
  detail: string;
};

export function evaluateVerification(checks: VerificationCheck[]): VerificationResult {
  if (checks.length === 0) {
    return { status: "inconclusive", detail: "No verification checks were available." };
  }
  const failed = checks.filter(check => !check.passed);
  if (failed.length) {
    return {
      status: "failed",
      detail: failed.map(check => `${check.name}: ${check.detail}`).join("; ")
    };
  }
  return {
    status: "passed",
    detail: checks.map(check => `${check.name}: ${check.detail}`).join("; ")
  };
}
