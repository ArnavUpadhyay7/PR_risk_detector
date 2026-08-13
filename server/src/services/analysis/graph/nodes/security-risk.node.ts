import type { PRRiskState } from "../state.js";
import { invokeStructured } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";

const SYSTEM_PROMPT = `You are a merge-risk analyst focused on security risks.

Analyze the pull request for merge risks such as:
- authentication or authorization changes
- unsafe user input handling
- secrets or credentials exposure
- insecure API behavior
- injection risks
- permission or token/session handling issues
- sensitive data exposure

Do NOT invent vulnerabilities. Only report risks supported by the diff/context.
If no meaningful security risks exist, return an empty findings array.
Each finding must include severity, title, description, optional file/line if clearly identifiable, and a recommendation.`;

export async function securityRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  const userPrompt = [
    state.compactContext,
    "",
    "Security-sensitive filenames detected:",
    String(state.deterministicSummary.securitySensitive),
    "",
    "Change areas:",
    state.changeAreas.join(", ") || "unknown",
    "",
    "Diff:",
    state.diff,
  ].join("\n");

  const result = await invokeStructured(findingsOutputSchema, SYSTEM_PROMPT, userPrompt);

  return { securityFindings: result.findings };
}
