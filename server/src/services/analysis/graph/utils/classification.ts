import type { GitHubPullRequestFile } from "../../../../types/github.types.js";
import type { AnalysisSummary } from "../../../../types/analysis.types.js";
import type { ChangeClassification } from "../schemas.js";

const TEST_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|test|tests|spec|__spec__)(?:\/|$)|\.(?:test|spec)\.[a-z0-9]+$/i;

const SECURITY_FILE_PATTERN =
  /(?:^|\/)(?:auth|authentication|security|password|credential|token|secret|oauth|jwt|session|permission|acl|rbac|encrypt|crypto|ssl|tls)(?:\/|\.|$)/i;

const AUTH_KEYWORD_PATTERN =
  /\b(auth|authentication|authorization|jwt|token|session|password|credential|oauth|permission|rbac)\b/i;

const API_FILE_PATTERN = /(?:^|\/)(?:routes|api|controllers|handlers|middleware)(?:\/|\.)/i;
const DB_FILE_PATTERN = /(?:^|\/)(?:migrations|models|schema|database|db|queries|repository|repositories)(?:\/|\.)/i;
const CONFIG_FILE_PATTERN = /(?:^|\/)(?:config|\.env|package\.json|docker|kubernetes|helm)(?:\/|\.|$)/i;
const PERF_KEYWORD_PATTERN =
  /\b(forEach|map\(|reduce\(|await\s+.+\(|query\(|findAll|findMany|loop|cache|render|sync)\b/i;

const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "kt", "rb", "php", "cs", "swift", "vue", "svelte",
]);

const DOC_EXTENSIONS = new Set(["md", "txt", "rst", "adoc"]);

function getExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return null;
  return filename.slice(lastDot + 1).toLowerCase();
}

function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERN.test(filename);
}

function isCodeFile(filename: string): boolean {
  const ext = getExtension(filename);
  return ext !== null && CODE_EXTENSIONS.has(ext);
}

function isDocOnlyFile(filename: string): boolean {
  const ext = getExtension(filename);
  return ext !== null && DOC_EXTENSIONS.has(ext);
}

function patchContainsKeyword(patch: string | undefined, pattern: RegExp): boolean {
  return patch !== undefined && pattern.test(patch);
}

export function classifyChanges(
  files: GitHubPullRequestFile[],
  summary: AnalysisSummary,
  title: string,
  description: string,
): ChangeClassification {
  const areas = new Set<string>();
  let codeFileCount = 0;
  let nonDocFileCount = 0;
  let hasAuthSignal = false;
  let hasApiSignal = false;
  let hasDbSignal = false;
  let hasConfigSignal = false;
  let hasPerfSignal = false;
  let hasImplementationChanges = false;

  for (const file of files) {
    if (!isDocOnlyFile(file.filename)) {
      nonDocFileCount += 1;
    }

    if (isCodeFile(file.filename) && !isTestFile(file.filename)) {
      codeFileCount += 1;
      hasImplementationChanges = true;
    }

    if (SECURITY_FILE_PATTERN.test(file.filename)) {
      areas.add("security");
      hasAuthSignal = true;
    }

    if (AUTH_KEYWORD_PATTERN.test(file.filename)) {
      areas.add("authentication");
      hasAuthSignal = true;
    }

    if (API_FILE_PATTERN.test(file.filename)) {
      areas.add("API");
      hasApiSignal = true;
    }

    if (DB_FILE_PATTERN.test(file.filename)) {
      areas.add("database");
      hasDbSignal = true;
      hasPerfSignal = true;
    }

    if (CONFIG_FILE_PATTERN.test(file.filename)) {
      areas.add("configuration");
      hasConfigSignal = true;
    }

    if (isTestFile(file.filename)) {
      areas.add("testing");
    }

    if (patchContainsKeyword(file.patch, AUTH_KEYWORD_PATTERN)) {
      areas.add("authentication");
      hasAuthSignal = true;
    }

    if (patchContainsKeyword(file.patch, PERF_KEYWORD_PATTERN)) {
      hasPerfSignal = true;
      areas.add("performance");
    }

    const ext = getExtension(file.filename);
    if (ext === "tsx" || ext === "jsx" || ext === "vue" || ext === "svelte") {
      areas.add("frontend");
    }
    if (ext === "ts" || ext === "js" || ext === "py" || ext === "go") {
      areas.add("backend");
    }
  }

  if (AUTH_KEYWORD_PATTERN.test(title) || AUTH_KEYWORD_PATTERN.test(description)) {
    areas.add("authentication");
    hasAuthSignal = true;
  }

  if (summary.securitySensitive) {
    areas.add("security");
  }

  const docsOnly = nonDocFileCount > 0 && codeFileCount === 0 && !summary.securitySensitive;

  const bugRelevant = hasImplementationChanges && !docsOnly;
  const securityRelevant =
    summary.securitySensitive || hasAuthSignal || hasApiSignal || hasConfigSignal;
  const qualityRelevant = hasImplementationChanges && !docsOnly;
  const performanceRelevant =
    hasPerfSignal || hasDbSignal || (hasImplementationChanges && areas.has("backend"));

  if (docsOnly) {
    areas.add("UI");
  }

  return {
    areas: [...areas].sort(),
    bugRelevant,
    securityRelevant,
    qualityRelevant,
    performanceRelevant,
  };
}

export function countRelevantAgents(classification: ChangeClassification): number {
  let count = 0;
  if (classification.securityRelevant) count += 1;
  if (classification.qualityRelevant) count += 1;
  if (classification.performanceRelevant) count += 1;
  if (classification.bugRelevant) count += 1;
  return count;
}

export function isTrivialChange(classification: ChangeClassification): boolean {
  return (
    !classification.bugRelevant &&
    !classification.securityRelevant &&
    !classification.qualityRelevant &&
    !classification.performanceRelevant
  );
}
