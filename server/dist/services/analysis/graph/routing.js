import { Send } from "@langchain/langgraph";
import { isTrivialState } from "./nodes/deterministic-classifier.node.js";
export function routeAfterClassifier(state) {
    if (isTrivialState(state)) {
        return "trivialReport";
    }
    const classification = state.classification;
    if (!classification) {
        return "trivialReport";
    }
    const sends = [];
    if (classification.securityRelevant) {
        sends.push(new Send("securityRisk", state));
    }
    if (classification.qualityRelevant) {
        sends.push(new Send("qualityRisk", state));
    }
    if (classification.performanceRelevant) {
        sends.push(new Send("performanceRisk", state));
    }
    if (classification.bugRelevant) {
        sends.push(new Send("bugRisk", state));
    }
    return sends.length > 0 ? sends : "trivialReport";
}
//# sourceMappingURL=routing.js.map