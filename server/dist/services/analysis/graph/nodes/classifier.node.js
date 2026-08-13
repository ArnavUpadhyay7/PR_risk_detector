import { invokeStructured } from "../../../ai/llm.service.js";
import { changeClassificationSchema } from "../schemas.js";
const SYSTEM_PROMPT = `You classify pull request changes to route merge-risk analysis.

Return structured JSON only.
Identify relevant change areas from: backend, frontend, database, authentication, authorization, API, testing, configuration, dependencies, performance, security, UI.

Set relevance flags:
- bugRelevant: logic/behavior changes that could introduce functional bugs
- securityRelevant: auth, permissions, secrets, input handling, sensitive data
- testingRelevant: behavior changes that should have test coverage
- performanceRelevant: performance-sensitive changes

Be conservative: if unsure, mark relevant rather than skipping critical analysis.
Do not invent files or behaviors not present in the input.`;
export async function classifierNode(state) {
    const userPrompt = [
        state.compactContext,
        "",
        "Diff (may be truncated):",
        state.diff,
    ].join("\n");
    const classification = await invokeStructured(changeClassificationSchema, SYSTEM_PROMPT, userPrompt);
    return {
        changeAreas: classification.areas,
        classification,
    };
}
//# sourceMappingURL=classifier.node.js.map