import type { Post, RedditListingResponse } from "@/lib/types";

const REDDIT_USER_AGENT = "chase/1.0 (open-source Reddit monitor)";
const POSTS_PER_SUBREDDIT = 50;

interface RawRedditPost {
  id: string;
  title: string;
  permalink: string;
  subreddit: string;
  author: string;
  ups: number;
  num_comments: number;
  created_utc: number;
  selftext: string;
  is_self: boolean;
}

function toPartialPost(
  raw: RawRedditPost
): Omit<Post, "relevance_score" | "engagement_type" | "engagement_coaching" | "suggested_reply"> {
  return {
    id: raw.id,
    title: raw.title,
    url: `https://www.reddit.com${raw.permalink}`,
    subreddit: raw.subreddit,
    author: raw.author,
    upvotes: raw.ups,
    comment_count: raw.num_comments,
    posted_at: new Date(raw.created_utc * 1000).toISOString(),
    body_preview: raw.selftext.slice(0, 400).trim(),
  };
}

function isEngaged(post: RawRedditPost, minUpvotes: number, minComments: number): boolean {
  return post.ups >= minUpvotes || post.num_comments >= minComments;
}

function isUsable(post: RawRedditPost): boolean {
  if (post.author === "[deleted]" || post.author === "AutoModerator") return false;
  if (post.selftext === "[deleted]" || post.selftext === "[removed]") return false;
  return true;
}

function isRecent(post: RawRedditPost, maxAgeHours: number): boolean {
  const ageMs = Date.now() - post.created_utc * 1000;
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

async function fetchSubreddit(
  subreddit: string,
  sort: string,
  minUpvotes: number,
  minComments: number,
  maxAgeHours: number
): Promise<RawRedditPost[]> {
  // "rising" = posts gaining momentum right now — the sweet spot for reply visibility.
  // Your reply lands while the thread is still active and comment rankings aren't locked in.
  // "hot" = already-peaked posts; replies get buried under established top comments.
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${POSTS_PER_SUBREDDIT}`;

  const res = await fetch(url, {
    headers: { "User-Agent": REDDIT_USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error(`Reddit fetch failed for r/${subreddit} [${sort}]: ${res.status}`);
    return [];
  }

  const json: RedditListingResponse = await res.json();

  return json.data.children
    .map((c) => c.data as RawRedditPost)
    .filter(
      (p) =>
        isUsable(p) &&
        isEngaged(p, minUpvotes, minComments) &&
        isRecent(p, maxAgeHours)
    );
}

export async function fetchRedditPosts(subreddits: string[]): Promise<RawRedditPost[]> {
  const sort = (process.env.REDDIT_SORT ?? "rising").toLowerCase();
  const minUpvotes = parseInt(process.env.MIN_UPVOTES ?? "5", 10);
  const minComments = parseInt(process.env.MIN_COMMENTS ?? "1", 10);
  const maxAgeHours = parseInt(process.env.MAX_REPLY_AGE_HOURS ?? "12", 10);

  const results = await Promise.allSettled(
    subreddits.map((s) => fetchSubreddit(s, sort, minUpvotes, minComments, maxAgeHours))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export { toPartialPost };
export type { RawRedditPost };
