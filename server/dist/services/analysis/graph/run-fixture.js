import { setMockLlmHandler } from "../../ai/llm.service.js";
import { runRiskAnalysisWorkflow } from "./graph.js";
import { buildFixtureInitialState } from "./fixtures/sample-pr.fixture.js";
import { changeClassificationSchema, findingsOutputSchema, riskJudgeOutputSchema, } from "./schemas.js";
function createMockHandler() {
    return (systemPrompt, _userPrompt) => {
        if (systemPrompt.includes("classify pull request")) {
            return changeClassificationSchema.parse({
                areas: ["authentication", "backend", "API", "security"],
                bugRelevant: true,
                securityRelevant: true,
                testingRelevant: true,
                performanceRelevant: false,
            });
        }
        if (systemPrompt.includes("functional and logic bugs")) {
            return findingsOutputSchema.parse({
                findings: [
                    {
                        severity: "MEDIUM",
                        title: "Missing null check on decoded JWT payload",
                        description: "authMiddleware assigns req.user from jwt.verify without validating required claims exist before downstream route handlers read them.",
                        file: "src/middleware/auth.ts",
                        recommendation: "Validate decoded token shape and required claims before attaching req.user.",
                    },
                ],
            });
        }
        if (systemPrompt.includes("security risks")) {
            return findingsOutputSchema.parse({
                findings: [
                    {
                        severity: "HIGH",
                        title: "Authorization change without corresponding tests",
                        description: "Admin route now checks req.user.isAdmin, but no test changes were included to verify forbidden access for non-admin users.",
                        file: "src/routes/admin.ts",
                        recommendation: "Add authorization tests covering admin-only access and forbidden responses.",
                    },
                    {
                        severity: "CRITICAL",
                        title: "JWT secret reliance without rotation strategy",
                        description: "Login and middleware rely on process.env.JWT_SECRET with no mention of key rotation or invalidation for expired tokens.",
                        file: "src/routes/login.ts",
                        recommendation: "Document secret management and add tests for expired or missing tokens.",
                    },
                ],
            });
        }
        if (systemPrompt.includes("testing and regression")) {
            return findingsOutputSchema.parse({
                findings: [
                    {
                        severity: "HIGH",
                        title: "Authentication behavior changed with no test updates",
                        description: "Session-based login was replaced with JWT issuance, but no test files were modified in this PR.",
                        recommendation: "Add tests for login token issuance, missing token responses, and invalid token handling.",
                    },
                ],
            });
        }
        if (systemPrompt.includes("final merge-risk judge")) {
            return riskJudgeOutputSchema.parse({
                overallRisk: "HIGH",
                riskScore: 72,
                summary: "This PR introduces JWT authentication and admin authorization checks without test coverage. Missing token validation edge cases and absent auth tests create meaningful merge risk.",
                bugRisk: 45,
                securityRisk: 82,
                testingRisk: 78,
                recommendations: [
                    "Add tests for expired, missing, and malformed JWT tokens.",
                    "Add authorization tests for admin-only routes.",
                    "Validate decoded JWT claims before use in route handlers.",
                ],
            });
        }
        throw new Error(`Unexpected mock prompt: ${systemPrompt.slice(0, 80)}`);
    };
}
async function main() {
    setMockLlmHandler(createMockHandler());
    const initialState = buildFixtureInitialState();
    const result = await runRiskAnalysisWorkflow(initialState);
    const report = result.finalReport;
    if (!report) {
        console.error("FAIL: workflow did not produce finalReport");
        process.exit(1);
    }
    const checks = [
        ["classification set", Boolean(result.classification?.securityRelevant)],
        ["bug findings", result.bugFindings.length > 0],
        ["security findings", result.securityFindings.length > 0],
        ["testing findings", result.testingFindings.length > 0],
        ["overall risk", report.overallRisk === "HIGH"],
        ["recommendations", report.recommendations.length > 0],
        ["merged findings", report.findings.length >= 3],
    ];
    let failed = false;
    for (const [label, ok] of checks) {
        console.log(`${ok ? "✓" : "✗"} ${label}`);
        if (!ok)
            failed = true;
    }
    console.log("\nFinal report summary:", report.summary);
    console.log("Risk score:", report.riskScore, report.overallRisk);
    if (failed) {
        process.exit(1);
    }
    console.log("\nGraph fixture test passed.");
}
main().catch((error) => {
    console.error("Graph fixture test failed:", error);
    process.exit(1);
});
//# sourceMappingURL=run-fixture.js.map