import { toFileDiffResponse } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";
export async function trivialReportNode(state) {
    startTimer("trivial report");
    const finalReport = {
        overallRisk: "LOW",
        riskScore: 8,
        summary: "No meaningful code, security, quality, performance, or logic merge risks detected. Changes appear limited to docs or non-behavioral files.",
        securityRisk: 2,
        qualityRisk: 2,
        performanceRisk: 2,
        bugRisk: 3,
        findings: [],
        recommendations: [],
        warnings: [],
        fileDiffs: toFileDiffResponse(state.fileDiffs),
    };
    endTimer("trivial report");
    console.log(`[Graph] LLM calls skipped (trivial PR): ${state.title}`);
    return { finalReport };
}
//# sourceMappingURL=trivial-report.node.js.map