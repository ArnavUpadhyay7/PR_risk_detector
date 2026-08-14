import { getGitHubLoginUrl } from "../services/api";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-zinc-500">PR Risk Detector</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Sign in to continue</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Analyze pull request merge risk, track analysis history across commits, and compare how risk changes over time.
        </p>
        <a
          href={getGitHubLoginUrl()}
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
