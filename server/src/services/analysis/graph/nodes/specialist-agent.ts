import type { PRRiskState } from "../state.js";
import type { FindingCategory, RawRiskFinding, RiskFinding } from "../schemas.js";
import { findingsOutputSchema } from "../schemas.js";
import { invokeStructuredSafe } from "../../../ai/llm.service.js";
import { validateFindings } from "../utils/diff/validateFindings.js";
import { endTimer, startTimer } from "../utils/timing.js";

type ContextBuilder = (state: PRRiskState) => string;

interface SpecialistAgentConfig {
  category: FindingCategory;
  timerLabel: string;
  findingsKey:
    | "securityFindings"
    | "qualityFindings"
    | "performanceFindings"
    | "bugFindings";
  warningLabel: string;
  systemPrompt: string;
  buildContext: ContextBuilder;
}

const SHARED_RULES = `
Rules:
- Return JSON only with a findings array (max 3 items).
- Every finding MUST include file (required), severity, title, description, recommendation, confidence (0-1).
- Include line and evidence ONLY when clearly identifiable from the annotated diff.
- evidence must be an exact or near-exact snippet from the diff.
- Do NOT invent files, line numbers, or vulnerabilities.
- Keep descriptions to one short sentence.
- Return an empty findings array if no meaningful issue exists.`;

export async function runSpecialistAgent(
  state: PRRiskState,
  config: SpecialistAgentConfig,
): Promise<Partial<PRRiskState>> {
  startTimer(config.timerLabel);
  console.log(`[AI] ${config.timerLabel}: started`);

  const userPrompt = config.buildContext(state);
  const result = await invokeStructuredSafe(
    findingsOutputSchema,
    `${config.systemPrompt}\n${SHARED_RULES}`,
    userPrompt,
    "specialist",
  );

  const duration = endTimer(config.timerLabel);
  console.log(`[AI] ${config.timerLabel}: ${duration}ms`);

  if (result.data === null) {
    return {
      [config.findingsKey]: [],
      agentsDone: 1,
      agentWarnings: [`${config.warningLabel} unavailable.`],
    } as Partial<PRRiskState>;
  }

  const validated = validateFindings(
    result.data.findings as RawRiskFinding[],
    config.category,
    state.fileDiffs,
  );

  return {
    [config.findingsKey]: validated,
    agentsDone: 1,
  } as Partial<PRRiskState>;
}
