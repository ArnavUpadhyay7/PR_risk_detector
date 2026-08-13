import type { PRRiskState } from "../state.js";
import type { PRRiskReport } from "../schemas.js";
import { endTimer, startTimer } from "../utils/timing.js";

export async function trivialReportNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("trivial report");

  const finalReport: PRRiskReport = {
    overallRisk: "LOW",
    riskScore: 8,
    summary:
      "No meaningful code, security, or testing merge risks detected. Changes appear limited to docs or non-behavioral files.",
    bugRisk: 3,
    securityRisk: 2,
    testingRisk: 2,
    findings: [],
    recommendations: [],
    warnings: [],
  };

  endTimer("trivial report");
  console.log(`[Graph] LLM calls skipped (trivial PR): ${state.title}`);

  return { finalReport };
}
