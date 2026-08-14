import { Command } from "@langchain/langgraph";
export function checkJoinNode(state) {
    if (state.agentsPending > 0 && state.agentsDone >= state.agentsPending) {
        return new Command({ goto: "riskAggregator" });
    }
    return {};
}
//# sourceMappingURL=check-join.node.js.map