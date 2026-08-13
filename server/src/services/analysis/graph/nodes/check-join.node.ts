import { Command } from "@langchain/langgraph";
import type { PRRiskState } from "../state.js";

export function checkJoinNode(state: PRRiskState): Command | Partial<PRRiskState> {
  if (state.agentsPending > 0 && state.agentsDone >= state.agentsPending) {
    return new Command({ goto: "riskJudge" });
  }

  return {};
}
