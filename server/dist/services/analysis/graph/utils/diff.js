const MAX_PATCH_LINES_PER_FILE = 120;
const MAX_TOTAL_DIFF_CHARS = 12_000;
export function buildCompactDiff(files) {
    const sections = [];
    let totalChars = 0;
    for (const file of files) {
        if (!file.patch) {
            sections.push(`--- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}, no patch)`);
            continue;
        }
        const patchLines = file.patch.split("\n").slice(0, MAX_PATCH_LINES_PER_FILE);
        const truncated = file.patch.split("\n").length > MAX_PATCH_LINES_PER_FILE;
        const patchBody = patchLines.join("\n");
        const section = [
            `--- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`,
            patchBody,
            truncated ? "... [patch truncated]" : "",
        ]
            .filter(Boolean)
            .join("\n");
        if (totalChars + section.length > MAX_TOTAL_DIFF_CHARS) {
            sections.push("... [remaining diffs omitted due to size limit]");
            break;
        }
        sections.push(section);
        totalChars += section.length;
    }
    return sections.join("\n\n");
}
export function buildCompactContext(title, description, baseBranch, headBranch, files, deterministicSummary) {
    const fileList = files
        .map((file) => `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`)
        .join("\n");
    return [
        `Title: ${title}`,
        `Branches: ${headBranch} → ${baseBranch}`,
        `Description: ${description || "(none)"}`,
        "",
        "Deterministic signals:",
        `- Files changed: ${deterministicSummary.filesChanged}`,
        `- Additions/deletions: +${deterministicSummary.additions}/-${deterministicSummary.deletions}`,
        `- Test files changed: ${deterministicSummary.testsChanged}`,
        `- Security-sensitive filenames: ${deterministicSummary.securitySensitive}`,
        `- Extensions: ${deterministicSummary.fileExtensions.join(", ") || "none"}`,
        "",
        "Changed files:",
        fileList,
    ].join("\n");
}
//# sourceMappingURL=diff.js.map