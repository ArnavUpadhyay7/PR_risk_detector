import { z } from "zod";
export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const findingCategorySchema = z.enum([
    "SECURITY",
    "QUALITY",
    "PERFORMANCE",
    "BUG",
]);
export const rawRiskFindingSchema = z.object({
    severity: riskLevelSchema,
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(200),
    file: z.string().min(1).max(200),
    line: z.number().int().positive().nullable().optional(),
    endLine: z.number().int().positive().nullable().optional(),
    evidence: z.string().max(200).nullable().optional(),
    recommendation: z.string().min(1).max(200),
    confidence: z.number().min(0).max(1),
});
export const riskFindingSchema = z.object({
    id: z.string().uuid(),
    category: findingCategorySchema,
    severity: riskLevelSchema,
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(200),
    recommendation: z.string().min(1).max(200),
    file: z.string().min(1).max(200),
    line: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
    evidence: z.string().max(200).optional(),
    diffPosition: z.number().int().nonnegative().optional(),
    confidence: z.number().min(0).max(1),
});
export const changeClassificationSchema = z.object({
    areas: z.array(z.string()),
    bugRelevant: z.boolean(),
    securityRelevant: z.boolean(),
    qualityRelevant: z.boolean(),
    performanceRelevant: z.boolean(),
});
export const findingsOutputSchema = z.object({
    findings: z.array(rawRiskFindingSchema).max(3),
});
export const aggregatorOutputSchema = z.object({
    summary: z.string().min(1).max(300),
    recommendations: z.array(z.string().max(200)).max(5),
});
//# sourceMappingURL=schemas.js.map