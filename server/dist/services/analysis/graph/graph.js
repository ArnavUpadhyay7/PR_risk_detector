import { END, START, StateGraph } from "@langchain/langgraph";
import { PRRiskStateAnnotation } from "./state.js";
import { prAnalyzerNode } from "./nodes/pr-analyzer.node.js";
import { classifierNode } from "./nodes/classifier.node.js";
import { bugRiskNode } from "./nodes/bug-risk.node.js";
import { securityRiskNode } from "./nodes/security-risk.node.js";
import { testingRiskNode } from "./nodes/testing-risk.node.js";
import { riskJudgeNode } from "./nodes/risk-judge.node.js";
import { routeAfterBug, routeAfterClassifier, routeAfterSecurity, routeAfterSecurityGate, routeAfterTesting, routeAfterTestingGate, securityGateNode, testingGateNode, } from "./routing.js";
import { AppError } from "../../../utils/AppError.js";
function buildGraph() {
    const graph = new StateGraph(PRRiskStateAnnotation)
        .addNode("prAnalyzer", prAnalyzerNode)
        .addNode("classifier", classifierNode)
        .addNode("bugRisk", bugRiskNode)
        .addNode("securityGate", securityGateNode)
        .addNode("securityRisk", securityRiskNode)
        .addNode("testingGate", testingGateNode)
        .addNode("testingRisk", testingRiskNode)
        .addNode("riskJudge", riskJudgeNode)
        .addEdge(START, "prAnalyzer")
        .addEdge("prAnalyzer", "classifier")
        .addConditionalEdges("classifier", routeAfterClassifier, ["bugRisk", "securityGate"])
        .addConditionalEdges("bugRisk", routeAfterBug, ["securityGate"])
        .addConditionalEdges("securityGate", routeAfterSecurityGate, [
        "securityRisk",
        "testingGate",
    ])
        .addConditionalEdges("securityRisk", routeAfterSecurity, ["testingGate"])
        .addConditionalEdges("testingGate", routeAfterTestingGate, ["testingRisk", "riskJudge"])
        .addConditionalEdges("testingRisk", routeAfterTesting, ["riskJudge"])
        .addEdge("riskJudge", END);
    return graph.compile();
}
let compiledGraph = null;
function getGraph() {
    if (!compiledGraph) {
        compiledGraph = buildGraph();
    }
    return compiledGraph;
}
export async function runRiskAnalysisWorkflow(initialState) {
    try {
        const result = await getGraph().invoke(initialState);
        if (!result.finalReport) {
            throw new AppError("AI workflow did not produce a risk report.", 502);
        }
        return result;
    }
    catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error("LangGraph workflow failed:", error);
        throw new AppError("Failed to run PR risk analysis workflow.", 502);
    }
}
export { buildGraph, getGraph };
//# sourceMappingURL=graph.js.map