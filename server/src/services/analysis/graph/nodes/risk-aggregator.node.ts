import type { PRRiskState } from "../state.js";
import type { PRRiskReport, RiskFinding } from "../schemas.js";
import { aggregatorOutputSchema } from "../schemas.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import {
  buildAggregatorContext,
  toFileDiffResponse,
} from "../utils/context-builders.js";
import {
  computeOverallRisk,
  dedupeFindings,
  scoreCategory,
} from "../utils/diff/dedupeFindings.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You are the final merge-risk aggregator.
Given validated specialist findings, write a concise summary and up to 4 actionable recommendations.
Do NOT invent new findings, files, or line numbers.`;

function collectFindings(state: PRRiskState): RiskFinding[] {
  return dedupeFindings([
    ...state.securityFindings,
    ...state.qualityFindings,
    ...state.performanceFindings,
    ...state.bugFindings,
  ]);
}

function buildFallbackSummary(findings: RiskFinding[]): string {
  if (findings.length === 0) {
    return "No significant merge risks were identified in the analyzed changes.";
  }

  const top = findings[0];
  return `Identified ${findings.length} merge-risk finding(s), led by ${top?.severity ?? "UNKNOWN"} ${top?.category ?? ""} issue "${top?.title ?? "unknown"}".`;
}

export async function riskAggregatorNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("aggregator");
  console.log("[AI] aggregator: started");

  const findings = collectFindings(state);
  const securityRisk = scoreCategory(findings, "SECURITY");
  const qualityRisk = scoreCategory(findings, "QUALITY");
  const performanceRisk = scoreCategory(findings, "PERFORMANCE");
  const bugRisk = scoreCategory(findings, "BUG");
  const { overallRisk, riskScore } = computeOverallRisk(findings, {
    security: securityRisk,
    quality: qualityRisk,
    performance: performanceRisk,
    bug: bugRisk,
  });

  let summary = buildFallbackSummary(findings);
  let recommendations =
    findings.length > 0
      ? findings.slice(0, 4).map((finding) => finding.recommendation)
      : [];
  const warnings = [...state.agentWarnings];

  if (findings.length > 0) {
    const llm = await invokeStructuredSafe(
      aggregatorOutputSchema,
      SYSTEM_PROMPT,
      buildAggregatorContext({
        title: state.title,
        changeAreas: state.changeAreas,
        findings,
        agentWarnings: state.agentWarnings,
        testsChanged: state.deterministicSummary.testsChanged,
      }),
      "judge",
    );

    if (llm.data) {
      summary = llm.data.summary;
      recommendations = llm.data.recommendations;
    } else if (llm.error) {
      warnings.push(`Final assessment summary unavailable (${llm.error}).`);
    }
  }

  if (
    !state.deterministicSummary.testsChanged &&
    state.deterministicSummary.filesChanged > 0 &&
    !findings.some((finding) => finding.title.toLowerCase().includes("test"))
  ) {
    recommendations = [
      ...recommendations,
      "Review whether behavior changes need corresponding test updates.",
    ].slice(0, 5);
  }

  const finalReport: PRRiskReport = {
    overallRisk,
    riskScore,
    summary,
    securityRisk,
    qualityRisk,
    performanceRisk,
    bugRisk,
    findings,
    recommendations,
    warnings,
    fileDiffs: toFileDiffResponse(state.fileDiffs),
  };

  const duration = endTimer("aggregator");
  console.log(`[AI] aggregator: ${duration}ms`);

  return { finalReport };
}
