import type { PRRiskState } from "./state.js";

export function routeAfterClassifier(state: PRRiskState): "bugRisk" | "securityGate" {
  return state.classification?.bugRelevant ? "bugRisk" : "securityGate";
}

export function routeAfterBug(_state: PRRiskState): "securityGate" {
  return "securityGate";
}

export function routeAfterSecurityGate(
  state: PRRiskState,
): "securityRisk" | "testingGate" {
  return state.classification?.securityRelevant ? "securityRisk" : "testingGate";
}

export function routeAfterSecurity(_state: PRRiskState): "testingGate" {
  return "testingGate";
}

export function routeAfterTestingGate(
  state: PRRiskState,
): "testingRisk" | "riskJudge" {
  return state.classification?.testingRelevant ? "testingRisk" : "riskJudge";
}

export function routeAfterTesting(_state: PRRiskState): "riskJudge" {
  return "riskJudge";
}

export async function securityGateNode(state: PRRiskState): Promise<Partial<PRRiskState>> {
  return state;
}

export async function testingGateNode(state: PRRiskState): Promise<Partial<PRRiskState>> {
  return state;
}
