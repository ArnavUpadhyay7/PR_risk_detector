import type { PRRiskState } from "../state.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import {
  riskJudgeOutputSchema,
  type PRRiskReport,
  type RiskFinding,
} from "../schemas.js";
import { buildJudgeContext } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You are the final merge-risk judge.

Synthesize provided findings into a concise merge-risk report.
Answer: "What could go wrong if this PR is merged?"

Rules:
- Use ONLY provided findings/context. Do NOT invent issues.
- summary: max 2 sentences.
- recommendations: max 4 short actionable items.
- riskScore 0-100 (0-24 LOW, 25-49 MEDIUM, 50-74 HIGH, 75-100 CRITICAL).
- A single CRITICAL finding can justify CRITICAL overall risk.
- Score unavailable categories low unless findings suggest otherwise.`;

function mergeFindings(state: PRRiskState): RiskFinding[] {
  return [
    ...state.bugFindings,
    ...state.securityFindings,
    ...state.testingFindings,
  ];
}

function severityRank(severity: RiskFinding["severity"]): number {
  switch (severity) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    default:
      return 1;
  }
}

function sortFindings(findings: RiskFinding[]): RiskFinding[] {
  return [...findings].sort(
    (left, right) => severityRank(right.severity) - severityRank(left.severity),
  );
}

function buildFallbackReport(state: PRRiskState, allFindings: RiskFinding[]): PRRiskReport {
  const hasCritical = allFindings.some((finding) => finding.severity === "CRITICAL");
  const hasHigh = allFindings.some((finding) => finding.severity === "HIGH");

  return {
    overallRisk: hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : allFindings.length > 0 ? "MEDIUM" : "LOW",
    riskScore: hasCritical ? 85 : hasHigh ? 65 : allFindings.length > 0 ? 40 : 12,
    summary:
      allFindings.length > 0
        ? "Specialist findings indicate merge risks that should be reviewed before merging."
        : "No significant merge risks were identified from available analysis.",
    bugRisk: state.bugFindings.length > 0 ? 55 : 8,
    securityRisk: state.securityFindings.length > 0 ? 60 : 8,
    testingRisk: state.testingFindings.length > 0 ? 50 : 8,
    findings: sortFindings(allFindings),
    recommendations: allFindings.slice(0, 4).map((finding) => finding.recommendation),
    warnings: [
      ...state.agentWarnings,
      "Final AI synthesis unavailable; showing fallback assessment from specialist findings.",
    ],
  };
}

export async function riskJudgeNode(state: PRRiskState): Promise<Partial<PRRiskState>> {
  const allFindings = mergeFindings(state);

  if (allFindings.length === 0 && state.agentWarnings.length > 0) {
    startTimer("risk judge");
    endTimer("risk judge (fallback)");
    return { finalReport: buildFallbackReport(state, allFindings) };
  }

  startTimer("risk judge");
  const userPrompt = buildJudgeContext({
    title: state.title,
    changeAreas: state.changeAreas,
    bugFindings: state.bugFindings,
    securityFindings: state.securityFindings,
    testingFindings: state.testingFindings,
    agentWarnings: state.agentWarnings,
  });

  const judge = await invokeStructuredSafe(
    riskJudgeOutputSchema,
    SYSTEM_PROMPT,
    userPrompt,
    "judge",
  );

  endTimer("risk judge");

  if (judge.data === null) {
    return { finalReport: buildFallbackReport(state, allFindings) };
  }

  const finalReport: PRRiskReport = {
    overallRisk: judge.data.overallRisk,
    riskScore: judge.data.riskScore,
    summary: judge.data.summary,
    bugRisk: judge.data.bugRisk,
    securityRisk: judge.data.securityRisk,
    testingRisk: judge.data.testingRisk,
    findings: sortFindings(allFindings),
    recommendations: judge.data.recommendations,
    warnings: state.agentWarnings,
  };

  return { finalReport };
}
