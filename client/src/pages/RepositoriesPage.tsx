import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AnalysisListItem } from "../services/api";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonRow } from "../components/ui/StatCard";

interface RepoSummary {
  repository: string;
  count: number;
  latestRisk: number;
  latestLevel: string;
  latestAt: string;
}

export function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getRepositories(), api.listAnalyses({ sort: "newest", limit: "100", page: "1" })])
      .then(([repoResult, analysesResult]) => {
        const grouped = new Map<string, AnalysisListItem[]>();
        for (const item of analysesResult.items) {
          const current = grouped.get(item.repository) ?? [];
          current.push(item);
          grouped.set(item.repository, current);
        }

        const summaries = repoResult.repositories.map((repository) => {
          const items = grouped.get(repository) ?? [];
          const latest = items[0];
          return {
            repository,
            count: items.length,
            latestRisk: latest?.riskScore ?? 0,
            latestLevel: latest?.riskLevel ?? "LOW",
            latestAt: latest?.createdAt ?? "",
          };
        });
        setRepos(summaries);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load repositories"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)}</div>;
  }

  if (error) {
    return <EmptyState title="Unable to load repositories" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Repositories</h1>
        <p className="mt-1 text-sm text-zinc-400">Repositories with saved PR risk analyses.</p>
      </div>

      {repos.length === 0 ? (
        <EmptyState
          title="No repositories yet"
          description="Analyze a pull request to start building repository history."
          action={<Link to="/analyze" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900">Analyze PR</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <Link
              key={repo.repository}
              to={`/analyses?repository=${encodeURIComponent(repo.repository)}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
            >
              <p className="font-mono text-sm text-white">{repo.repository}</p>
              <p className="mt-2 text-sm text-zinc-400">{repo.count} analyses</p>
              {repo.latestAt && (
                <p className="mt-1 text-xs text-zinc-500">
                  Latest risk {repo.latestRisk} ({repo.latestLevel})
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
