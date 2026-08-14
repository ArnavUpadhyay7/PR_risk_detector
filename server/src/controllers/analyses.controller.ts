import type { Request, Response, NextFunction } from "express";
import {
  compareAnalyses,
  getAnalysisById,
  getDashboardStats,
  getPrHistory,
  getRepositories,
  listAnalyses,
} from "../services/analysis/analysis-record.service.js";

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getDashboardStats(req.user!.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function getAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listAnalyses(req.user!.id, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      riskLevel: typeof req.query.riskLevel === "string" ? req.query.riskLevel : undefined,
      repository: typeof req.query.repository === "string" ? req.query.repository : undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
      page: req.query.page ? Number.parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? Number.parseInt(String(req.query.limit), 10) : 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const analysis = await getAnalysisById(req.user!.id, req.params.id!);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysisHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const history = await getPrHistory(req.user!.id, req.params.id!);
    res.json({ history });
  } catch (error) {
    next(error);
  }
}

export async function compareAnalysisPair(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const comparison = await compareAnalyses(
      req.user!.id,
      req.params.id1!,
      req.params.id2!,
    );
    res.json(comparison);
  } catch (error) {
    next(error);
  }
}

export async function getRepos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const repositories = await getRepositories(req.user!.id);
    res.json({ repositories });
  } catch (error) {
    next(error);
  }
}
