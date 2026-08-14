import { runSpecialistAgent } from "./specialist-agent.js";
import { buildBugAgentContext } from "../utils/context-builders.js";
const SYSTEM_PROMPT = `You are the Logic/Bug Agent for merge-risk analysis.
Focus on functional correctness: incorrect conditions, edge cases, null/undefined handling, broken flows, state inconsistencies, API behavior regressions, and incorrect assumptions visible in the diff.`;
export async function bugRiskNode(state) {
    return runSpecialistAgent(state, {
        category: "BUG",
        timerLabel: "bug agent",
        findingsKey: "bugFindings",
        warningLabel: "Logic/bug analysis",
        systemPrompt: SYSTEM_PROMPT,
        buildContext: (current) => buildBugAgentContext({
            title: current.title,
            description: current.description,
            files: current.filesChanged,
            fileDiffs: current.fileDiffs,
        }),
    });
}
//# sourceMappingURL=bug-risk.node.js.map