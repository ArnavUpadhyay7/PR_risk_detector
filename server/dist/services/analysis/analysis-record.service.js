import { AnalysisModel } from "../models/analysis.model.js";
import { AppError } from "../utils/AppError.js";
function mapFinding(finding) {
    return { ...finding };
}
function toRecordResponse(doc) {
    return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        repository: {
            owner: doc.repository.owner,
            name: doc.repository.name,
            fullName: doc.repository.fullName,
        },
        pr: {
            number: doc.pr.number,
            title: doc.pr.title,
            url: doc.pr.url,
            author: doc.pr.author,
            baseBranch: doc.pr.baseBranch,
            headBranch: doc.pr.headBranch,
            additions: doc.pr.additions,
            deletions: doc.pr.deletions,
            filesChanged: doc.pr.filesChanged,
        },
        commitSha: doc.commitSha,
        riskScore: doc.riskScore,
        riskLevel: doc.riskLevel,
        summary: doc.summary,
        securityRisk: doc.securityRisk,
        qualityRisk: doc.qualityRisk,
        performanceRisk: doc.performanceRisk,
        bugRisk: doc.bugRisk,
        findings: doc.findings.map(mapFinding),
        recommendations: doc.recommendations,
        warnings: doc.warnings,
        analysisSummary: doc.analysisSummary,
        riskReport: doc.riskReport,
        createdAt: doc.createdAt.toISOString(),
    };
}
function toListItem(doc) {
    return {
        id: doc._id.toString(),
        repository: doc.repository.fullName,
        prNumber: doc.pr.number,
        prTitle: doc.pr.title,
        prUrl: doc.pr.url,
        commitSha: doc.commitSha,
        riskScore: doc.riskScore,
        riskLevel: doc.riskLevel,
        findingsCount: doc.findings.length,
        createdAt: doc.createdAt.toISOString(),
    };
}
export async function getDashboardStats(userId) {
    const analyses = await AnalysisModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const totalAnalyses = analyses.length;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let criticalRisk = 0;
    let scoreSum = 0;
    for (const analysis of analyses) {
        scoreSum += analysis.riskScore;
        switch (analysis.riskLevel) {
            case "CRITICAL":
                criticalRisk += 1;
                highRisk += 1;
                break;
            case "HIGH":
                highRisk += 1;
                break;
            case "MEDIUM":
                mediumRisk += 1;
                break;
            default:
                lowRisk += 1;
        }
    }
    const recentDocs = await AnalysisModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(8);
    return {
        totalAnalyses,
        highRisk,
        mediumRisk,
        lowRisk,
        averageRiskScore: totalAnalyses > 0 ? Math.round(scoreSum / totalAnalyses) : 0,
        riskDistribution: {
            high: highRisk,
            medium: mediumRisk,
            low: lowRisk,
            critical: criticalRisk,
        },
        recentAnalyses: recentDocs.map((doc) => toListItem(doc)),
    };
}
export async function listAnalyses(userId, query) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const filter = { userId };
    if (query.riskLevel) {
        filter.riskLevel = query.riskLevel.toUpperCase();
    }
    if (query.repository) {
        filter["repository.fullName"] = { $regex: query.repository, $options: "i" };
    }
    if (query.search) {
        filter.$or = [
            { "pr.title": { $regex: query.search, $options: "i" } },
            { "repository.fullName": { $regex: query.search, $options: "i" } },
            { commitSha: { $regex: query.search, $options: "i" } },
        ];
    }
    let sort = { createdAt: -1 };
    if (query.sort === "oldest")
        sort = { createdAt: 1 };
    if (query.sort === "risk-high")
        sort = { riskScore: -1 };
    if (query.sort === "risk-low")
        sort = { riskScore: 1 };
    const [docs, total] = await Promise.all([
        AnalysisModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
        AnalysisModel.countDocuments(filter),
    ]);
    return {
        items: docs.map((doc) => toListItem(doc)),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}
export async function getAnalysisById(userId, analysisId) {
    const doc = await AnalysisModel.findOne({ _id: analysisId, userId });
    if (!doc) {
        throw new AppError("Analysis not found.", 404);
    }
    return toRecordResponse(doc);
}
export async function getPrHistory(userId, analysisId) {
    const current = await AnalysisModel.findOne({ _id: analysisId, userId });
    if (!current) {
        throw new AppError("Analysis not found.", 404);
    }
    const history = await AnalysisModel.find({
        userId,
        "repository.fullName": current.repository.fullName,
        "pr.number": current.pr.number,
    }).sort({ createdAt: 1 });
    return history.map((doc) => ({
        id: doc._id.toString(),
        commitSha: doc.commitSha,
        riskScore: doc.riskScore,
        riskLevel: doc.riskLevel,
        findingsCount: doc.findings.length,
        createdAt: doc.createdAt.toISOString(),
    }));
}
function findingKey(finding) {
    return `${finding.file}:${finding.line ?? "na"}:${finding.title.toLowerCase()}`;
}
export async function compareAnalyses(userId, id1, id2) {
    const [doc1, doc2] = await Promise.all([
        AnalysisModel.findOne({ _id: id1, userId }),
        AnalysisModel.findOne({ _id: id2, userId }),
    ]);
    if (!doc1 || !doc2) {
        throw new AppError("One or both analyses not found.", 404);
    }
    if (doc1.repository.fullName !== doc2.repository.fullName ||
        doc1.pr.number !== doc2.pr.number) {
        throw new AppError("Analyses must belong to the same pull request.", 400);
    }
    const [older, newer] = doc1.createdAt <= doc2.createdAt ? [doc1, doc2] : [doc2, doc1];
    const previous = toRecordResponse(older);
    const current = toRecordResponse(newer);
    const previousKeys = new Set(previous.findings.map(findingKey));
    const currentKeys = new Set(current.findings.map(findingKey));
    const resolvedFindings = previous.findings.filter((finding) => !currentKeys.has(findingKey(finding)));
    const newFindings = current.findings.filter((finding) => !previousKeys.has(findingKey(finding)));
    const improvements = resolvedFindings
        .slice(0, 5)
        .map((finding) => `${finding.title} resolved`);
    const remainingRisks = current.findings
        .slice(0, 5)
        .map((finding) => finding.title);
    return {
        previous,
        current,
        diff: {
            riskScore: {
                previous: previous.riskScore,
                current: current.riskScore,
                delta: current.riskScore - previous.riskScore,
            },
            securityRisk: {
                previous: previous.securityRisk,
                current: current.securityRisk,
                delta: current.securityRisk - previous.securityRisk,
            },
            qualityRisk: {
                previous: previous.qualityRisk,
                current: current.qualityRisk,
                delta: current.qualityRisk - previous.qualityRisk,
            },
            performanceRisk: {
                previous: previous.performanceRisk,
                current: current.performanceRisk,
                delta: current.performanceRisk - previous.performanceRisk,
            },
            bugRisk: {
                previous: previous.bugRisk,
                current: current.bugRisk,
                delta: current.bugRisk - previous.bugRisk,
            },
            findingsCount: {
                previous: previous.findings.length,
                current: current.findings.length,
                delta: current.findings.length - previous.findings.length,
            },
        },
        improvements,
        remainingRisks,
        resolvedFindings,
        newFindings,
    };
}
export async function getRepositories(userId) {
    const repos = await AnalysisModel.distinct("repository.fullName", { userId });
    return repos.sort();
}
//# sourceMappingURL=analysis-record.service.js.map