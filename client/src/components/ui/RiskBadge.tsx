import type { RiskLevel } from "../../services/api";

const styles: Record<RiskLevel, string> = {
  LOW: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  MEDIUM: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  HIGH: "border-orange-800/60 bg-orange-950/40 text-orange-300",
  CRITICAL: "border-red-800/60 bg-red-950/40 text-red-300",
};

interface RiskBadgeProps {
  level: string;
  score?: number;
}

export function RiskBadge({ level, score }: RiskBadgeProps) {
  const normalized = (level.toUpperCase() as RiskLevel) in styles ? (level.toUpperCase() as RiskLevel) : "LOW";

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium ${styles[normalized]}`}>
      {normalized}
      {score !== undefined && <span className="tabular-nums opacity-80">{score}</span>}
    </span>
  );
}

export function riskBarColor(level: string): string {
  switch (level.toUpperCase()) {
    case "CRITICAL":
    case "HIGH":
      return "bg-red-500";
    case "MEDIUM":
      return "bg-amber-500";
    default:
      return "bg-emerald-500";
  }
}
