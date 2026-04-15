import { createSupabase } from "@/lib/supabase";
import type { ChaseRun } from "@/lib/types";

// Returns today's run, or the most recent run if today's doesn't exist yet.
// Server-only — called from the page Server Component.
export async function fetchLatestRun(): Promise<ChaseRun | null> {
  try {
    const supabase = createSupabase();
    const { data, error } = await supabase
      .from("chase_runs")
      .select("date, generated_at, posts")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return data as ChaseRun;
  } catch {
    return null;
  }
}
