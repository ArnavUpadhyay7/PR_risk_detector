export function routeAfterClassifier(state) {
    return state.classification?.bugRelevant ? "bugRisk" : "securityGate";
}
export function routeAfterBug(_state) {
    return "securityGate";
}
export function routeAfterSecurityGate(state) {
    return state.classification?.securityRelevant ? "securityRisk" : "testingGate";
}
export function routeAfterSecurity(_state) {
    return "testingGate";
}
export function routeAfterTestingGate(state) {
    return state.classification?.testingRelevant ? "testingRisk" : "riskJudge";
}
export function routeAfterTesting(_state) {
    return "riskJudge";
}
export async function securityGateNode(state) {
    return state;
}
export async function testingGateNode(state) {
    return state;
}
//# sourceMappingURL=routing.js.map