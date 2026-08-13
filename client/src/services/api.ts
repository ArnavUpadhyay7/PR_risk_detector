export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFinding {
  severity: RiskLevel;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

export interface PRRiskReport {
  overallRisk: RiskLevel;
  riskScore: number;
  summary: string;
  bugRisk: number;
  securityRisk: number;
  testingRisk: number;
  findings: RiskFinding[];
  recommendations: string[];
  warnings: string[];
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
}

export interface ApiErrorResponse {
  error: string;
}

export class ApiRequestError extends Error {
  readonly statusCode: number | null;

  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function analyzePullRequest(prUrl: string): Promise<PrAnalysisResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}/api/pr/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prUrl }),
    });
  } catch {
    throw new ApiRequestError(
      "Unable to reach the server. Make sure the backend is running.",
      null,
    );
  }

  const data = (await response.json()) as PrAnalysisResponse | ApiErrorResponse;

  if (!response.ok) {
    const message =
      "error" in data && typeof data.error === "string"
        ? data.error
        : response.status === 502 || response.status === 504
          ? "Analysis couldn't be completed because the AI provider timed out. Please try again."
          : "Something went wrong while analyzing the pull request.";
    throw new ApiRequestError(message, response.status);
  }

  return data as PrAnalysisResponse;
}

export function parsePrDisplayInfo(prUrl: string): { repository: string; pullNumber: string; title?: string } {
  const match = prUrl.trim().match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/i);
  if (!match) {
    return { repository: "GitHub PR", pullNumber: "" };
  }

  return {
    repository: match[1] ?? "GitHub PR",
    pullNumber: match[2] ?? "",
  };
}
