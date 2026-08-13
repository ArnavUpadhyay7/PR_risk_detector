import { Annotation } from "@langchain/langgraph";
import type { GitHubPullRequestFile } from "../../../types/github.types.js";
import type { AnalysisSummary } from "../../../types/analysis.types.js";
import type {
  ChangeClassification,
  PRRiskReport,
  RiskFinding,
} from "./schemas.js";

export const PRRiskStateAnnotation = Annotation.Root({
  prUrl: Annotation<string>,
  owner: Annotation<string>,
  repo: Annotation<string>,
  pullNumber: Annotation<number>,
  title: Annotation<string>,
  description: Annotation<string>,
  baseBranch: Annotation<string>,
  headBranch: Annotation<string>,
  filesChanged: Annotation<GitHubPullRequestFile[]>,
  diff: Annotation<string>,
  compactContext: Annotation<string>,
  deterministicSummary: Annotation<AnalysisSummary>,
  changeAreas: Annotation<string[]>,
  classification: Annotation<ChangeClassification | undefined>,
  bugFindings: Annotation<RiskFinding[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
  securityFindings: Annotation<RiskFinding[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
  testingFindings: Annotation<RiskFinding[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
  finalReport: Annotation<PRRiskReport | undefined>,
});

export type PRRiskState = typeof PRRiskStateAnnotation.State;
