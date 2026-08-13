import type { GitHubPullRequest } from "../../types/github.types.js";
import type { AnalysisSummary } from "../../types/analysis.types.js";

const TEST_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|test|tests|spec|__spec__)(?:\/|$)|\.(?:test|spec)\.[a-z0-9]+$/i;

const SECURITY_SENSITIVE_PATTERN =
  /(?:^|\/)(?:auth|authentication|security|password|credential|token|secret|oauth|jwt|session|permission|acl|rbac|encrypt|crypto|ssl|tls)(?:\/|\.|$)/i;

function getFileExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return null;
  }

  return filename.slice(lastDot + 1).toLowerCase();
}

export function computeDeterministicSummary(pullRequest: GitHubPullRequest): AnalysisSummary {
  const extensions = new Set<string>();

  let testsChanged = false;
  let securitySensitive = false;

  for (const file of pullRequest.files) {
    const extension = getFileExtension(file.filename);
    if (extension) {
      extensions.add(extension);
    }

    if (TEST_FILE_PATTERN.test(file.filename)) {
      testsChanged = true;
    }

    if (SECURITY_SENSITIVE_PATTERN.test(file.filename)) {
      securitySensitive = true;
    }
  }

  return {
    filesChanged: pullRequest.changedFiles,
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    totalChangedLines: pullRequest.additions + pullRequest.deletions,
    fileExtensions: [...extensions].sort(),
    testsChanged,
    securitySensitive,
  };
}
