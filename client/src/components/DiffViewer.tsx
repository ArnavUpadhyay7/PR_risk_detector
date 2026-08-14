import { useEffect, useRef } from "react";
import type { FileDiff, RiskFinding } from "../services/api";

interface DiffViewerProps {
  fileDiffs: FileDiff[];
  selectedFinding: RiskFinding | null;
  expandedFile: string | null;
  onFileSelect: (filename: string) => void;
}

const severityHighlight: Record<RiskFinding["severity"], string> = {
  LOW: "bg-zinc-800/80 ring-1 ring-zinc-600",
  MEDIUM: "bg-amber-950/50 ring-1 ring-amber-700",
  HIGH: "bg-orange-950/50 ring-1 ring-orange-700",
  CRITICAL: "bg-red-950/60 ring-1 ring-red-700",
};

export function DiffViewer({
  fileDiffs,
  selectedFinding,
  expandedFile,
  onFileSelect,
}: DiffViewerProps) {
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedFinding) return;

    const key = `${selectedFinding.file}:${selectedFinding.line ?? selectedFinding.diffPosition ?? "file"}`;
    const element = lineRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedFinding, expandedFile]);

  if (fileDiffs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
        Changed Files
      </h2>

      <div className="space-y-2 mb-6">
        {fileDiffs.map((file) => (
          <button
            key={file.filename}
            type="button"
            onClick={() => onFileSelect(file.filename)}
            className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
              expandedFile === file.filename
                ? "border-zinc-600 bg-zinc-800 text-white"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <span className="font-mono truncate">{file.filename}</span>
            <span className="shrink-0 tabular-nums text-xs text-zinc-500">
              <span className="text-emerald-400">+{file.additions}</span>
              {" "}
              <span className="text-red-400">-{file.deletions}</span>
            </span>
          </button>
        ))}
      </div>

      {expandedFile && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3 font-mono">{expandedFile}</h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="max-h-[28rem] overflow-auto p-3 font-mono text-xs leading-6">
              {fileDiffs
                .find((file) => file.filename === expandedFile)
                ?.lines.map((line) => {
                  const isSelected =
                    selectedFinding?.file === expandedFile &&
                    (selectedFinding.line === line.newLine ||
                      selectedFinding.line === line.oldLine ||
                      selectedFinding.diffPosition === line.diffPosition);

                  const lineNumber = line.newLine ?? line.oldLine;
                  const refKey = `${expandedFile}:${lineNumber ?? line.diffPosition}`;

                  return (
                    <div
                      key={`${expandedFile}-${line.diffPosition}-${line.type}`}
                      ref={(element) => {
                        lineRefs.current[refKey] = element;
                      }}
                      className={`flex gap-3 rounded px-2 ${
                        isSelected && selectedFinding
                          ? severityHighlight[selectedFinding.severity]
                          : ""
                      }`}
                    >
                      <span className="w-10 shrink-0 text-right text-zinc-600 tabular-nums">
                        {lineNumber ?? ""}
                      </span>
                      <span
                        className={`w-4 shrink-0 ${
                          line.type === "add"
                            ? "text-emerald-400"
                            : line.type === "remove"
                              ? "text-red-400"
                              : "text-zinc-600"
                        }`}
                      >
                        {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                      </span>
                      <span
                        className={`flex-1 whitespace-pre-wrap break-all ${
                          line.type === "add"
                            ? "text-emerald-200"
                            : line.type === "remove"
                              ? "text-red-300"
                              : "text-zinc-400"
                        }`}
                      >
                        {line.content || " "}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
