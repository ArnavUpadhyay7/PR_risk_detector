export interface ApiErrorResponse {
  error: string;
}

export interface HealthResponse {
  status: "ok";
}

export interface AnalyzePrRequest {
  prUrl: string;
}
