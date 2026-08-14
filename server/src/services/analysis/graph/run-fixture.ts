import { setMockLlmHandler } from "../../ai/llm.service.js";
import { runRiskAnalysisWorkflow } from "./graph.js";
import { buildFixtureInitialState } from "./fixtures/sample-pr.fixture.js";
import { findingsOutputSchema, aggregatorOutputSchema } from "./schemas.js";
import { parseAllPatches } from "./utils/diff/parsePatch.js";
import { validateFindings } from "./utils/diff/validateFindings.js";
import { dedupeFindings } from "./utils/diff/dedupeFindings.js";

function createMockHandler() {
  return (systemPrompt: string, _userPrompt: string): unknown => {
    if (systemPrompt.includes("Security Agent")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            category: "SECURITY",
            severity: "CRITICAL",
            title: "Hardcoded JWT secret",
            description: "JWT verification uses a hardcoded secret in auth middleware.",
            file: "src/middleware/auth.ts",
            line: 3,
            evidence: "const secret = 'my-secret';",
            recommendation: "Move the secret to an environment variable.",
            confidence: 0.94,
          },
        ],
      });
    }

    if (systemPrompt.includes("Code Quality Agent")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            category: "QUALITY",
            severity: "MEDIUM",
            title: "Duplicated token parsing logic",
            description: "Token decoding logic is spread across middleware and utility modules.",
            file: "src/utils/token.ts",
            line: 8,
            evidence: "return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());",
            recommendation: "Centralize token parsing in one validated utility.",
            confidence: 0.78,
          },
        ],
      });
    }

    if (systemPrompt.includes("Performance Agent")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            category: "PERFORMANCE",
            severity: "HIGH",
            title: "Database query inside loop",
            description: "User lookup executes one query per id inside a loop.",
            file: "src/services/userService.ts",
            line: 34,
            evidence: "const user = await db.users.findUnique({ where: { id } });",
            recommendation: "Fetch users in a single query using an IN filter.",
            confidence: 0.91,
          },
        ],
      });
    }

    if (systemPrompt.includes("Logic/Bug Agent")) {
      return findingsOutputSchema.parse({
        findings: [
          {
            category: "BUG",
            severity: "MEDIUM",
            title: "Missing JWT claim validation",
            description: "Decoded token payload is attached to req.user without validating required claims.",
            file: "src/middleware/auth.ts",
            line: 10,
            evidence: "req.user = jwt.verify(token, secret);",
            recommendation: "Validate required claims before attaching req.user.",
            confidence: 0.86,
          },
        ],
      });
    }

    if (systemPrompt.includes("final merge-risk aggregator")) {
      return aggregatorOutputSchema.parse({
        summary:
          "JWT auth introduces a hardcoded secret and missing claim validation, with an N+1 query regression in user loading.",
        recommendations: [
          "Move JWT secret to environment configuration.",
          "Validate decoded token claims before use.",
          "Replace per-id user queries with a single batched query.",
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
    throw new Error("Workflow did not produce finalReport");
  }

  const fileDiffs = parseAllPatches(initialState.filesChanged);
  const securityValidated = validateFindings(
    [
      {
        severity: "CRITICAL",
        title: "Hardcoded JWT secret",
        description: "Hardcoded secret in middleware.",
        file: "src/middleware/auth.ts",
        line: 3,
        evidence: "const secret = 'my-secret';",
        recommendation: "Use env var.",
        confidence: 0.9,
      },
    ],
    "SECURITY",
    fileDiffs,
  );

  const deduped = dedupeFindings([
    ...securityValidated,
    {
      id: "temp",
      category: "BUG",
      severity: "MEDIUM",
      title: "Missing JWT claim validation",
      description: "Token claims not validated.",
      recommendation: "Validate claims.",
      file: "src/middleware/auth.ts",
      line: 11,
      evidence: "req.user = jwt.verify(token, secret);",
      confidence: 0.8,
    },
  ]);

  const checks = [
    ["classification set", Boolean(result.classification?.securityRelevant)],
    ["parallel specialists populated", report.findings.length >= 4],
    ["security finding mapped", report.findings.some((f) => f.category === "SECURITY" && f.file.includes("auth.ts"))],
    ["performance finding mapped", report.findings.some((f) => f.category === "PERFORMANCE")],
    ["file diffs included", report.fileDiffs.length > 0],
    ["dedupe keeps distinct findings", deduped.length >= 2],
    ["validation keeps line", securityValidated[0]?.line === 3],
    ["recommendations", report.recommendations.length > 0],
  ] as const;

  let failed = false;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "✓" : "✗"} ${label}`);
    if (!ok) failed = true;
  }

  console.log("\nFinal report:", report.overallRisk, report.riskScore);
  console.log("Findings:", report.findings.length);

  if (failed) {
    process.exit(1);
  }

  console.log("\nGraph fixture test passed.");
}

main().catch((error) => {
  console.error("Graph fixture test failed:", error);
  process.exit(1);
});
