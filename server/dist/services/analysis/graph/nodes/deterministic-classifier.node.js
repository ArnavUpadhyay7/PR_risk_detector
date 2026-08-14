import { classifyChanges, countRelevantAgents, isTrivialChange, } from "../utils/classification.js";
import { endTimer, startTimer } from "../utils/timing.js";
export async function deterministicClassifierNode(state) {
    startTimer("deterministic classification");
    const classification = classifyChanges(state.filesChanged, state.deterministicSummary, state.title, state.description);
    endTimer("deterministic classification");
    return {
        classification,
        changeAreas: classification.areas,
        agentsPending: countRelevantAgents(classification),
        agentsDone: 0,
        agentWarnings: [],
    };
}
export function isTrivialState(state) {
    return state.classification ? isTrivialChange(state.classification) : false;
}
//# sourceMappingURL=deterministic-classifier.node.js.map