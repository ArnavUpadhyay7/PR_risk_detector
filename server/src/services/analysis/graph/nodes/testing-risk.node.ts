import type { PRRiskState } from "../state.js";
import { invokeStructured } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";

const SYSTEM_PROMPT = `You are a merge-risk analyst focused on testing and regression risk.

Compare changed implementation files vs changed test files.
Look for:
- important behavior changes without corresponding tests
- missing edge-case coverage
- auth/API/logic changes without adequate tests
- critical logic without regression tests

Use deterministic signals (test files changed: yes/no) as evidence.
Do NOT invent test files or coverage that is not evidenced in the PR.
If no meaningful testing risks exist, return an empty findings array.
Each finding must include severity, title, description, optional file/line if clearly identifiable, and a recommendation.`;

export async function testingRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  const userPrompt = [
    state.compactContext,
    "",
    "Test files changed (deterministic):",
    String(state.deterministicSummary.testsChanged),
    "",
    "Change areas:",
    state.changeAreas.join(", ") || "unknown",
    "",
    "Diff:",
    state.diff,
  ].join("\n");

  const result = await invokeStructured(findingsOutputSchema, SYSTEM_PROMPT, userPrompt);

  return { testingFindings: result.findings };
}
