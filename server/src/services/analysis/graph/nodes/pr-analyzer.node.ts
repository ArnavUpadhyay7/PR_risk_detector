import type { PRRiskState } from "../state.js";
import { buildCompactContext, buildCompactDiff } from "../utils/diff.js";

export async function prAnalyzerNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
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
    diff,
    compactContext,
  };
}
