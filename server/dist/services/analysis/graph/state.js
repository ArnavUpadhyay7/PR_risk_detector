import { Annotation } from "@langchain/langgraph";
export const PRRiskStateAnnotation = Annotation.Root({
    prUrl: (Annotation),
    owner: (Annotation),
    repo: (Annotation),
    pullNumber: (Annotation),
    title: (Annotation),
    description: (Annotation),
    baseBranch: (Annotation),
    headBranch: (Annotation),
    filesChanged: (Annotation),
    diff: (Annotation),
    compactContext: (Annotation),
    fileDiffs: (Annotation),
    deterministicSummary: (Annotation),
    changeAreas: (Annotation),
    classification: (Annotation),
    agentsPending: Annotation({
        reducer: (_current, update) => update,
        default: () => 0,
    }),
    agentsDone: Annotation({
        reducer: (current, update) => current + update,
        default: () => 0,
    }),
    agentWarnings: Annotation({
        reducer: (current, update) => [...current, ...update],
        default: () => [],
    }),
    securityFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    qualityFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    performanceFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    bugFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    finalReport: (Annotation),
});
//# sourceMappingURL=state.js.map