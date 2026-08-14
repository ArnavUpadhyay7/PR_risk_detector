import type { RiskFinding } from "../../schemas.js";

function severityWeight(severity: RiskFinding["severity"]): number {
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

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findingsSimilar(left: RiskFinding, right: RiskFinding): boolean {
  if (left.file !== right.file) {
    return false;
  }

  if (left.line !== undefined && right.line !== undefined) {
    return Math.abs(left.line - right.line) <= 2;
  }

  const leftText = normalizeText(`${left.title} ${left.description}`);
  const rightText = normalizeText(`${right.title} ${right.description}`);

  const leftTokens = new Set(leftText.split(" ").filter((token) => token.length > 3));
  const rightTokens = new Set(rightText.split(" ").filter((token) => token.length > 3));
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }

  return overlap >= 2;
}

function mergeFindings(primary: RiskFinding, secondary: RiskFinding): RiskFinding {
  return {
    ...primary,
    severity:
      severityWeight(secondary.severity) > severityWeight(primary.severity)
        ? secondary.severity
        : primary.severity,
    confidence: Math.max(primary.confidence, secondary.confidence),
    description:
      primary.description.length >= secondary.description.length
        ? primary.description
        : secondary.description,
    recommendation:
      primary.recommendation.length >= secondary.recommendation.length
        ? primary.recommendation
        : secondary.recommendation,
    evidence: primary.evidence ?? secondary.evidence,
    line: primary.line ?? secondary.line,
    endLine: primary.endLine ?? secondary.endLine,
    diffPosition: primary.diffPosition ?? secondary.diffPosition,
  };
}

export function dedupeFindings(findings: RiskFinding[]): RiskFinding[] {
  const deduped: RiskFinding[] = [];

  for (const finding of findings) {
    const existingIndex = deduped.findIndex((candidate) =>
      findingsSimilar(candidate, finding),
    );

    if (existingIndex === -1) {
      deduped.push(finding);
      continue;
    }

    const existing = deduped[existingIndex];
    if (existing) {
      deduped[existingIndex] = mergeFindings(existing, finding);
    }
  }

  return deduped.sort(
    (left, right) => severityWeight(right.severity) - severityWeight(left.severity),
  );
}

export function scoreCategory(findings: RiskFinding[], category: RiskFinding["category"]): number {
  const categoryFindings = findings.filter((finding) => finding.category === category);
  if (categoryFindings.length === 0) {
    return 5;
  }

  let score = 0;
  for (const finding of categoryFindings) {
    score += severityWeight(finding.severity) * 18 * finding.confidence;
  }

  return Math.min(100, Math.round(score));
}

export function computeOverallRisk(
  findings: RiskFinding[],
  scores: { security: number; quality: number; performance: number; bug: number },
): { overallRisk: RiskFinding["severity"]; riskScore: number } {
  if (findings.some((finding) => finding.severity === "CRITICAL")) {
    return { overallRisk: "CRITICAL", riskScore: Math.min(100, Math.max(scores.security, scores.bug, 75)) };
  }

  const maxScore = Math.max(scores.security, scores.quality, scores.performance, scores.bug);

  if (findings.some((finding) => finding.severity === "HIGH") || maxScore >= 70) {
    return { overallRisk: "HIGH", riskScore: Math.max(maxScore, 65) };
  }

  if (maxScore >= 40) {
    return { overallRisk: "MEDIUM", riskScore: maxScore };
  }

  return { overallRisk: "LOW", riskScore: Math.max(8, maxScore) };
}
