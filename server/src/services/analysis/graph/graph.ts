import { END, START, StateGraph } from "@langchain/langgraph";
import { PRRiskStateAnnotation, type PRRiskState, useCombinedAnalysisMode } from "./state.js";
import { prAnalyzerNode } from "./nodes/pr-analyzer.node.js";
import { deterministicClassifierNode } from "./nodes/deterministic-classifier.node.js";
import { bugRiskNode } from "./nodes/bug-risk.node.js";
import { securityRiskNode } from "./nodes/security-risk.node.js";
import { testingRiskNode } from "./nodes/testing-risk.node.js";
import { combinedRiskNode } from "./nodes/combined-risk.node.js";
import { riskJudgeNode } from "./nodes/risk-judge.node.js";
import { trivialReportNode } from "./nodes/trivial-report.node.js";
import { checkJoinNode } from "./nodes/check-join.node.js";
import { routeAfterClassifier } from "./routing.js";
import { AppError } from "../../../utils/AppError.js";
import { endTimer, startTimer } from "./utils/timing.js";

function buildGraph() {
  const graph = new StateGraph(PRRiskStateAnnotation)
    .addNode("prAnalyzer", prAnalyzerNode)
    .addNode("classifier", deterministicClassifierNode)
    .addNode("bugRisk", bugRiskNode)
    .addNode("securityRisk", securityRiskNode)
    .addNode("testingRisk", testingRiskNode)
    .addNode("combinedRisk", combinedRiskNode)
    .addNode("checkJoin", checkJoinNode)
    .addNode("riskJudge", riskJudgeNode)
    .addNode("trivialReport", trivialReportNode)
    .addEdge(START, "prAnalyzer")
    .addEdge("prAnalyzer", "classifier")
    .addConditionalEdges("classifier", routeAfterClassifier, [
      "trivialReport",
      "combinedRisk",
      "bugRisk",
      "securityRisk",
      "testingRisk",
    ])
    .addEdge("combinedRisk", "riskJudge")
    .addEdge("bugRisk", "checkJoin")
    .addEdge("securityRisk", "checkJoin")
    .addEdge("testingRisk", "checkJoin")
    .addEdge("trivialReport", END)
    .addEdge("riskJudge", END);

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildGraph> | null = null;

function getGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph();
  }
  return compiledGraph;
}

export async function runRiskAnalysisWorkflow(
  initialState: PRRiskState,
): Promise<PRRiskState> {
  const mode = useCombinedAnalysisMode() ? "combined" : "parallel";
  startTimer("total workflow");
  console.log(`[Graph] mode: ${mode}`);

  try {
    const result = await getGraph().invoke(initialState);

    if (!result.finalReport) {
      throw new AppError("AI workflow did not produce a risk report.", 502);
    }

    endTimer("total workflow");
    return result;
  } catch (error) {
    endTimer("total workflow");
    if (error instanceof AppError) {
      throw error;
    }

    console.error("LangGraph workflow failed:", error);
    throw new AppError("Failed to run PR risk analysis workflow.", 502);
  }
}

export { buildGraph, getGraph };
