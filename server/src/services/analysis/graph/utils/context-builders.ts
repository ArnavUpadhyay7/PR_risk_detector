import type { GitHubPullRequestFile } from "../../../../types/github.types.js";
import type { ParsedFileDiff } from "./diff/parsePatch.js";

const TEST_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|test|tests|spec|__spec__)(?:\/|$)|\.(?:test|spec)\.[a-z0-9]+$/i;

const SECURITY_FILE_PATTERN =
  /(?:^|\/)(?:auth|authentication|security|password|credential|token|secret|oauth|jwt|session|permission|acl|rbac|encrypt|crypto|ssl|tls|middleware)(?:\/|\.|$)/i;

const API_FILE_PATTERN = /(?:^|\/)(?:routes|api|controllers|handlers|middleware)(?:\/|\.)/i;
const DB_FILE_PATTERN = /(?:^|\/)(?:migrations|models|schema|database|db|queries|repository|repositories)(?:\/|\.)/i;
const PERF_FILE_PATTERN = /(?:^|\/)(?:db|database|queries|repository|cache|render|worker|jobs)(?:\/|\.)/i;

const MAX_PATCH_LINES = 50;
const MAX_CHARS = 3_500;

function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERN.test(filename);
}

function isSecurityFile(filename: string): boolean {
  return SECURITY_FILE_PATTERN.test(filename) || API_FILE_PATTERN.test(filename);
}

function isPerformanceFile(filename: string): boolean {
  return PERF_FILE_PATTERN.test(filename) || DB_FILE_PATTERN.test(filename);
}

function buildAnnotatedDiff(
  fileDiffs: ParsedFileDiff[],
  maxChars: number,
): string {
  const sections: string[] = [];
  let totalChars = 0;

  for (const fileDiff of fileDiffs) {
    const header = `--- ${fileDiff.filename} (+${fileDiff.additions}/-${fileDiff.deletions})`;
    const body = fileDiff.lines
      .slice(0, MAX_PATCH_LINES)
      .map((line) => {
        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
        const location =
          line.newLine !== undefined
            ? `[new:${line.newLine}]`
            : line.oldLine !== undefined
              ? `[old:${line.oldLine}]`
              : "";
        return `${prefix}${location} ${line.content}`;
      })
      .join("\n");

    const section = [header, body].join("\n");
    if (totalChars + section.length > maxChars) {
      sections.push("... [diff truncated]");
      break;
    }

    sections.push(section);
    totalChars += section.length;
  }

  return sections.join("\n\n");
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function selectFiles(
  files: GitHubPullRequestFile[],
  matcher: (filename: string) => boolean,
  limit: number,
): GitHubPullRequestFile[] {
  const matched = files.filter((file) => matcher(file.filename));
  const rest = files.filter((file) => !matcher(file.filename) && !isTestFile(file.filename));
  return [...matched, ...rest].slice(0, limit);
}

function buildContext(
  title: string,
  description: string,
  files: GitHubPullRequestFile[],
  fileDiffs: ParsedFileDiff[],
  extraLines: string[] = [],
): string {
  const selectedNames = new Set(files.map((file) => file.filename));
  const selectedDiffs = fileDiffs.filter((diff) => selectedNames.has(diff.filename));

  return [
    `Title: ${title}`,
    ...extraLines,
    `Description: ${truncateText(description || "(none)", 200)}`,
    `Files: ${files.map((file) => file.filename).join(", ") || "none"}`,
    "",
    "Diff (line numbers refer to the new file where applicable):",
    buildAnnotatedDiff(selectedDiffs, MAX_CHARS) || "(no diff)",
  ].join("\n");
}

export function buildSecurityAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
  fileDiffs: ParsedFileDiff[];
  securitySensitive: boolean;
}): string {
  const selected = selectFiles(input.files, isSecurityFile, 8);
  return buildContext(input.title, input.description, selected, input.fileDiffs, [
    `Security-sensitive filenames: ${input.securitySensitive ? "yes" : "no"}`,
  ]);
}

export function buildQualityAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
  fileDiffs: ParsedFileDiff[];
}): string {
  const selected = input.files.filter((file) => !isTestFile(file.filename)).slice(0, 8);
  return buildContext(input.title, input.description, selected, input.fileDiffs);
}

export function buildPerformanceAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
  fileDiffs: ParsedFileDiff[];
}): string {
  const selected = selectFiles(input.files, isPerformanceFile, 8);
  return buildContext(input.title, input.description, selected, input.fileDiffs);
}

export function buildBugAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
  fileDiffs: ParsedFileDiff[];
}): string {
  const selected = input.files.filter((file) => !isTestFile(file.filename)).slice(0, 8);
  return buildContext(input.title, input.description, selected, input.fileDiffs);
}

export function buildAggregatorContext(input: {
  title: string;
  changeAreas: string[];
  findings: unknown[];
  agentWarnings: string[];
  testsChanged: boolean;
}): string {
  return [
    `Title: ${input.title}`,
    `Areas: ${input.changeAreas.join(", ") || "none"}`,
    `Tests changed (deterministic): ${input.testsChanged ? "yes" : "no"}`,
    `Findings: ${JSON.stringify(input.findings)}`,
    input.agentWarnings.length > 0 ? `Warnings: ${input.agentWarnings.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function toFileDiffResponse(fileDiffs: ParsedFileDiff[]) {
  return fileDiffs.map((fileDiff) => ({
    filename: fileDiff.filename,
    status: fileDiff.status,
    additions: fileDiff.additions,
    deletions: fileDiff.deletions,
    lines: fileDiff.lines.map((line) => ({
      type: line.type,
      content: line.content,
      oldLine: line.oldLine,
      newLine: line.newLine,
      diffPosition: line.diffPosition,
    })),
  }));
}
