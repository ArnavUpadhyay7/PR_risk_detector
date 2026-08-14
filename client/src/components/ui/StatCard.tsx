interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 h-28 animate-pulse" />;
}

export function SkeletonRow() {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 h-16 animate-pulse" />;
}
