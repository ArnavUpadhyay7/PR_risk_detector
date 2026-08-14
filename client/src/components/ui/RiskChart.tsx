import type { DashboardStats } from "../../services/api";
import { riskBarColor } from "./RiskBadge";

interface RiskDistributionProps {
  distribution: DashboardStats["riskDistribution"];
}

export function RiskDistribution({ distribution }: RiskDistributionProps) {
  const items = [
    { label: "High", value: distribution.high, level: "HIGH" },
    { label: "Medium", value: distribution.medium, level: "MEDIUM" },
    { label: "Low", value: distribution.low, level: "LOW" },
  ];
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-400">{item.label}</span>
            <span className="tabular-nums text-zinc-300">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${riskBarColor(item.level)}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RiskHistoryChartProps {
  points: Array<{ label: string; score: number; level: string }>;
}

export function RiskHistoryChart({ points }: RiskHistoryChartProps) {
  if (points.length === 0) return null;

  const width = 640;
  const height = 180;
  const padding = 24;
  const maxScore = 100;

  const coords = points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - (point.score / maxScore) * (height - padding * 2);
    return { ...point, x, y };
  });

  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick / maxScore) * (height - padding * 2);
          return (
            <g key={tick}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#3f3f46" strokeWidth="1" />
              <text x="4" y={y + 4} fill="#71717a" fontSize="10">{tick}</text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#e4e4e7" strokeWidth="2" points={polyline} />
        {coords.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#fafafa" />
            <text x={point.x - 16} y={height - 4} fill="#a1a1aa" fontSize="10">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
