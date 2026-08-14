import { useEffect, useRef } from "react";
import type { FileDiff, RiskFinding } from "../services/api";

interface DiffViewerProps {
  fileDiffs: FileDiff[];
  selectedFinding: RiskFinding | null;
  activeFile: string | null;
  onSelectFile: (filename: string) => void;
}

export function DiffViewer({
  fileDiffs,
  selectedFinding,
  activeFile,
  onSelectFile,
}: DiffViewerProps) {
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!selectedFinding?.line && selectedFinding?.diffPosition === undefined) {
      return;
    }

    const key = `${selectedFinding.file}:${selectedFinding.line ?? selectedFinding.diffPosition}`;
    const element = lineRefs.current.get(key);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedFinding]);

  const visibleFile =
    activeFile ??
    selectedFinding?.file ??
    fileDiffs[0]?.filename ??
    null;

  const currentDiff = fileDiffs.find((file) => file.filename === visibleFile);

  if (fileDiffs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Changed Files
      </h2>

      <div className="space-y-2">
        {fileDiffs.map((file) => (
          <button
            key={file.filename}
            type="button"
            onClick={() => onSelectFile(file.filename)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-mono transition-colors ${
              visibleFile === file.filename
                ? "border-zinc-600 bg-zinc-800 text-white"
                : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <span>{file.filename}</span>
            <span className="float-right text-zinc-500">
              +{file.additions} -{file.deletions}
            </span>
          </button>
        ))}
      </div>

      {currentDiff && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-2 text-xs font-mono text-zinc-400">
            {currentDiff.filename}
          </div>
          <div className="max-h-[28rem] overflow-auto p-3 font-mono text-xs leading-6">
            {currentDiff.lines.length === 0 ? (
              <p className="text-zinc-500">No patch available for this file.</p>
            ) : (
              currentDiff.lines.map((line) => {
                const isHighlighted =
                  selectedFinding !== null &&
                  selectedFinding.file === currentDiff.filename &&
                  ((selectedFinding.line !== undefined &&
                    line.newLine === selectedFinding.line) ||
                    (selectedFinding.diffPosition !== undefined &&
                      line.diffPosition === selectedFinding.diffPosition));

                const refKey = `${currentDiff.filename}:${line.newLine ?? line.diffPosition}`;
                const prefix =
                  line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
                const lineNumber = line.newLine ?? line.oldLine ?? " ";

                return (
                  <div
                    key={`${currentDiff.filename}-${line.diffPosition}`}
                    ref={(element) => {
                      if (element) {
                        lineRefs.current.set(refKey, element);
                      }
                    }}
                    className={`grid grid-cols-[3rem_1rem_1fr] gap-2 px-2 rounded ${
                      isHighlighted
                        ? "bg-amber-950/60 border border-amber-800/60"
                        : "border border-transparent"
                    }`}
                  >
                    <span className="text-zinc-600 select-none tabular-nums">{lineNumber}</span>
                    <span
                      className={
                        line.type === "add"
                          ? "text-emerald-400"
                          : line.type === "remove"
                            ? "text-red-400"
                            : "text-zinc-600"
                      }
                    >
                      {prefix}
                    </span>
                    <span className="text-zinc-200 whitespace-pre-wrap break-all">{line.content}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
