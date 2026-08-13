import type { ParsedPrUrl } from "../types/github.types.js";

const GITHUB_PR_URL_PATTERN =
  /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)\/?(?:[#?].*)?$/;

export function parseGitHubPrUrl(url: string): ParsedPrUrl {
  const trimmed = url.trim();
  const match = GITHUB_PR_URL_PATTERN.exec(trimmed);

  if (!match) {
    throw new Error("Invalid GitHub Pull Request URL");
  }

  const owner = match[1];
  const repository = match[2];
  const pullNumber = match[3];

  if (!owner || !repository || !pullNumber) {
    throw new Error("Invalid GitHub Pull Request URL");
  }

  return {
    owner,
    repository,
    pullNumber: Number.parseInt(pullNumber, 10),
  };
}
