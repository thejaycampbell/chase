"use client";

import { PostCard } from "@/components/post-card";
import type { Post } from "@/lib/types";

function exportCsv(posts: Post[], nicheName: string) {
  const headers = [
    "Title",
    "Subreddit",
    "Type",
    "Score",
    "Upvotes",
    "Comments",
    "Posted",
    "URL",
    "Coaching",
    "Suggested Reply",
  ];

  const rows = posts.map((p) => [
    p.title,
    p.subreddit,
    p.engagement_type,
    p.relevance_score,
    p.upvotes,
    p.comment_count,
    p.posted_at,
    p.url,
    p.engagement_coaching,
    p.suggested_reply,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chase-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface PostListProps {
  posts: Post[];
  nicheName: string;
}

export function PostList({ posts, nicheName }: PostListProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">{nicheName}</h2>
        <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
          {posts.length} {posts.length === 1 ? "opportunity" : "opportunities"}
        </span>
        {posts.length > 0 && (
          <button
            onClick={() => exportCsv(posts, nicheName)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 hover:border-zinc-600 px-2.5 py-1 rounded-full"
          >
            Export CSV
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-500 italic py-4">
          No opportunities found today. Check back tomorrow.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
