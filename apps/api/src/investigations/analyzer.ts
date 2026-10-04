import type { EvidenceBundle } from "./evidence.js";
import type { Finding } from "./findings.js";
import { investigationPrompt } from "./prompt.js";

export interface InvestigationAnalyzer {
  analyze(bundle: EvidenceBundle): Promise<unknown>;
}

export class HttpInvestigationAnalyzer implements InvestigationAnalyzer {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string
  ) {}

  async analyze(bundle: EvidenceBundle): Promise<unknown> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        prompt: investigationPrompt(bundle),
        responseFormat: {
          type: "array",
          items: ["observation", "hypothesis", "recommendation"]
        }
      })
    });
    if (!response.ok) throw new Error(`Investigation analyzer failed with status ${response.status}`);
    return response.json();
  }
}

export function configuredAnalyzer(): InvestigationAnalyzer | null {
  const endpoint = process.env.INVESTIGATION_AI_ENDPOINT;
  const apiKey = process.env.INVESTIGATION_AI_API_KEY;
  if (!endpoint || !apiKey) return null;
  return new HttpInvestigationAnalyzer(endpoint, apiKey);
}
