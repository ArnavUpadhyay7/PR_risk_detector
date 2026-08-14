import type { PRRiskReport } from "../services/analysis/graph/schemas.js";
import type { AnalysisSummary } from "./analysis.types.js";

export interface StoredFinding {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  file: string;
  line?: number;
  endLine?: number;
  evidence?: string;
  recommendation: string;
  confidence: number;
}

export interface AnalysisRecordResponse {
  id: string;
  userId: string;
  repository: {
    owner: string;
    name: string;
    fullName: string;
  };
  pr: {
    number: number;
    title: string;
    url: string;
    author: string;
    baseBranch: string;
    headBranch: string;
    additions: number;
    deletions: number;
    filesChanged: number;
  };
  commitSha: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  securityRisk: number;
  qualityRisk: number;
  performanceRisk: number;
  bugRisk: number;
  findings: StoredFinding[];
  recommendations: string[];
  warnings: string[];
  analysisSummary: AnalysisSummary;
  riskReport: PRRiskReport;
  createdAt: string;
}

export interface AnalysisListItem {
  id: string;
  repository: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  commitSha: string;
  riskScore: number;
  riskLevel: string;
  findingsCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageRiskScore: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
    critical: number;
  };
  recentAnalyses: AnalysisListItem[];
}

export interface PrHistoryItem {
  id: string;
  commitSha: string;
  riskScore: number;
  riskLevel: string;
  findingsCount: number;
  createdAt: string;
}

export interface CompareResult {
  previous: AnalysisRecordResponse;
  current: AnalysisRecordResponse;
  diff: {
    riskScore: { previous: number; current: number; delta: number };
    securityRisk: { previous: number; current: number; delta: number };
    qualityRisk: { previous: number; current: number; delta: number };
    performanceRisk: { previous: number; current: number; delta: number };
    bugRisk: { previous: number; current: number; delta: number };
    findingsCount: { previous: number; current: number; delta: number };
  };
  improvements: string[];
  remainingRisks: string[];
  resolvedFindings: StoredFinding[];
  newFindings: StoredFinding[];
}
