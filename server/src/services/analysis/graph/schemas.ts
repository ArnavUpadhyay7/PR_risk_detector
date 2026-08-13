import { z } from "zod";

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const riskFindingSchema = z.object({
  severity: riskLevelSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  recommendation: z.string().min(1),
});

export type RiskFinding = z.infer<typeof riskFindingSchema>;

export const changeClassificationSchema = z.object({
  areas: z.array(z.string()),
  bugRelevant: z.boolean(),
  securityRelevant: z.boolean(),
  testingRelevant: z.boolean(),
  performanceRelevant: z.boolean(),
});

export type ChangeClassification = z.infer<typeof changeClassificationSchema>;

export const findingsOutputSchema = z.object({
  findings: z.array(riskFindingSchema),
});

export const riskJudgeOutputSchema = z.object({
  overallRisk: riskLevelSchema,
  riskScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  bugRisk: z.number().min(0).max(100),
  securityRisk: z.number().min(0).max(100),
  testingRisk: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

export type RiskJudgeOutput = z.infer<typeof riskJudgeOutputSchema>;

export interface PRRiskReport {
  overallRisk: RiskLevel;
  riskScore: number;
  summary: string;
  bugRisk: number;
  securityRisk: number;
  testingRisk: number;
  findings: RiskFinding[];
  recommendations: string[];
}
