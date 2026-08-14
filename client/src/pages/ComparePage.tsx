import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CompareResult } from "../services/api";
import { EmptyState } from "../components/ui/EmptyState";
import { RiskBadge } from "../components/ui/RiskBadge";
import { SkeletonRow } from "../components/ui/StatCard";

function MetricRow({
  label,
  previous,
  current,
  delta,
}: {
  label: string;
  previous: number;
  current: number;
  delta: number;
}) {
  const deltaColor = delta < 0 ? "text-emerald-400" : delta > 0 ? "text-red-400" : "text-zinc-400";
  return (
    <div className="grid grid-cols-4 gap-3 py-3 border-b border-zinc-900/80 text-sm">
      <div className="text-zinc-400">{label}</div>
      <div className="tabular-nums text-zinc-300">{previous}</div>
      <div className="tabular-nums text-white">{current}</div>
      <div className={`tabular-nums ${deltaColor}`}>{delta > 0 ? `+${delta}` : delta}</div>
    </div>
  );
}

export function ComparePage() {
  const { id1, id2 } = useParams();
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id1 || !id2) return;
    api.compareAnalyses(id1, id2)
      .then(setComparison)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to compare analyses"))
      .finally(() => setLoading(false));
  }, [id1, id2]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)}</div>;
  }

  if (error || !comparison) {
    return <EmptyState title="Unable to compare analyses" description={error ?? "Comparison unavailable."} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to={`/analyses/${comparison.current.id}`} className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to analysis
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          PR #{comparison.current.pr.number} — Risk Comparison
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{comparison.current.repository.fullName}</p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Previous</p>
            <p className="mt-2 font-mono text-sm text-zinc-300">{comparison.previous.commitSha.slice(0, 7)}</p>
            <div className="mt-3"><RiskBadge level={comparison.previous.riskLevel} score={comparison.previous.riskScore} /></div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Current</p>
            <p className="mt-2 font-mono text-sm text-zinc-300">{comparison.current.commitSha.slice(0, 7)}</p>
            <div className="mt-3"><RiskBadge level={comparison.current.riskLevel} score={comparison.current.riskScore} /></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 pb-2 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
          <div>Metric</div>
          <div>Previous</div>
          <div>Current</div>
          <div>Delta</div>
        </div>
        <MetricRow label="Risk Score" {...comparison.diff.riskScore} />
        <MetricRow label="Security" {...comparison.diff.securityRisk} />
        <MetricRow label="Quality" {...comparison.diff.qualityRisk} />
        <MetricRow label="Performance" {...comparison.diff.performanceRisk} />
        <MetricRow label="Bug" {...comparison.diff.bugRisk} />
        <MetricRow label="Findings" {...comparison.diff.findingsCount} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-emerald-300 mb-3">Improvements</h2>
          {comparison.improvements.length === 0 ? (
            <p className="text-sm text-zinc-500">No resolved findings detected.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-300">
              {comparison.improvements.map((item) => <li key={item}>✓ {item}</li>)}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium text-amber-300 mb-3">Remaining Risks</h2>
          {comparison.remainingRisks.length === 0 ? (
            <p className="text-sm text-zinc-500">No remaining risks in the current snapshot.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-300">
              {comparison.remainingRisks.map((item) => <li key={item}>⚠ {item}</li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
