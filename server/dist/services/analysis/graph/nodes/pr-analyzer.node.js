import { buildCompactContext, buildCompactDiff } from "../utils/diff.js";
import { parseAllPatches } from "../utils/diff/parsePatch.js";
export async function prAnalyzerNode(state) {
    const fileDiffs = parseAllPatches(state.filesChanged);
    const diff = buildCompactDiff(state.filesChanged);
    const compactContext = buildCompactContext(state.title, state.description, state.baseBranch, state.headBranch, state.filesChanged, state.deterministicSummary);
    return {
        fileDiffs,
        diff,
        compactContext,
    };
}
//# sourceMappingURL=pr-analyzer.node.js.map