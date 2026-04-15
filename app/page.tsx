import Link from "next/link";
import { fetchLatestRun } from "@/lib/api";
import { PostList } from "@/components/post-list";

function formatDate(isoDate: string): string {
  // Date-only strings (YYYY-MM-DD) parse as midnight UTC — format in UTC to avoid day-shift.
  return new Date(isoDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function HomePage() {
  const run = await fetchLatestRun();
  const nicheName = process.env.NICHE_NAME ?? "Chase";

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-zinc-100">Chase</h1>
          {run ? (
            <p className="text-sm text-zinc-500">
              {formatDate(run.date)} · Generated at{" "}
              {new Date(run.generated_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/New_York",
              })}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">No data yet.</p>
          )}
        </div>
        <Link
          href="/setup"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1 shrink-0"
        >
          Setup
        </Link>
      </header>

      {run ? (
        <PostList posts={run.posts} nicheName={nicheName} />
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-8 py-14 text-center space-y-4">
          <p className="text-zinc-300 font-medium">No signal data yet.</p>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">
            Complete setup and trigger your first run to see today's opportunities.
          </p>
          <Link
            href="/setup"
            className="inline-block mt-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white transition-colors"
          >
            Go to setup →
          </Link>
        </div>
      )}
    </main>
  );
}
