import type { ParsedPrUrl, GitHubPullRequest, GitHubPullRequestFile } from "../../types/github.types.js";
import { AppError } from "../../utils/AppError.js";

interface GitHubApiPullRequest {
  title: string;
  body: string | null;
  user: { login: string } | null;
  base: { ref: string };
  head: { ref: string };
  additions: number;
  deletions: number;
  changed_files: number;
}

interface GitHubApiPullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "PR-Risk-Analyzer",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGitHub<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: getAuthHeaders() });

  if (response.status === 404) {
    throw new AppError("Pull request not found. Check that the URL is correct and the repository is public.", 404);
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new AppError("GitHub API rate limit exceeded. Try again later or provide a GITHUB_TOKEN.", 502);
    }

    throw new AppError("Failed to retrieve pull request data from GitHub.", 502);
  }

  return response.json() as Promise<T>;
}

function mapFile(file: GitHubApiPullRequestFile): GitHubPullRequestFile {
  const mapped: GitHubPullRequestFile = {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
  };

  if (file.patch !== undefined) {
    mapped.patch = file.patch;
  }

  return mapped;
}

export async function getPullRequest(parsed: ParsedPrUrl): Promise<GitHubPullRequest> {
  const { owner, repository, pullNumber } = parsed;
  const baseUrl = `https://api.github.com/repos/${owner}/${repository}/pulls/${pullNumber}`;

  const [prData, filesData] = await Promise.all([
    fetchGitHub<GitHubApiPullRequest>(baseUrl),
    fetchGitHub<GitHubApiPullRequestFile[]>(`${baseUrl}/files?per_page=100`),
  ]);

  return {
    title: prData.title,
    body: prData.body,
    author: prData.user?.login ?? "unknown",
    baseBranch: prData.base.ref,
    headBranch: prData.head.ref,
    additions: prData.additions,
    deletions: prData.deletions,
    changedFiles: prData.changed_files,
    files: filesData.map(mapFile),
  };
}

export const githubService = {
  getPullRequest,
};
