import type { GitHubPullRequestFile } from "../../../../types/github.types.js";

const TEST_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|test|tests|spec|__spec__)(?:\/|$)|\.(?:test|spec)\.[a-z0-9]+$/i;

const SECURITY_FILE_PATTERN =
  /(?:^|\/)(?:auth|authentication|security|password|credential|token|secret|oauth|jwt|session|permission|acl|rbac|encrypt|crypto|ssl|tls|middleware)(?:\/|\.|$)/i;

const API_FILE_PATTERN = /(?:^|\/)(?:routes|api|controllers|handlers|middleware)(?:\/|\.)/i;

const MAX_PATCH_LINES = 60;
const MAX_CHARS = 4_000;

interface DiffOptions {
  include?: (file: GitHubPullRequestFile) => boolean;
  maxChars?: number;
}

function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERN.test(filename);
}

function isSecurityFile(filename: string): boolean {
  return SECURITY_FILE_PATTERN.test(filename) || API_FILE_PATTERN.test(filename);
}

function buildDiffSections(
  files: GitHubPullRequestFile[],
  maxChars: number,
): string {
  const sections: string[] = [];
  let totalChars = 0;

  for (const file of files) {
    const header = `--- ${file.filename} (+${file.additions}/-${file.deletions})`;
    if (!file.patch) {
      const section = `${header}\n(no patch)`;
      if (totalChars + section.length > maxChars) break;
      sections.push(section);
      totalChars += section.length;
      continue;
    }

    const lines = file.patch.split("\n").slice(0, MAX_PATCH_LINES);
    const section = [header, lines.join("\n")].join("\n");
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

export function buildBugAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
}): string {
  const implFiles = input.files.filter((file) => !isTestFile(file.filename));
  const diff = buildDiffSections(implFiles, MAX_CHARS);

  return [
    `Title: ${input.title}`,
    `Description: ${truncateText(input.description || "(none)", 250)}`,
    `Changed files: ${implFiles.map((f) => f.filename).join(", ") || "none"}`,
    "",
    "Diff:",
    diff || "(no code diff)",
  ].join("\n");
}

export function buildSecurityAgentContext(input: {
  title: string;
  description: string;
  files: GitHubPullRequestFile[];
  securitySensitive: boolean;
}): string {
  const priorityFiles = input.files.filter(
    (file) => isSecurityFile(file.filename) || isTestFile(file.filename) === false,
  );
  const securityFirst = [
    ...priorityFiles.filter((file) => isSecurityFile(file.filename)),
    ...priorityFiles.filter((file) => !isSecurityFile(file.filename)),
  ];
  const diff = buildDiffSections(securityFirst.slice(0, 8), MAX_CHARS);

  return [
    `Title: ${input.title}`,
    `Security-sensitive filenames: ${input.securitySensitive ? "yes" : "no"}`,
    `Priority files: ${securityFirst.map((f) => f.filename).join(", ") || "none"}`,
    "",
    "Diff:",
    diff || "(no diff)",
  ].join("\n");
}

export function buildTestingAgentContext(input: {
  title: string;
  files: GitHubPullRequestFile[];
  testsChanged: boolean;
}): string {
  const implFiles = input.files.filter((file) => !isTestFile(file.filename));
  const testFiles = input.files.filter((file) => isTestFile(file.filename));

  const diff = buildDiffSections(
    [...implFiles.slice(0, 6), ...testFiles.slice(0, 4)],
    MAX_CHARS,
  );

  return [
    `Title: ${input.title}`,
    `Test files changed: ${input.testsChanged ? "yes" : "no"}`,
    `Implementation files: ${implFiles.map((f) => f.filename).join(", ") || "none"}`,
    `Test files: ${testFiles.map((f) => f.filename).join(", ") || "none"}`,
    "",
    "Diff:",
    diff || "(no diff)",
  ].join("\n");
}

export function buildJudgeContext(input: {
  title: string;
  changeAreas: string[];
  bugFindings: unknown[];
  securityFindings: unknown[];
  testingFindings: unknown[];
  agentWarnings: string[];
}): string {
  return [
    `Title: ${input.title}`,
    `Areas: ${input.changeAreas.join(", ") || "none"}`,
    `Bug findings (${input.bugFindings.length}): ${JSON.stringify(input.bugFindings)}`,
    `Security findings (${input.securityFindings.length}): ${JSON.stringify(input.securityFindings)}`,
    `Testing findings (${input.testingFindings.length}): ${JSON.stringify(input.testingFindings)}`,
    input.agentWarnings.length > 0
      ? `Warnings: ${input.agentWarnings.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
