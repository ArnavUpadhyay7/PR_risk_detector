import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  abbreviateSha,
  formatDate,
  type AnalysisRecord,
  type PrHistoryItem,
} from "../services/api";
import { AnalysisResults } from "../components/AnalysisResults";
import { EmptyState } from "../components/ui/EmptyState";
import { RiskBadge } from "../components/ui/RiskBadge";
import { RiskHistoryChart } from "../components/ui/RiskChart";
import { SkeletonRow } from "../components/ui/StatCard";

export function AnalysisDetailPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [history, setHistory] = useState<PrHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareTarget, setCompareTarget] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getAnalysis(id), api.getAnalysisHistory(id)])
      .then(([record, historyResult]) => {
        setAnalysis(record);
        setHistory(historyResult.history);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)}</div>;
  }

  if (error || !analysis) {
    return <EmptyState title="Analysis not found" description={error ?? "This analysis may have been deleted."} />;
  }

  const responseData = {
    pullRequest: {
      title: analysis.pr.title,
      repository: analysis.repository.fullName,
      author: analysis.pr.author,
      baseBranch: analysis.pr.baseBranch,
      headBranch: analysis.pr.headBranch,
      additions: analysis.pr.additions,
      deletions: analysis.pr.deletions,
      filesChanged: analysis.pr.filesChanged,
    },
    analysis: {
      summary: analysis.analysisSummary,
      riskReport: analysis.riskReport,
    },
  };

  const otherHistory = history.filter((item) => item.id !== analysis.id);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">{analysis.repository.fullName}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              PR #{analysis.pr.number} — {analysis.pr.title}
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              Analyzed {formatDate(analysis.createdAt)} · Commit {abbreviateSha(analysis.commitSha)}
            </p>
          </div>
          <RiskBadge level={analysis.riskLevel} score={analysis.riskScore} />
        </div>
      </section>

      {history.length > 1 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-white">Risk History</h2>
            {otherHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={compareTarget}
                  onChange={(event) => setCompareTarget(event.target.value)}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">Compare with...</option>
                  {otherHistory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {abbreviateSha(item.commitSha)} · {item.riskScore}
                    </option>
                  ))}
                </select>
                {compareTarget && (
                  <Link
                    to={`/analyses/compare/${compareTarget}/${analysis.id}`}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    Compare
                  </Link>
                )}
              </div>
            )}
          </div>

          <RiskHistoryChart
            points={history.map((item) => ({
              label: abbreviateSha(item.commitSha),
              score: item.riskScore,
              level: item.riskLevel,
            }))}
          />

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="py-2 pr-4 font-medium">Commit</th>
                  <th className="py-2 pr-4 font-medium">Risk</th>
                  <th className="py-2 pr-4 font-medium">Findings</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-900/80">
                    <td className="py-3 pr-4">
                      <Link to={`/analyses/${item.id}`} className="font-mono text-zinc-200 hover:underline">
                        {abbreviateSha(item.commitSha)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4"><RiskBadge level={item.riskLevel} score={item.riskScore} /></td>
                    <td className="py-3 pr-4 text-zinc-400">{item.findingsCount}</td>
                    <td className="py-3 text-zinc-500">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AnalysisResults data={responseData} />
    </div>
  );
}
