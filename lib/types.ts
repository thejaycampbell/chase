export type EngagementType =
  | "question"
  | "advice-seeking"
  | "complaint"
  | "help-wanted"
  | "evaluation"
  | "discussion"
  | "story";

export interface Post {
  id: string;
  title: string;
  url: string;
  subreddit: string;
  author: string;
  upvotes: number;
  comment_count: number;
  posted_at: string;
  body_preview: string;
  relevance_score: number;
  engagement_type: EngagementType;
  engagement_coaching: string;
  suggested_reply: string;
}

export interface ChaseRun {
  date: string;
  generated_at: string;
  posts: Post[];
}

// Raw shape returned by Reddit's public JSON API
export interface RedditChild {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    subreddit: string;
    author: string;
    ups: number;
    num_comments: number;
    created_utc: number;
    selftext: string;
    is_self: boolean;
  };
}

export interface RedditListingResponse {
  data: {
    children: RedditChild[];
  };
}
