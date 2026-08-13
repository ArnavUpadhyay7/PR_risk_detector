import type { PRRiskState } from "../state.js";
import { invokeStructured } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";

const SYSTEM_PROMPT = `You are a merge-risk analyst focused on functional and logic bugs.

Analyze the pull request for merge risks such as:
- incorrect conditions or branching
- edge cases and null/undefined handling
- broken flows or state handling
- behavior changes that could break existing functionality
- suspicious logic changes

Do NOT review coding style or formatting.
Do NOT invent issues. Only report risks supported by the diff/context.
If no meaningful bug risks exist, return an empty findings array.
Each finding must include severity, title, description, optional file/line if clearly identifiable, and a recommendation.`;

export async function bugRiskNode(state: PRRiskState): Promise<Partial<PRRiskState>> {
  const userPrompt = [
    state.compactContext,
    "",
    "Change areas:",
    state.changeAreas.join(", ") || "unknown",
    "",
    "Diff:",
    state.diff,
  ].join("\n");

  const result = await invokeStructured(findingsOutputSchema, SYSTEM_PROMPT, userPrompt);

  return { bugFindings: result.findings };
}
