import type { PRRiskState } from "../state.js";
import { runSpecialistAgent } from "./specialist-agent.js";
import { buildPerformanceAgentContext } from "../utils/context-builders.js";

const SYSTEM_PROMPT = `You are the Performance Agent for merge-risk analysis.
Focus on evidence-backed performance risks: N+1 queries, expensive loops, repeated computation, unnecessary network/database calls, blocking operations, and inefficient data processing visible in the diff.
Do NOT speculate without diff evidence.`;

export async function performanceRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  return runSpecialistAgent(state, {
    category: "PERFORMANCE",
    timerLabel: "performance agent",
    findingsKey: "performanceFindings",
    warningLabel: "Performance analysis",
    systemPrompt: SYSTEM_PROMPT,
    buildContext: (current) =>
      buildPerformanceAgentContext({
        title: current.title,
        description: current.description,
        files: current.filesChanged,
        fileDiffs: current.fileDiffs,
      }),
  });
}
