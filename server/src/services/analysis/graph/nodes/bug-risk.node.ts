import type { PRRiskState } from "../state.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";
import { buildBugAgentContext } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You analyze pull requests for functional/logic merge risks only.

Return concise structured JSON (max 3 findings).
Focus on incorrect conditions, edge cases, broken flows, and behavior regressions.
Do NOT review style. Do NOT invent issues.
Keep descriptions to one short sentence.`;

export async function bugRiskNode(state: PRRiskState): Promise<Partial<PRRiskState>> {
  startTimer("bug analysis");

  const userPrompt = buildBugAgentContext({
    title: state.title,
    description: state.description,
    files: state.filesChanged,
  });

  const result = await invokeStructuredSafe(
    findingsOutputSchema,
    SYSTEM_PROMPT,
    userPrompt,
    "specialist",
  );

  endTimer("bug analysis");

  if (result.data === null) {
    return {
      bugFindings: [],
      agentsDone: 1,
      agentWarnings: [result.error ?? "Bug risk analysis unavailable."],
    };
  }

  return {
    bugFindings: result.data.findings,
    agentsDone: 1,
  };
}
