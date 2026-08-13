export const ANALYSIS_STAGES = [
  { id: "fetch", label: "Fetching pull request" },
  { id: "changes", label: "Understanding code changes" },
  { id: "bug", label: "Checking bug risks" },
  { id: "security", label: "Checking security risks" },
  { id: "testing", label: "Checking test coverage" },
  { id: "final", label: "Preparing final assessment" },
] as const;

interface AnalysisProgressProps {
  stageIndex: number;
  repository: string;
  pullNumber: string;
  title?: string;
}

export function AnalysisProgress({
  stageIndex,
  repository,
  pullNumber,
  title,
}: AnalysisProgressProps) {
  const prLabel = pullNumber ? `PR #${pullNumber}` : "Pull Request";
  const headline = title ?? "Analyzing changes";

  return (
    <div className="mt-10 w-full max-w-xl mx-auto">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-white">Analyzing Pull Request</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {prLabel} · {repository}
          </p>
          <p className="mt-1 text-sm text-zinc-500 truncate">{headline}</p>
        </div>

        <ol className="space-y-3">
          {ANALYSIS_STAGES.map((stage, index) => {
            const isComplete = index < stageIndex;
            const isCurrent = index === stageIndex;

            return (
              <li
                key={stage.id}
                className={`flex items-center gap-3 text-sm ${
                  isComplete
                    ? "text-zinc-300"
                    : isCurrent
                      ? "text-white"
                      : "text-zinc-600"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                    isComplete
                      ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                      : isCurrent
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  {isComplete ? "✓" : isCurrent ? "●" : "○"}
                </span>
                <span className={isCurrent ? "font-medium" : undefined}>{stage.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-col items-center gap-3 text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          <p className="text-xs">Analyzing...</p>
        </div>
      </div>
    </div>
  );
}
