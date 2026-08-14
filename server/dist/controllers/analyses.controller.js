import { compareAnalyses, getAnalysisById, getDashboardStats, getPrHistory, getRepositories, listAnalyses, } from "../services/analysis/analysis-record.service.js";
function paramValue(value) {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && typeof value[0] === "string")
        return value[0];
    return undefined;
}
export async function getStats(req, res, next) {
    try {
        const stats = await getDashboardStats(req.user.id);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
}
export async function getAnalyses(req, res, next) {
    try {
        const query = {
            page: req.query.page ? Number.parseInt(String(req.query.page), 10) : 1,
            limit: req.query.limit ? Number.parseInt(String(req.query.limit), 10) : 20,
        };
        const search = paramValue(req.query.search);
        const riskLevel = paramValue(req.query.riskLevel);
        const repository = paramValue(req.query.repository);
        const sort = paramValue(req.query.sort);
        if (search)
            query.search = search;
        if (riskLevel)
            query.riskLevel = riskLevel;
        if (repository)
            query.repository = repository;
        if (sort)
            query.sort = sort;
        const result = await listAnalyses(req.user.id, query);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
export async function getAnalysis(req, res, next) {
    try {
        const analysis = await getAnalysisById(req.user.id, paramValue(req.params.id));
        res.json(analysis);
    }
    catch (error) {
        next(error);
    }
}
export async function getAnalysisHistory(req, res, next) {
    try {
        const history = await getPrHistory(req.user.id, paramValue(req.params.id));
        res.json({ history });
    }
    catch (error) {
        next(error);
    }
}
export async function compareAnalysisPair(req, res, next) {
    try {
        const comparison = await compareAnalyses(req.user.id, paramValue(req.params.id1), paramValue(req.params.id2));
        res.json(comparison);
    }
    catch (error) {
        next(error);
    }
}
export async function getRepos(req, res, next) {
    try {
        const repositories = await getRepositories(req.user.id);
        res.json({ repositories });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=analyses.controller.js.map