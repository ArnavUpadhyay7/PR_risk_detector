import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, abbreviateSha, formatDate, type AnalysisListItem } from "../services/api";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonRow } from "../components/ui/StatCard";
import { RiskBadge } from "../components/ui/RiskBadge";

export function AnalysesPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [repository, setRepository] = useState(searchParams.get("repository") ?? "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [repositories, setRepositories] = useState<string[]>([]);

  useEffect(() => {
    api.getRepositories().then((result) => setRepositories(result.repositories)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .listAnalyses({
        search,
        riskLevel,
        repository,
        sort,
        page: String(page),
      })
      .then((result) => {
        setItems(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analyses"))
      .finally(() => setLoading(false));
  }, [search, riskLevel, repository, sort, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analyses</h1>
        <p className="mt-1 text-sm text-zinc-400">Browse and filter your saved PR risk analyses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={search}
          onChange={(event) => { setPage(1); setSearch(event.target.value); }}
          placeholder="Search PRs, repos, commits..."
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
        <select
          value={riskLevel}
          onChange={(event) => { setPage(1); setRiskLevel(event.target.value); }}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        >
          <option value="">All risk levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={repository}
          onChange={(event) => { setPage(1); setRepository(event.target.value); }}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        >
          <option value="">All repositories</option>
          {repositories.map((repo) => (
            <option key={repo} value={repo}>{repo}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => { setPage(1); setSort(event.target.value); }}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="risk-high">Highest risk</option>
          <option value="risk-low">Lowest risk</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} />)}</div>
      ) : error ? (
        <EmptyState title="Unable to load analyses" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No analyses found"
          description="Try changing your filters or analyze a new pull request."
          action={<Link to="/analyze" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900">Analyze PR</Link>}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/analyses/${item.id}`}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.repository} · PR #{item.prNumber}</p>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
