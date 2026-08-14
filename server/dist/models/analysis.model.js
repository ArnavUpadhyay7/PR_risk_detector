import mongoose, { Schema } from "mongoose";
const findingSchema = new Schema({
    id: { type: String, required: true },
    category: { type: String, required: true },
    severity: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    file: { type: String, required: true },
    line: { type: Number },
    endLine: { type: Number },
    evidence: { type: String },
    recommendation: { type: String, required: true },
    confidence: { type: Number, required: true },
}, { _id: false });
const analysisSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repository: {
        owner: { type: String, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true, index: true },
    },
    pr: {
        number: { type: Number, required: true, index: true },
        title: { type: String, required: true },
        url: { type: String, required: true },
        author: { type: String, required: true },
        baseBranch: { type: String, required: true },
        headBranch: { type: String, required: true },
        additions: { type: Number, required: true },
        deletions: { type: Number, required: true },
        filesChanged: { type: Number, required: true },
    },
    commitSha: { type: String, required: true, index: true },
    riskScore: { type: Number, required: true, index: true },
    riskLevel: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    securityRisk: { type: Number, required: true },
    qualityRisk: { type: Number, required: true },
    performanceRisk: { type: Number, required: true },
    bugRisk: { type: Number, required: true },
    findings: { type: [findingSchema], default: [] },
    recommendations: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    analysisSummary: { type: Schema.Types.Mixed, required: true },
    riskReport: { type: Schema.Types.Mixed, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ userId: 1, "repository.fullName": 1, "pr.number": 1, createdAt: -1 });
export const AnalysisModel = mongoose.models.Analysis ?? mongoose.model("Analysis", analysisSchema);
export async function saveAnalysisRecord(input) {
    if (mongoose.connection.readyState !== 1) {
        console.warn("MongoDB not connected — analysis not persisted.");
        return null;
    }
    const [owner, name] = input.response.pullRequest.repository.split("/");
    if (!owner || !name) {
        throw new Error("Invalid repository in analysis response");
    }
    const { riskReport, summary } = input.response.analysis;
    return AnalysisModel.create({
        userId: input.userId,
        repository: { owner, name, fullName: `${owner}/${name}` },
        pr: {
            number: input.pullNumber,
            title: input.response.pullRequest.title,
            url: input.prUrl,
            author: input.response.pullRequest.author,
            baseBranch: input.response.pullRequest.baseBranch,
            headBranch: input.response.pullRequest.headBranch,
            additions: input.response.pullRequest.additions,
            deletions: input.response.pullRequest.deletions,
            filesChanged: input.response.pullRequest.filesChanged,
        },
        commitSha: input.commitSha,
        riskScore: riskReport.riskScore,
        riskLevel: riskReport.overallRisk,
        summary: riskReport.summary,
        securityRisk: riskReport.securityRisk,
        qualityRisk: riskReport.qualityRisk,
        performanceRisk: riskReport.performanceRisk,
        bugRisk: riskReport.bugRisk,
        findings: riskReport.findings,
        recommendations: riskReport.recommendations,
        warnings: riskReport.warnings,
        analysisSummary: summary,
        riskReport,
    });
}
//# sourceMappingURL=analysis.model.js.map