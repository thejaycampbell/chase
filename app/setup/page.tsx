"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HealthResponse {
  ready: boolean;
  has_data: boolean;
  checks: {
    niche_description: boolean;
    subreddits: boolean;
    llm_key: boolean;
    supabase: boolean;
  };
  config: {
    niche_name: string | null;
    subreddits: string[];
    llm_provider: string;
    min_relevance_score: number;
    min_upvotes: number;
    min_comments: number;
    dashboard_password_set: boolean;
    reply_style_set: boolean;
    exclude_signals_set: boolean;
  };
}

type RunState = "idle" | "running" | "done" | "error";

interface RunResult {
  message?: string;
  posts_found?: number;
  posts_scanned?: number;
  error?: string;
}

function CheckRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <span className={`mt-0.5 text-sm font-mono ${ok ? "text-green-400" : "text-red-400"}`}>
        {ok ? "✓" : "✗"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${ok ? "text-zinc-200" : "text-zinc-400"}`}>{label}</p>
        {detail && <p className="text-xs text-zinc-600 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function OptionalRow({ label, set, detail }: { label: string; set: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <span className={`mt-0.5 text-sm font-mono ${set ? "text-green-400" : "text-zinc-600"}`}>
        {set ? "✓" : "○"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${set ? "text-zinc-200" : "text-zinc-500"}`}>
          {label}
          {!set && <span className="ml-2 text-xs text-zinc-600">(optional)</span>}
        </p>
        {detail && <p className="text-xs text-zinc-600 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

export default function SetupPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [runState, setRunState] = useState<RunState>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setLoadError(true));
  }, []);

  async function triggerRun() {
    setRunState("running");
    setRunResult(null);
    try {
      const res = await fetch("/api/run");
      const data = await res.json();
      setRunResult(data);
      setRunState(res.ok ? "done" : "error");
      // Refresh health after a successful run
      if (res.ok) {
        const h = await fetch("/api/health").then((r) => r.json());
        setHealth(h);
      }
    } catch {
      setRunResult({ error: "Network error — check your terminal logs." });
      setRunState("error");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">Chase</h1>
          <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
            Setup
          </span>
        </div>
        <p className="text-sm text-zinc-500">
          Configure your environment variables, then trigger your first run.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          Could not reach /api/health. Make sure the dev server is running and your Supabase env
          vars are set.
        </div>
      )}

      {health && (
        <>
          {/* Required checks */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Required
            </h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 divide-y-0">
              <CheckRow
                label="Niche description"
                ok={health.checks.niche_description}
                detail={
                  health.checks.niche_description
                    ? health.config.niche_name
                      ? `NICHE_NAME: "${health.config.niche_name}"`
                      : "NICHE_DESCRIPTION is set"
                    : "Set NICHE_DESCRIPTION in your .env.local"
                }
              />
              <CheckRow
                label="Subreddits"
                ok={health.checks.subreddits}
                detail={
                  health.checks.subreddits
                    ? health.config.subreddits.map((s) => `r/${s}`).join(", ")
                    : "Set SUBREDDITS as a comma-separated list in .env.local"
                }
              />
              <CheckRow
                label={`LLM API key (${health.config.llm_provider})`}
                ok={health.checks.llm_key}
                detail={
                  health.checks.llm_key
                    ? `${health.config.llm_provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} is set`
                    : `Set ${health.config.llm_provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} in .env.local`
                }
              />
              <CheckRow
                label="Supabase"
                ok={health.checks.supabase}
                detail={
                  health.checks.supabase
                    ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
                    : "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
                }
              />
            </div>
          </section>

          {/* Optional tuning */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Optional — improves output quality
            </h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 divide-y-0">
              <OptionalRow
                label="Reply style"
                set={health.config.reply_style_set}
                detail="REPLY_STYLE — describe your voice and tone to guide reply generation"
              />
              <OptionalRow
                label="Exclude signals"
                set={health.config.exclude_signals_set}
                detail="EXCLUDE_SIGNALS — post types to skip (e.g. job postings, memes)"
              />
              <OptionalRow
                label="Dashboard password"
                set={health.config.dashboard_password_set}
                detail="DASHBOARD_PASSWORD — leave empty for public access"
              />
            </div>
            <p className="text-xs text-zinc-600 px-1">
              Scoring: relevance ≥ {health.config.min_relevance_score}/10 · upvotes ≥{" "}
              {health.config.min_upvotes} or comments ≥ {health.config.min_comments}
            </p>
          </section>

          {/* Run trigger */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              First run
            </h2>

            {health.has_data ? (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-2">
                <p className="text-sm text-green-400 font-medium">Data found. You're all set.</p>
                <Link href="/" className="text-xs text-green-500 hover:text-green-300 underline">
                  Go to dashboard →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">
                  No runs yet. Click below to fetch today's posts, score them, and save to Supabase.
                  This takes 15–45 seconds.
                </p>
                <button
                  onClick={triggerRun}
                  disabled={!health.ready || runState === "running"}
                  className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {runState === "running" ? "Running… (15–45s)" : "Trigger first run"}
                </button>
                {!health.ready && (
                  <p className="text-xs text-yellow-500/80">
                    Complete all required checks above before running.
                  </p>
                )}
              </div>
            )}

            {runResult && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  runState === "done"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {runState === "done" ? (
                  <div className="space-y-1">
                    <p className="font-medium">Run complete.</p>
                    <p className="text-xs opacity-80">
                      {runResult.posts_found} posts kept from {runResult.posts_scanned} scanned.
                    </p>
                    <Link href="/" className="text-xs underline hover:opacity-80 block mt-2">
                      View dashboard →
                    </Link>
                  </div>
                ) : (
                  <p>{runResult.error ?? runResult.message ?? "Unknown error"}</p>
                )}
              </div>
            )}
          </section>

          {/* Supabase SQL reminder */}
          {!health.checks.supabase && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Supabase table
              </h2>
              <p className="text-xs text-zinc-500">
                Run this SQL in your Supabase project → SQL Editor:
              </p>
              <pre className="text-xs bg-zinc-900 border border-zinc-800 rounded-md p-4 text-zinc-300 overflow-x-auto">
                {`create table if not exists chase_runs (
  id uuid default gen_random_uuid() primary key,
  date text unique not null,
  generated_at timestamptz not null default now(),
  posts jsonb not null default '[]'::jsonb
);`}
              </pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
