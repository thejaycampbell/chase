import { NextResponse } from "next/server";

// LLM + Reddit calls can take up to 60s — raise the Vercel function timeout
export const maxDuration = 60;
import { fetchRedditPosts, toPartialPost } from "@/lib/reddit";
import { scorePosts } from "@/lib/llm";
import { createSupabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

// Vercel auto-generates CRON_SECRET and injects it into the Authorization header
// on every cron invocation. You don't need to set it manually — Vercel handles it.
// To trigger manually (e.g. curl), copy the value from your Vercel project env vars.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret set — allow all (dev mode)
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subredditsRaw = process.env.SUBREDDITS ?? "";
  const nicheDescription = process.env.NICHE_DESCRIPTION ?? "";
  const minScore = parseInt(process.env.MIN_RELEVANCE_SCORE ?? "6", 10);

  if (!subredditsRaw || !nicheDescription) {
    return NextResponse.json(
      { error: "SUBREDDITS and NICHE_DESCRIPTION must be set" },
      { status: 500 }
    );
  }

  const subreddits = subredditsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const date = todayUTC();
  const supabase = createSupabase();

  // Idempotency: skip if today's run already exists
  const { data: existing } = await supabase
    .from("chase_runs")
    .select("id")
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: `Run for ${date} already exists. Skipping.` });
  }

  // 1. Fetch Reddit posts
  const rawPosts = await fetchRedditPosts(subreddits);

  if (rawPosts.length === 0) {
    return NextResponse.json({ error: "No posts fetched from Reddit" }, { status: 500 });
  }

  // 2. Score with LLM
  const scoredFields = await scorePosts(rawPosts, nicheDescription, minScore);
  const scoredMap = new Map(scoredFields.map((s) => [s.id, s]));

  // 3. Merge raw post data with LLM scores
  const posts: Post[] = rawPosts
    .map((raw) => {
      const scored = scoredMap.get(raw.id);
      if (!scored) return null;
      return { ...toPartialPost(raw), ...scored };
    })
    .filter((p): p is Post => p !== null);

  // 4. Persist to Supabase
  const { error } = await supabase.from("chase_runs").insert({
    date,
    generated_at: new Date().toISOString(),
    posts,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save run" }, { status: 500 });
  }

  return NextResponse.json({
    message: `Run complete for ${date}`,
    posts_found: posts.length,
    posts_scanned: rawPosts.length,
  });
}
