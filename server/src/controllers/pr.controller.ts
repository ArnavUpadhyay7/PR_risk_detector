import type { Request, Response, NextFunction } from "express";
import { parseGitHubPrUrl } from "../utils/parsePrUrl.js";
import { AppError } from "../utils/AppError.js";
import { githubService } from "../services/github/github.service.js";
import { analysisService } from "../services/analysis/analysis.service.js";
import { saveAnalysisRecord } from "../models/analysis.model.js";
import type { PrAnalysisResponse } from "../types/analysis.types.js";

export async function analyzePr(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { prUrl } = req.body as { prUrl?: unknown };

    if (typeof prUrl !== "string" || prUrl.trim().length === 0) {
      throw new AppError("Please provide a GitHub Pull Request URL.", 400);
    }

    let parsed;
    try {
      parsed = parseGitHubPrUrl(prUrl);
    } catch {
      throw new AppError(
        "Invalid GitHub Pull Request URL. Expected format: https://github.com/owner/repository/pull/123",
        400,
      );
    }

    const githubStarted = performance.now();
    const pullRequest = await githubService.getPullRequest(parsed);
    console.log(`[PR] GitHub fetch: ${Math.round(performance.now() - githubStarted)}ms`);

    const analysisStarted = performance.now();
    const analysis = await analysisService.analyzePR({
      prUrl: prUrl.trim(),
      pullRequest,
      repository: `${parsed.owner}/${parsed.repository}`,
      pullNumber: parsed.pullNumber,
      owner: parsed.owner,
    });
    console.log(`[PR] analysis total: ${Math.round(performance.now() - analysisStarted)}ms`);

    const response: PrAnalysisResponse = {
      pullRequest: {
        title: pullRequest.title,
        repository: `${parsed.owner}/${parsed.repository}`,
        author: pullRequest.author,
        baseBranch: pullRequest.baseBranch,
        headBranch: pullRequest.headBranch,
        additions: pullRequest.additions,
        deletions: pullRequest.deletions,
        filesChanged: pullRequest.changedFiles,
      },
      analysis,
    };

    const saved = await saveAnalysisRecord({
      userId: req.user.id,
      prUrl: prUrl.trim(),
      pullNumber: parsed.pullNumber,
      commitSha: pullRequest.headSha,
      response,
    });

    res.json({
      ...response,
      analysisId: saved?._id.toString() ?? null,
    });
  } catch (error) {
    next(error);
  }
}
