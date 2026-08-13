import { buildCompactContext, buildCompactDiff } from "../utils/diff.js";
export async function prAnalyzerNode(state) {
    const diff = buildCompactDiff(state.filesChanged);
    const compactContext = buildCompactContext(state.title, state.description, state.baseBranch, state.headBranch, state.filesChanged, state.deterministicSummary);
    return {
        diff,
        compactContext,
    };
}
//# sourceMappingURL=pr-analyzer.node.js.map