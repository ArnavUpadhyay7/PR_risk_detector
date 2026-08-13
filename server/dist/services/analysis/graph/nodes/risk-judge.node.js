import { invokeStructured } from "../../../ai/llm.service.js";
import { riskJudgeOutputSchema, } from "../schemas.js";
const SYSTEM_PROMPT = `You are the final merge-risk judge for a pull request.

Synthesize specialist findings into a final merge-risk report.

Rules:
- Answer: "What could go wrong if this PR is merged?"
- Use ONLY evidence from the provided findings and PR context.
- Do NOT invent file names, line numbers, behaviors, or vulnerabilities.
- riskScore is 0-100 where 0-24 LOW, 25-49 MEDIUM, 50-74 HIGH, 75-100 CRITICAL.
- Do NOT mechanically average scores. A single CRITICAL security issue can make overall risk CRITICAL.
- bugRisk, securityRisk, testingRisk are category scores 0-100 based on specialist findings.
- recommendations must be actionable and tied to the findings.
- If a category had no specialist run or no findings, score that category low unless context suggests otherwise.`;
function mergeFindings(state) {
    return [
        ...state.bugFindings,
        ...state.securityFindings,
        ...state.testingFindings,
    ];
}
function severityRank(severity) {
    switch (severity) {
        case "CRITICAL":
            return 4;
        case "HIGH":
            return 3;
        case "MEDIUM":
            return 2;
        default:
            return 1;
    }
}
function sortFindings(findings) {
    return [...findings].sort((left, right) => severityRank(right.severity) - severityRank(left.severity));
}
export async function riskJudgeNode(state) {
    const allFindings = mergeFindings(state);
    const userPrompt = [
        "PR context:",
        state.compactContext,
        "",
        "Change areas:",
        state.changeAreas.join(", ") || "none",
        "",
        "Classification:",
        JSON.stringify(state.classification ?? {}, null, 2),
        "",
        "Bug findings:",
        JSON.stringify(state.bugFindings, null, 2),
        "",
        "Security findings:",
        JSON.stringify(state.securityFindings, null, 2),
        "",
        "Testing findings:",
        JSON.stringify(state.testingFindings, null, 2),
    ].join("\n");
    const judge = await invokeStructured(riskJudgeOutputSchema, SYSTEM_PROMPT, userPrompt);
    const finalReport = {
        overallRisk: judge.overallRisk,
        riskScore: judge.riskScore,
        summary: judge.summary,
        bugRisk: judge.bugRisk,
        securityRisk: judge.securityRisk,
        testingRisk: judge.testingRisk,
        findings: sortFindings(allFindings),
        recommendations: judge.recommendations,
    };
    return { finalReport };
}
//# sourceMappingURL=risk-judge.node.js.map