import { useState } from "react";
import type { PrAnalysisResponse, RiskFinding, RiskLevel } from "../services/api";
import { DiffViewer } from "./DiffViewer";

interface BadgeProps {
  label: string;
  variant: "neutral" | "success" | "warning";
}

function Badge({ label, variant }: BadgeProps) {
  const styles = {
    neutral: "border-zinc-700 bg-zinc-800 text-zinc-300",
    success: "border-emerald-800 bg-emerald-950 text-emerald-300",
    warning: "border-amber-800 bg-amber-950 text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

interface AnalysisResultsProps {
  data: PrAnalysisResponse;
}

const riskStyles: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
  MEDIUM: "text-amber-400 border-amber-800 bg-amber-950/40",
  HIGH: "text-orange-400 border-orange-800 bg-orange-950/40",
  CRITICAL: "text-red-400 border-red-800 bg-red-950/40",
};

const severityStyles: Record<RiskLevel, string> = {
  LOW: "border-zinc-700 bg-zinc-800 text-zinc-300",
  MEDIUM: "border-amber-800 bg-amber-950 text-amber-300",
  HIGH: "border-orange-800 bg-orange-950 text-orange-300",
  CRITICAL: "border-red-800 bg-red-950 text-red-300",
};

const categoryStyles: Record<RiskFinding["category"], string> = {
  SECURITY: "text-red-300",
  QUALITY: "text-sky-300",
  PERFORMANCE: "text-violet-300",
  BUG: "text-orange-300",
};

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const { pullRequest, analysis } = data;
  const { summary, riskReport } = analysis;
  const [selectedFinding, setSelectedFinding] = useState<RiskFinding | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(
    riskReport.fileDiffs[0]?.filename ?? null,
  );

  function handleFindingClick(finding: RiskFinding) {
    setSelectedFinding(finding);
    setExpandedFile(finding.file);
  }

  return (
    <div className="mt-10 w-full max-w-4xl mx-auto space-y-6">
      {riskReport.warnings.length > 0 && (
        <section className="rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium mb-1">Partial analysis</p>
          <ul className="list-disc list-inside space-y-1 text-amber-100/90">
            {riskReport.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
          Pull Request
        </h2>
        <h3 className="text-lg font-medium text-white mb-4">{pullRequest.title}</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">Repository</dt>
            <dd className="text-zinc-200 font-mono">{pullRequest.repository}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Author</dt>
            <dd className="text-zinc-200">{pullRequest.author}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Branches</dt>
            <dd className="text-zinc-200 font-mono">
              {pullRequest.headBranch} → {pullRequest.baseBranch}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Changes</dt>
            <dd className="text-zinc-200">
              <span className="text-emerald-400">+{pullRequest.additions}</span>
              {" / "}
              <span className="text-red-400">-{pullRequest.deletions}</span>
              {" · "}
              {pullRequest.filesChanged} files
            </dd>
          </div>
        </dl>
      </section>

      <section className={`rounded-xl border p-6 ${riskStyles[riskReport.overallRisk]}`}>
        <h2 className="text-xs font-medium uppercase tracking-wider opacity-70 mb-4">
          Overall Risk
        </h2>
        <div className="flex items-baseline gap-4">
          <p className="text-3xl font-semibold tracking-tight">{riskReport.overallRisk}</p>
          <p className="text-lg tabular-nums opacity-90">{riskReport.riskScore} / 100</p>
        </div>
        <p className="mt-4 text-sm leading-relaxed opacity-90">{riskReport.summary}</p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
          Risk Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <RiskMeter label="Security" value={riskReport.securityRisk} />
          <RiskMeter label="Bug" value={riskReport.bugRisk} />
          <RiskMeter label="Quality" value={riskReport.qualityRisk} />
          <RiskMeter label="Performance" value={riskReport.performanceRisk} />
        </div>
      </section>

      {riskReport.findings.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Why is this risky?
          </h2>
          <div className="space-y-4">
            {riskReport.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                selected={selectedFinding?.id === finding.id}
                onClick={() => handleFindingClick(finding)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
          Change Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Files changed" value={summary.filesChanged} />
          <StatCard label="Lines added" value={summary.additions} valueClass="text-emerald-400" />
          <StatCard label="Lines removed" value={summary.deletions} valueClass="text-red-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            label={summary.testsChanged ? "Tests changed" : "No test changes"}
            variant={summary.testsChanged ? "success" : "neutral"}
          />
          <Badge
            label={
              summary.securitySensitive
                ? "Security-sensitive files"
                : "No security-sensitive files"
            }
            variant={summary.securitySensitive ? "warning" : "neutral"}
          />
        </div>
      </section>

      {riskReport.recommendations.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Recommendations
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
            {riskReport.recommendations.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        </section>
      )}

      <DiffViewer
        fileDiffs={riskReport.fileDiffs}
        selectedFinding={selectedFinding}
        expandedFile={expandedFile}
        onFileSelect={setExpandedFile}
      />
    </div>
  );
}

interface RiskMeterProps {
  label: string;
  value: number;
}

function RiskMeter({ label, value }: RiskMeterProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-300">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-zinc-200 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

interface FindingCardProps {
  finding: RiskFinding;
  selected: boolean;
  onClick: () => void;
}

function FindingCard({ finding, selected, onClick }: FindingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-zinc-500 bg-zinc-800/80"
          : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${severityStyles[finding.severity]}`}
        >
          {finding.severity}
        </span>
        <span className={`text-xs font-medium uppercase ${categoryStyles[finding.category]}`}>
          {finding.category}
        </span>
      </div>

      <h3 className="text-sm font-medium text-white mb-2">{finding.title}</h3>

      <p className="text-xs font-mono text-zinc-400 mb-2">
        {finding.file}
        {finding.line ? `:${finding.line}` : ""}
      </p>

      {finding.evidence && (
        <pre className="mb-2 overflow-x-auto rounded bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
          {finding.evidence}
        </pre>
      )}

      <p className="text-sm text-zinc-400 leading-relaxed">{finding.description}</p>

      <p className="mt-3 text-sm text-zinc-300">
        <span className="text-zinc-500">Recommendation: </span>
        {finding.recommendation}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        Confidence: {Math.round(finding.confidence * 100)}%
      </p>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  valueClass?: string;
}

function StatCard({ label, value, valueClass = "text-white" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
