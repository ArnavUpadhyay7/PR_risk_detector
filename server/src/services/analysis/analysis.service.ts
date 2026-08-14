import type { AnalyzePrInput, AnalysisResult } from "../../types/analysis.types.js";
import { computeDeterministicSummary } from "./deterministic.service.js";
import { runRiskAnalysisWorkflow } from "./graph/graph.js";
import type { PRRiskState } from "./graph/state.js";
import { AppError } from "../../utils/AppError.js";

function buildInitialState(input: AnalyzePrInput): PRRiskState {
  const [owner, repo] = input.repository.split("/");

  if (!owner || !repo) {
    throw new AppError("Invalid repository identifier.", 500);
  }

  const deterministicSummary = computeDeterministicSummary(input.pullRequest);

  return {
    prUrl: input.prUrl,
    owner,
    repo,
    pullNumber: input.pullNumber,
    title: input.pullRequest.title,
    description: input.pullRequest.body ?? "",
    baseBranch: input.pullRequest.baseBranch,
    headBranch: input.pullRequest.headBranch,
    filesChanged: input.pullRequest.files,
    diff: "",
    compactContext: "",
    fileDiffs: [],
    deterministicSummary,
    changeAreas: [],
    classification: undefined,
    agentsPending: 0,
    agentsDone: 0,
    agentWarnings: [],
    securityFindings: [],
    qualityFindings: [],
    performanceFindings: [],
    bugFindings: [],
    finalReport: undefined,
  };
}

export async function analyzePR(input: AnalyzePrInput): Promise<AnalysisResult> {
  const deterministicSummary = computeDeterministicSummary(input.pullRequest);
  const initialState = buildInitialState(input);
  const finalState = await runRiskAnalysisWorkflow(initialState);

  if (!finalState.finalReport) {
    throw new AppError("AI workflow did not produce a risk report.", 502);
  }

  return {
    summary: deterministicSummary,
    riskReport: finalState.finalReport,
  };
}

export const analysisService = {
  analyzePR,
};
