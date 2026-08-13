import { Send } from "@langchain/langgraph";
import type { PRRiskState } from "./state.js";
import { isTrivialState } from "./nodes/deterministic-classifier.node.js";
import { useCombinedAnalysisMode } from "./state.js";

export function routeAfterClassifier(
  state: PRRiskState,
): "trivialReport" | "combinedRisk" | Send[] {
  if (isTrivialState(state)) {
    return "trivialReport";
  }

  const classification = state.classification;
  if (!classification) {
    return "trivialReport";
  }

  if (useCombinedAnalysisMode()) {
    return "combinedRisk";
  }

  const sends: Send[] = [];
  if (classification.bugRelevant) {
    sends.push(new Send("bugRisk", state));
  }
  if (classification.securityRelevant) {
    sends.push(new Send("securityRisk", state));
  }
  if (classification.testingRelevant) {
    sends.push(new Send("testingRisk", state));
  }

  return sends.length > 0 ? sends : "trivialReport";
}
