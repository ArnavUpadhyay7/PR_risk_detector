import type { GitHubPullRequest } from "./github.types.js";
import type { PRRiskReport } from "../services/analysis/graph/schemas.js";

export interface AnalysisSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  totalChangedLines: number;
  fileExtensions: string[];
  testsChanged: boolean;
  securitySensitive: boolean;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  riskReport: PRRiskReport;
}

export interface PrAnalysisResponse {
  pullRequest: {
    title: string;
    repository: string;
    author: string;
    baseBranch: string;
    headBranch: string;
    additions: number;
    deletions: number;
    filesChanged: number;
  };
  analysis: AnalysisResult;
}

export interface AnalyzePrInput {
  prUrl: string;
  pullRequest: GitHubPullRequest;
  repository: string;
  pullNumber: number;
  owner: string;
}

export type { PRRiskReport, RiskFinding, RiskLevel } from "../services/analysis/graph/schemas.js";
