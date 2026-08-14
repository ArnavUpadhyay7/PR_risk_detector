import { randomUUID } from "node:crypto";
import type { FindingCategory, RawRiskFinding, RiskFinding } from "../../schemas.js";
import type { ParsedFileDiff } from "./parsePatch.js";
import {
  evidenceMatchesDiff,
  getDiffPositionForLine,
  lineIsInChangedHunk,
} from "./parsePatch.js";

function normalizeFilename(filename: string, fileDiffs: ParsedFileDiff[]): string | null {
  if (fileDiffs.some((diff) => diff.filename === filename)) {
    return filename;
  }

  const suffixMatch = fileDiffs.find(
    (diff) => filename.endsWith(diff.filename) || diff.filename.endsWith(filename),
  );

  return suffixMatch?.filename ?? null;
}

export function validateAndEnrichFinding(
  raw: RawRiskFinding,
  category: FindingCategory,
  fileDiffs: ParsedFileDiff[],
): RiskFinding | null {
  const normalizedFile = normalizeFilename(raw.file, fileDiffs);
  if (!normalizedFile) {
    return null;
  }

  const fileDiff = fileDiffs.find((diff) => diff.filename === normalizedFile);
  if (!fileDiff) {
    return null;
  }

  let line = raw.line ?? undefined;
  let endLine = raw.endLine ?? undefined;
  let evidence = raw.evidence?.trim() || undefined;
  let diffPosition = raw.diffPosition;

  if (line !== undefined && !lineIsInChangedHunk(fileDiff, line)) {
    line = undefined;
    endLine = undefined;
    diffPosition = undefined;
  }

  if (line !== undefined) {
    diffPosition = getDiffPositionForLine(fileDiff, line) ?? diffPosition;
  }

  if (evidence && line !== undefined && !evidenceMatchesDiff(fileDiff, evidence, line)) {
    if (!evidenceMatchesDiff(fileDiff, evidence)) {
      evidence = undefined;
    }
  }

  if (!evidence && line !== undefined) {
    const matched = fileDiff.lines.find((entry) => entry.newLine === line);
    if (matched) {
      evidence = matched.content.trim();
    }
  }

  return {
    id: randomUUID(),
    category,
    severity: raw.severity,
    title: raw.title.trim(),
    description: raw.description.trim(),
    recommendation: raw.recommendation.trim(),
    file: normalizedFile,
    line,
    endLine,
    evidence,
    diffPosition,
    confidence: raw.confidence,
  };
}

export function validateFindings(
  rawFindings: RawRiskFinding[],
  category: FindingCategory,
  fileDiffs: ParsedFileDiff[],
): RiskFinding[] {
  const validated: RiskFinding[] = [];

  for (const raw of rawFindings) {
    const finding = validateAndEnrichFinding(raw, category, fileDiffs);
    if (finding) {
      validated.push(finding);
    }
  }

  return validated;
}
