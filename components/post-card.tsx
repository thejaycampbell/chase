"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Post } from "@/lib/types";

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "less than 1h ago";
  if (diffHours === 1) return "1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}

function postAgeColor(isoString: string): string {
  const diffHours = (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60);
  if (diffHours <= 4) return "text-green-500";
  if (diffHours <= 10) return "text-yellow-500";
  return "text-zinc-600";
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 6
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-zinc-700/40 text-zinc-500 border-zinc-600/30";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score}/10
    </span>
  );
}

const ENGAGEMENT_LABELS: Record<string, { label: string; color: string }> = {
  "complaint":      { label: "Complaint",      color: "bg-red-500/15 text-red-400 border-red-500/20" },
  "help-wanted":    { label: "Help wanted",     color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "evaluation":     { label: "Evaluation",      color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  "question":       { label: "Question",        color: "bg-zinc-700/40 text-zinc-300 border-zinc-600/30" },
  "advice-seeking": { label: "Advice-seeking",  color: "bg-zinc-700/40 text-zinc-300 border-zinc-600/30" },
  "discussion":     { label: "Discussion",      color: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30" },
  "story":          { label: "Story",           color: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30" },
};

export function PostCard({ post }: { post: Post }) {
  const [replyOpen, setReplyOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyReply() {
    await navigator.clipboard.writeText(post.suggested_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const engagementMeta = ENGAGEMENT_LABELS[post.engagement_type] ?? {
    label: post.engagement_type,
    color: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-100 hover:text-white hover:underline"
        >
          {post.title}
        </a>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
            r/{post.subreddit}
          </Badge>
          <ScorePill score={post.relevance_score} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${engagementMeta.color}`}>
            {engagementMeta.label}
          </span>
          <span className={`text-xs ml-auto tabular-nums ${postAgeColor(post.posted_at)}`}>
            ↑{post.upvotes} · {post.comment_count}c · {relativeTime(post.posted_at)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {post.body_preview && (
          <p className="text-xs text-zinc-600 leading-relaxed border-l-2 border-zinc-800 pl-3 italic line-clamp-3">
            {post.body_preview}
          </p>
        )}

        {/* Engagement coaching — HOW to reply, not just why it's relevant */}
        <p className="text-xs text-zinc-400 leading-relaxed">{post.engagement_coaching}</p>

        {post.suggested_reply && (
          <Collapsible open={replyOpen} onOpenChange={setReplyOpen}>
            <CollapsibleTrigger className="text-xs text-zinc-400 hover:text-zinc-200 px-0 h-auto bg-transparent border-0 cursor-pointer">
              {replyOpen ? "▾ Hide suggested reply" : "▸ Show suggested reply"}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-md bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {post.suggested_reply}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-zinc-700 text-zinc-300 hover:text-white"
                  onClick={copyReply}
                >
                  {copied ? "Copied!" : "Copy as starting point"}
                </Button>
                <span className="text-xs text-zinc-600">
                  Edit before posting — one specific detail makes it 10x more credible
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
