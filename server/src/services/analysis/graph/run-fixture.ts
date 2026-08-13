import { setMockLlmHandler } from "../../ai/llm.service.js";
import { runRiskAnalysisWorkflow } from "./graph.js";
import { buildFixtureInitialState } from "./fixtures/sample-pr.fixture.js";
import {
  combinedFindingsOutputSchema,
  findingsOutputSchema,
  riskJudgeOutputSchema,
} from "./schemas.js";

function createMockHandler() {
  return (systemPrompt: string, _userPrompt: string): unknown => {
    if (systemPrompt.includes("bug, security, and testing")) {
      return combinedFindingsOutputSchema.parse({
        bugFindings: [
          {
            severity: "MEDIUM",
            title: "Missing JWT claim validation",
            description: "Decoded token claims are not validated before use in route handlers.",
            file: "src/middleware/auth.ts",
            recommendation: "Validate required claims before attaching req.user.",
          },
        ],
        securityFindings: [
          {
            severity: "CRITICAL",
            title: "Admin route authorization added without tests",
            description: "Non-admin access paths are not covered by new authorization checks.",
            file: "src/routes/admin.ts",
            recommendation: "Add authorization tests for admin-only routes.",
          },
        ],
        testingFindings: [
          {
            severity: "HIGH",
            title: "Auth flow changed without test updates",
            description: "JWT login replaces session auth but no test files changed.",
            recommendation: "Add tests for token issuance and invalid token handling.",
          },
        ],
      });
    }

    if (systemPrompt.includes("functional/logic merge risks only")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            severity: "MEDIUM",
            title: "Missing null check on decoded JWT payload",
            description: "authMiddleware assigns req.user without validating required claims.",
            file: "src/middleware/auth.ts",
            recommendation: "Validate decoded token shape before attaching req.user.",
          },
        ],
      });
    }

    if (systemPrompt.includes("security merge risks only")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            severity: "CRITICAL",
            title: "JWT secret reliance without rotation strategy",
            description: "Login and middleware rely on JWT_SECRET without invalidation coverage.",
            file: "src/routes/login.ts",
            recommendation: "Add tests for expired or missing tokens.",
          },
        ],
      });
    }

    if (systemPrompt.includes("testing/regression merge risks only")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            severity: "HIGH",
            title: "Authentication behavior changed with no test updates",
            description: "Session login replaced with JWT issuance without test file changes.",
            recommendation: "Add login and middleware auth tests.",
          },
        ],
      });
    }

    if (systemPrompt.includes("final merge-risk judge")) {
      return riskJudgeOutputSchema.parse({
        overallRisk: "HIGH",
        riskScore: 72,
        summary:
          "JWT auth and admin authorization changes ship without adequate tests or token edge-case coverage.",
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

async function runFixture(mode: "combined" | "parallel") {
  process.env.RISK_ANALYSIS_MODE = mode;
  setMockLlmHandler(createMockHandler());

  const initialState = buildFixtureInitialState();
  const result = await runRiskAnalysisWorkflow(initialState);
  const report = result.finalReport;

  if (!report) {
    throw new Error("Workflow did not produce finalReport");
  }

  console.log(`\n[Fixture:${mode}]`, report.overallRisk, report.riskScore);
  console.log("Findings:", report.findings.length, "Warnings:", report.warnings.length);

  return {
    ok:
      Boolean(result.classification?.securityRelevant) &&
      report.findings.length >= 2 &&
      report.recommendations.length > 0,
  };
}

async function main() {
  const combined = await runFixture("combined");
  const parallel = await runFixture("parallel");

  if (!combined.ok || !parallel.ok) {
    console.error("Graph fixture test failed.");
    process.exit(1);
  }

  console.log("\nGraph fixture test passed (combined + parallel).");
}

main().catch((error) => {
  console.error("Graph fixture test failed:", error);
  process.exit(1);
});
