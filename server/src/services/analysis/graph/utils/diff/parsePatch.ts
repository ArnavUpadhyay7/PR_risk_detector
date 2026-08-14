export type DiffLineType = "add" | "remove" | "context";

export interface ParsedDiffLine {
  type: DiffLineType;
  content: string;
  oldLine?: number;
  newLine?: number;
  diffPosition: number;
}

export interface ParsedFileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  lines: ParsedDiffLine[];
  /** New-file line numbers present in this patch hunk. */
  newFileLineNumbers: number[];
}

const HUNK_HEADER =
  /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parsePatch(
  filename: string,
  status: string,
  additions: number,
  deletions: number,
  patch?: string,
): ParsedFileDiff {
  const lines: ParsedDiffLine[] = [];
  const newFileLineNumbers: number[] = [];

  if (!patch) {
    return { filename, status, additions, deletions, lines, newFileLineNumbers };
  }

  let oldLine = 0;
  let newLine = 0;
  let diffPosition = 0;

  for (const rawLine of patch.split("\n")) {
    if (rawLine.startsWith("@@")) {
      const match = HUNK_HEADER.exec(rawLine);
      if (match) {
        oldLine = Number.parseInt(match[1] ?? "0", 10);
        newLine = Number.parseInt(match[3] ?? "0", 10);
      }
      continue;
    }

    if (rawLine.startsWith("\\")) {
      continue;
    }

    const prefix = rawLine[0] ?? " ";
    const content = rawLine.slice(1);

    if (prefix === "+") {
      lines.push({ type: "add", content, newLine, diffPosition });
      newFileLineNumbers.push(newLine);
      newLine += 1;
    } else if (prefix === "-") {
      lines.push({ type: "remove", content, oldLine, diffPosition });
      oldLine += 1;
    } else {
      lines.push({ type: "context", content, oldLine, newLine, diffPosition });
      newFileLineNumbers.push(newLine);
      oldLine += 1;
      newLine += 1;
    }

    diffPosition += 1;
  }

  return {
    filename,
    status,
    additions,
    deletions,
    lines,
    newFileLineNumbers: [...new Set(newFileLineNumbers)].sort((a, b) => a - b),
  };
}

export function parseAllPatches(
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>,
): ParsedFileDiff[] {
  return files.map((file) =>
    parsePatch(file.filename, file.status, file.additions, file.deletions, file.patch),
  );
}

export function findLineInDiff(
  fileDiff: ParsedFileDiff,
  line?: number,
): ParsedDiffLine | undefined {
  if (line === undefined) {
    return undefined;
  }

  return fileDiff.lines.find(
    (entry) => entry.newLine === line || entry.oldLine === line,
  );
}

export function getDiffPositionForLine(
  fileDiff: ParsedFileDiff,
  line?: number,
): number | undefined {
  const match = findLineInDiff(fileDiff, line);
  return match?.diffPosition;
}

export function lineIsInChangedHunk(fileDiff: ParsedFileDiff, line?: number): boolean {
  if (line === undefined) {
    return false;
  }

  return fileDiff.newFileLineNumbers.includes(line);
}

export function evidenceMatchesDiff(
  fileDiff: ParsedFileDiff,
  evidence: string,
  line?: number,
): boolean {
  const normalizedEvidence = evidence.trim().toLowerCase();
  if (!normalizedEvidence) {
    return false;
  }

  const candidates = line === undefined
    ? fileDiff.lines
    : fileDiff.lines.filter(
        (entry) => entry.newLine === line || entry.oldLine === line,
      );

  return candidates.some((entry) =>
    entry.content.toLowerCase().includes(normalizedEvidence) ||
    normalizedEvidence.includes(entry.content.trim().toLowerCase()),
  );
}
