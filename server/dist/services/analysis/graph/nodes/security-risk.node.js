import { runSpecialistAgent } from "./specialist-agent.js";
import { buildSecurityAgentContext } from "../utils/context-builders.js";
const SYSTEM_PROMPT = `You are the Security Agent for merge-risk analysis.
Focus on authentication, authorization, secrets, tokens, sessions, input validation, injection, permissions, sensitive data exposure, and insecure configuration visible in the diff.`;
export async function securityRiskNode(state) {
    return runSpecialistAgent(state, {
        category: "SECURITY",
        timerLabel: "security agent",
        findingsKey: "securityFindings",
        warningLabel: "Security analysis",
        systemPrompt: SYSTEM_PROMPT,
        buildContext: (current) => buildSecurityAgentContext({
            title: current.title,
            description: current.description,
            files: current.filesChanged,
            fileDiffs: current.fileDiffs,
            securitySensitive: current.deterministicSummary.securitySensitive,
        }),
    });
}
//# sourceMappingURL=security-risk.node.js.map