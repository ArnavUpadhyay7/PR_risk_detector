import type { PRRiskState } from "../state.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import { combinedFindingsOutputSchema } from "../schemas.js";
import { buildBugAgentContext, buildSecurityAgentContext, buildTestingAgentContext } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You analyze merge risk for a pull request across bug, security, and testing dimensions.

Return concise structured JSON only.
- bugFindings: functional/logic merge risks
- securityFindings: auth, input, secrets, permissions, sensitive data risks
- testingFindings: missing or inadequate test coverage for changed behavior

Rules:
- Keep each finding short and actionable (title <= 12 words, description <= 1 sentence).
- Max 3 findings per category.
- Do NOT invent issues. Return empty arrays when no meaningful risk exists.
- Do NOT review style or formatting.`;

export async function combinedRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("combined risk analysis");

  const userPrompt = [
    buildBugAgentContext({
      title: state.title,
      description: state.description,
      files: state.filesChanged,
    }),
    "",
    "--- Security context ---",
    buildSecurityAgentContext({
      title: state.title,
      description: state.description,
      files: state.filesChanged,
      securitySensitive: state.deterministicSummary.securitySensitive,
    }),
    "",
    "--- Testing context ---",
    buildTestingAgentContext({
      title: state.title,
      files: state.filesChanged,
      testsChanged: state.deterministicSummary.testsChanged,
    }),
  ].join("\n");

  const result = await invokeStructuredSafe(
    combinedFindingsOutputSchema,
    SYSTEM_PROMPT,
    userPrompt,
    "combined",
  );

  endTimer("combined risk analysis");

  if (result.data === null) {
    return {
      agentWarnings: [
        `${result.error ?? "Combined risk analysis unavailable"} — bug, security, and testing findings could not be generated.`,
      ],
    };
  }

  return {
    bugFindings: result.data.bugFindings,
    securityFindings: result.data.securityFindings,
    testingFindings: result.data.testingFindings,
  };
}
