import { AppError } from "../../utils/AppError.js";
function getAuthHeaders() {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "PR-Risk-Analyzer",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}
async function fetchGitHub(url) {
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
    return response.json();
}
function mapFile(file) {
    const mapped = {
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
export async function getPullRequest(parsed) {
    const { owner, repository, pullNumber } = parsed;
    const baseUrl = `https://api.github.com/repos/${owner}/${repository}/pulls/${pullNumber}`;
    const [prData, filesData] = await Promise.all([
        fetchGitHub(baseUrl),
        fetchGitHub(`${baseUrl}/files?per_page=100`),
    ]);
    return {
        title: prData.title,
        body: prData.body,
        author: prData.user?.login ?? "unknown",
        baseBranch: prData.base.ref,
        headBranch: prData.head.ref,
        headSha: prData.head.sha,
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changed_files,
        files: filesData.map(mapFile),
    };
}
export const githubService = {
    getPullRequest,
};
//# sourceMappingURL=github.service.js.map