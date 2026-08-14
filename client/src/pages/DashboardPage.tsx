import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, abbreviateSha, formatDate, type DashboardStats } from "../services/api";
import { StatCard, SkeletonCard, SkeletonRow } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";
import { RiskDistribution } from "../components/ui/RiskChart";
import { RiskBadge } from "../components/ui/RiskBadge";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 h-56 animate-pulse" />
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error ?? "Something went wrong."}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">Overview of your PR merge-risk analyses.</p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          + Analyze New PR
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="PRs Analyzed" value={stats.totalAnalyses} />
        <StatCard label="High Risk" value={stats.highRisk} />
        <StatCard label="Medium Risk" value={stats.mediumRisk} />
        <StatCard label="Low Risk" value={stats.lowRisk} />
        <StatCard label="Average Risk Score" value={stats.averageRiskScore} hint="/ 100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-white mb-4">Risk Distribution</h2>
          <RiskDistribution distribution={stats.riskDistribution} />
        </section>

        <section className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Recent Analyses</h2>
            <Link to="/analyses" className="text-xs text-zinc-400 hover:text-zinc-200">View all</Link>
          </div>

          {stats.recentAnalyses.length === 0 ? (
            <EmptyState
              title="No analyses yet"
              description="Analyze your first GitHub PR to see risk insights here."
              action={
                <Link to="/analyze" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900">
                  Analyze PR
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {stats.recentAnalyses.map((item) => (
                <Link
                  key={item.id}
                  to={`/analyses/${item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.repository} · PR #{item.prNumber}
                    </p>
                    <p className="text-sm text-zinc-400 truncate">{item.prTitle}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(item.createdAt)} · {abbreviateSha(item.commitSha)} · {item.findingsCount} findings
                    </p>
                  </div>
                  <RiskBadge level={item.riskLevel} score={item.riskScore} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
