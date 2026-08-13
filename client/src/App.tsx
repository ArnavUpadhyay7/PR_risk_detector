import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PrUrlForm } from "./components/PrUrlForm";
import { LoadingState } from "./components/LoadingState";
import { ErrorAlert } from "./components/ErrorAlert";
import { AnalysisResults } from "./components/AnalysisResults";
import { analyzePullRequest, ApiRequestError } from "./services/api";
import type { PrAnalysisResponse } from "./services/api";
import "./App.css";

function App() {
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
      setLoadingStage((current) => Math.min(current + 1, 3));
    }, 3500);

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
      const data = await analyzePullRequest(trimmed);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Header
          title="PR Risk Analyzer"
          subtitle="Understand what could go wrong before you merge."
        />

        <PrUrlForm
          value={prUrl}
          onChange={setPrUrl}
          onSubmit={handleAnalyze}
          disabled={loading}
        />

        {error && <ErrorAlert message={error} />}
        {loading && <LoadingState stageIndex={loadingStage} />}
        {result && !loading && <AnalysisResults data={result} />}
      </div>
    </div>
  );
}

export default App;
