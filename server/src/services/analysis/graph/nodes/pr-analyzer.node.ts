import type { PRRiskState } from "../state.js";
import { buildCompactContext, buildCompactDiff } from "../utils/diff.js";
import { parseAllPatches } from "../utils/diff/parsePatch.js";

export async function prAnalyzerNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  const fileDiffs = parseAllPatches(state.filesChanged);
  const diff = buildCompactDiff(state.filesChanged);
  const compactContext = buildCompactContext(
    state.title,
    state.description,
    state.baseBranch,
    state.headBranch,
    state.filesChanged,
    state.deterministicSummary,
  );

  return {
    fileDiffs,
    diff,
    compactContext,
  };
}
