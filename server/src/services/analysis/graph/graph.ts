import { END, START, StateGraph } from "@langchain/langgraph";
import { PRRiskStateAnnotation, type PRRiskState } from "./state.js";
import { prAnalyzerNode } from "./nodes/pr-analyzer.node.js";
import { deterministicClassifierNode } from "./nodes/deterministic-classifier.node.js";
import { securityRiskNode } from "./nodes/security-risk.node.js";
import { qualityRiskNode } from "./nodes/quality-risk.node.js";
import { performanceRiskNode } from "./nodes/performance-risk.node.js";
import { bugRiskNode } from "./nodes/bug-risk.node.js";
import { riskAggregatorNode } from "./nodes/risk-aggregator.node.js";
import { trivialReportNode } from "./nodes/trivial-report.node.js";
import { checkJoinNode } from "./nodes/check-join.node.js";
import { routeAfterClassifier } from "./routing.js";
import { AppError } from "../../../utils/AppError.js";
import { endTimer, startTimer } from "./utils/timing.js";

function buildGraph() {
  const graph = new StateGraph(PRRiskStateAnnotation)
    .addNode("prAnalyzer", prAnalyzerNode)
    .addNode("classifier", deterministicClassifierNode)
    .addNode("securityRisk", securityRiskNode)
    .addNode("qualityRisk", qualityRiskNode)
    .addNode("performanceRisk", performanceRiskNode)
    .addNode("bugRisk", bugRiskNode)
    .addNode("checkJoin", checkJoinNode)
    .addNode("riskAggregator", riskAggregatorNode)
    .addNode("trivialReport", trivialReportNode)
    .addEdge(START, "prAnalyzer")
    .addEdge("prAnalyzer", "classifier")
    .addConditionalEdges("classifier", routeAfterClassifier, [
      "trivialReport",
      "securityRisk",
      "qualityRisk",
      "performanceRisk",
      "bugRisk",
    ])
    .addEdge("securityRisk", "checkJoin")
    .addEdge("qualityRisk", "checkJoin")
    .addEdge("performanceRisk", "checkJoin")
    .addEdge("bugRisk", "checkJoin")
    .addEdge("trivialReport", END)
    .addEdge("riskAggregator", END);

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
  startTimer("total workflow");
  console.log("[Graph] mode: parallel multi-agent");

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
