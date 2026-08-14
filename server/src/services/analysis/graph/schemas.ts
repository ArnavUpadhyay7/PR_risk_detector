import { z } from "zod";

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const findingCategorySchema = z.enum([
  "SECURITY",
  "QUALITY",
  "PERFORMANCE",
  "BUG",
]);
export type FindingCategory = z.infer<typeof findingCategorySchema>;

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

export type RawRiskFinding = z.infer<typeof rawRiskFindingSchema>;

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

export type RiskFinding = z.infer<typeof riskFindingSchema>;

export const changeClassificationSchema = z.object({
  areas: z.array(z.string()),
  bugRelevant: z.boolean(),
  securityRelevant: z.boolean(),
  qualityRelevant: z.boolean(),
  performanceRelevant: z.boolean(),
});

export type ChangeClassification = z.infer<typeof changeClassificationSchema>;

export const findingsOutputSchema = z.object({
  findings: z.array(rawRiskFindingSchema).max(3),
});

export const aggregatorOutputSchema = z.object({
  summary: z.string().min(1).max(300),
  recommendations: z.array(z.string().max(200)).max(5),
});

export type AggregatorOutput = z.infer<typeof aggregatorOutputSchema>;

export interface ParsedDiffLineResponse {
  type: "add" | "remove" | "context";
  content: string;
  oldLine?: number;
  newLine?: number;
  diffPosition: number;
}

export interface FileDiffResponse {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  lines: ParsedDiffLineResponse[];
}

export interface PRRiskReport {
  overallRisk: RiskLevel;
  riskScore: number;
  summary: string;
  securityRisk: number;
  qualityRisk: number;
  performanceRisk: number;
  bugRisk: number;
  findings: RiskFinding[];
  recommendations: string[];
  warnings: string[];
  fileDiffs: FileDiffResponse[];
}
