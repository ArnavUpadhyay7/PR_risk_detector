import type { PRRiskState } from "../state.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";
import { buildTestingAgentContext } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You analyze pull requests for testing/regression merge risks only.

Return concise structured JSON (max 3 findings).
Compare implementation changes vs test changes.
Flag behavior changes without adequate tests.
Do NOT invent test files.
Keep descriptions to one short sentence.`;

export async function testingRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("testing analysis");

  const userPrompt = buildTestingAgentContext({
    title: state.title,
    files: state.filesChanged,
    testsChanged: state.deterministicSummary.testsChanged,
  });

  const result = await invokeStructuredSafe(
    findingsOutputSchema,
    SYSTEM_PROMPT,
    userPrompt,
    "specialist",
  );

  endTimer("testing analysis");

  if (result.data === null) {
    return {
      testingFindings: [],
      agentsDone: 1,
      agentWarnings: [result.error ?? "Testing risk analysis unavailable."],
    };
  }

  return {
    testingFindings: result.data.findings,
    agentsDone: 1,
  };
}
