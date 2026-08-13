import type { PRRiskState } from "../state.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import { findingsOutputSchema } from "../schemas.js";
import { buildSecurityAgentContext } from "../utils/context-builders.js";
import { endTimer, startTimer } from "../utils/timing.js";

const SYSTEM_PROMPT = `You analyze pull requests for security merge risks only.

Return concise structured JSON (max 3 findings).
Focus on auth, authorization, secrets, input handling, permissions, tokens, sensitive data.
Do NOT invent vulnerabilities.
Keep descriptions to one short sentence.`;

export async function securityRiskNode(
  state: PRRiskState,
): Promise<Partial<PRRiskState>> {
  startTimer("security analysis");

  const userPrompt = buildSecurityAgentContext({
    title: state.title,
    description: state.description,
    files: state.filesChanged,
    securitySensitive: state.deterministicSummary.securitySensitive,
  });

  const result = await invokeStructuredSafe(
    findingsOutputSchema,
    SYSTEM_PROMPT,
    userPrompt,
    "specialist",
  );

  endTimer("security analysis");

  if (result.data === null) {
    return {
      securityFindings: [],
      agentsDone: 1,
      agentWarnings: [result.error ?? "Security risk analysis unavailable."],
    };
  }

  return {
    securityFindings: result.data.findings,
    agentsDone: 1,
  };
}
