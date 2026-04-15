import { NextResponse } from "next/server";

// Public config status endpoint — safe to expose (reveals which vars are SET, never their values)
export async function GET() {
  const provider = (process.env.LLM_PROVIDER ?? "claude").toLowerCase();

  const llmKeySet =
    provider === "openai"
      ? !!process.env.OPENAI_API_KEY
      : !!process.env.ANTHROPIC_API_KEY;

  const subreddits = (process.env.SUBREDDITS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const checks = {
    niche_description: !!process.env.NICHE_DESCRIPTION,
    subreddits: subreddits.length > 0,
    llm_key: llmKeySet,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const allReady = Object.values(checks).every(Boolean);

  let hasData = false;
  if (checks.supabase) {
    try {
      const { createSupabase } = await import("@/lib/supabase");
      const supabase = createSupabase();
      const { count } = await supabase
        .from("chase_runs")
        .select("*", { count: "exact", head: true });
      hasData = (count ?? 0) > 0;
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({
    ready: allReady,
    has_data: hasData,
    checks,
    config: {
      niche_name: process.env.NICHE_NAME ?? null,
      subreddits,
      llm_provider: provider,
      reddit_sort: process.env.REDDIT_SORT ?? "rising",
      min_relevance_score: parseInt(process.env.MIN_RELEVANCE_SCORE ?? "6", 10),
      min_upvotes: parseInt(process.env.MIN_UPVOTES ?? "5", 10),
      min_comments: parseInt(process.env.MIN_COMMENTS ?? "1", 10),
      max_reply_age_hours: parseInt(process.env.MAX_REPLY_AGE_HOURS ?? "12", 10),
      dashboard_password_set: !!process.env.DASHBOARD_PASSWORD,
      reply_style_set: !!process.env.REPLY_STYLE,
      exclude_signals_set: !!process.env.EXCLUDE_SIGNALS,
    },
  });
}
