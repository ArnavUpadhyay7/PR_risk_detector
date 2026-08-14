import { runSpecialistAgent } from "./specialist-agent.js";
import { buildQualityAgentContext } from "../utils/context-builders.js";
const SYSTEM_PROMPT = `You are the Code Quality Agent for merge-risk analysis.
Focus on maintainability risks with engineering impact: duplicated logic, excessive complexity, poor separation of concerns, inconsistent error handling, suspicious abstractions, and patterns likely to cause future defects.
Do NOT report formatting or subjective style preferences.`;
export async function qualityRiskNode(state) {
    return runSpecialistAgent(state, {
        category: "QUALITY",
        timerLabel: "quality agent",
        findingsKey: "qualityFindings",
        warningLabel: "Code quality analysis",
        systemPrompt: SYSTEM_PROMPT,
        buildContext: (current) => buildQualityAgentContext({
            title: current.title,
            description: current.description,
            files: current.filesChanged,
            fileDiffs: current.fileDiffs,
        }),
    });
}
//# sourceMappingURL=quality-risk.node.js.map