import type { PRRiskState } from "../state.js";
import {
  classifyChanges,
  countRelevantAgents,
  isTrivialChange,
} from "../utils/classification.js";
import { endTimer, startTimer } from "../utils/timing.js";

export async function deterministicClassifierNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("deterministic classification");

  const classification = classifyChanges(
    state.filesChanged,
    state.deterministicSummary,
    state.title,
    state.description,
  );

  endTimer("deterministic classification");

  return {
    classification,
    changeAreas: classification.areas,
    agentsPending: countRelevantAgents(classification),
    agentsDone: 0,
    agentWarnings: [],
  };
}

export function isTrivialState(state: PRRiskState): boolean {
  return state.classification ? isTrivialChange(state.classification) : false;
}
