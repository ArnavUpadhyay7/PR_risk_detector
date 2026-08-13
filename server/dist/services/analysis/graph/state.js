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
    deterministicSummary: (Annotation),
    changeAreas: (Annotation),
    classification: (Annotation),
    bugFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    securityFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    testingFindings: Annotation({
        reducer: (_current, update) => update,
        default: () => [],
    }),
    finalReport: (Annotation),
});
//# sourceMappingURL=state.js.map