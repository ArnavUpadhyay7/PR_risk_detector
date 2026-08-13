export interface ParsedPrUrl {
  owner: string;
  repository: string;
  pullNumber: number;
}

export interface GitHubPullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GitHubPullRequest {
  title: string;
  body: string | null;
  author: string;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  files: GitHubPullRequestFile[];
}
