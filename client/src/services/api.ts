const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FindingCategory = "SECURITY" | "QUALITY" | "PERFORMANCE" | "BUG";

export interface User {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string;
  email?: string;
}

export interface RiskFinding {
  id: string;
  category: FindingCategory;
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  file: string;
  line?: number;
  endLine?: number;
  evidence?: string;
  diffPosition?: number;
  confidence: number;
}

export interface ParsedDiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLine?: number;
  newLine?: number;
  diffPosition: number;
}

export interface FileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  lines: ParsedDiffLine[];
}

export interface PRRiskReport {
  overallRisk: RiskLevel;
  riskScore: number;
  summary: string;
  securityRisk: number;
  qualityRisk: number;
  performanceRisk: number;
  bugRisk: number;
  findings: RiskFinding[];
  recommendations: string[];
  warnings: string[];
  fileDiffs: FileDiff[];
}

export interface AnalysisSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  totalChangedLines: number;
  fileExtensions: string[];
  testsChanged: boolean;
  securitySensitive: boolean;
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
  analysis: {
    summary: AnalysisSummary;
    riskReport: PRRiskReport;
  };
  analysisId?: string | null;
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

export interface AnalysisRecord extends Omit<AnalysisListItem, "repository"> {
  userId: string;
  repository: { owner: string; name: string; fullName: string };
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
  summary: string;
  securityRisk: number;
  qualityRisk: number;
  performanceRisk: number;
  bugRisk: number;
  findings: RiskFinding[];
  recommendations: string[];
  warnings: string[];
  analysisSummary: AnalysisSummary;
  riskReport: PRRiskReport;
}

export interface DashboardStats {
  totalAnalyses: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageRiskScore: number;
  riskDistribution: { high: number; medium: number; low: number; critical: number };
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
  previous: AnalysisRecord;
  current: AnalysisRecord;
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
  resolvedFindings: RiskFinding[];
  newFindings: RiskFinding[];
}

export class ApiRequestError extends Error {
  readonly statusCode: number | null;
  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError("Unable to reach the server.", null);
  }

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new ApiRequestError(
      data.error ?? "Request failed.",
      response.status,
    );
  }
  return data;
}

export const api = {
  getMe: () => request<{ user: User | null }>("/api/auth/me"),
  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  getDashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),
  listAnalyses: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ items: AnalysisListItem[]; total: number; page: number; totalPages: number }>(
      `/api/analyses?${query}`,
    );
  },
  getRepositories: () => request<{ repositories: string[] }>("/api/analyses/repositories"),
  getAnalysis: (id: string) => request<AnalysisRecord>(`/api/analyses/${id}`),
  getAnalysisHistory: (id: string) => request<{ history: PrHistoryItem[] }>(`/api/analyses/${id}/history`),
  compareAnalyses: (id1: string, id2: string) =>
    request<CompareResult>(`/api/analyses/compare/${id1}/${id2}`),
  analyzePullRequest: (prUrl: string) =>
    request<PrAnalysisResponse>("/api/pr/analyze", {
      method: "POST",
      body: JSON.stringify({ prUrl }),
    }),
};

export function getGitHubLoginUrl(): string {
  return `${API_BASE}/api/auth/github`;
}

export function abbreviateSha(sha: string): string {
  return sha.slice(0, 7);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
