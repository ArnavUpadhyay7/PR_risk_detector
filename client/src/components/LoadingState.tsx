const STAGES = [
  "Fetching PR...",
  "Analyzing changes...",
  "Checking risk areas...",
  "Generating final assessment...",
];

interface LoadingStateProps {
  stageIndex?: number;
}

export function LoadingState({ stageIndex = 0 }: LoadingStateProps) {
  const message = STAGES[Math.min(stageIndex, STAGES.length - 1)];

  return (
    <div className="mt-12 flex flex-col items-center gap-3 text-zinc-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
