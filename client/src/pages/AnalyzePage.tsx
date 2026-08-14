import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrUrlForm } from "../components/PrUrlForm";
import { AnalysisProgress } from "../components/AnalysisProgress";
import { ErrorAlert } from "../components/ErrorAlert";
import { AnalysisResults } from "../components/AnalysisResults";
import { api, ApiRequestError, type PrAnalysisResponse } from "../services/api";

const STAGE_INTERVAL_MS = 4000;
const MAX_STAGE_INDEX = 6;

export function AnalyzePage() {
  const navigate = useNavigate();
  const [prUrl, setPrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrAnalysisResponse | null>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, MAX_STAGE_INDEX));
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loading]);

  async function handleAnalyze() {
    const trimmed = prUrl.trim();
    if (!trimmed) {
      setError("Please enter a GitHub Pull Request URL.");
      setResult(null);
      return;
    }

    setLoading(true);
    setLoadingStage(0);
    setError(null);
    setResult(null);

    try {
      const data = await api.analyzePullRequest(trimmed);
      setResult(data);
      if (data.analysisId) {
        navigate(`/analyses/${data.analysisId}`, { replace: false });
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analyze Pull Request</h1>
        <p className="mt-1 text-sm text-zinc-400">Run the existing LangGraph risk workflow and save the result.</p>
      </div>

      <PrUrlForm value={prUrl} onChange={setPrUrl} onSubmit={handleAnalyze} disabled={loading} />

      {error && <ErrorAlert message={error} />}
      {loading && (
        <AnalysisProgress
          stageIndex={loadingStage}
          repository={prUrl.match(/github\.com\/([^/]+\/[^/]+)/i)?.[1] ?? "GitHub PR"}
          pullNumber={prUrl.match(/\/pull\/(\d+)/)?.[1] ?? ""}
        />
      )}
      {result && !loading && (
        <div className="space-y-4">
          {result.analysisId && (
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
              Analysis saved. <Link to={`/analyses/${result.analysisId}`} className="underline">View saved analysis</Link>
            </div>
          )}
          <AnalysisResults data={result} />
        </div>
      )}
    </div>
  );
}
