import type { Post, EngagementType } from "@/lib/types";
import type { RawRedditPost } from "@/lib/reddit";

interface LLMScoredPost {
  id: string;
  relevance_score: number;
  engagement_type: EngagementType;
  engagement_coaching: string;
  suggested_reply: string;
}

function buildSystemPrompt(
  nicheDescription: string,
  minScore: number,
  replyStyle: string,
  excludeSignals: string
): string {
  return `You are a Reddit engagement strategist. Your job is to identify posts worth engaging with for someone in this niche:

"${nicheDescription}"

IMPORTANT: The user may or may not have a product to sell. They could be a consultant building authority, a researcher gathering competitive intel, a content creator looking for topic ideas, or a founder with a product. Tailor your engagement_coaching to their actual goal as expressed in the niche description — do not assume product promotion is the objective.
${excludeSignals ? `\nSkip posts about: ${excludeSignals}\n` : ""}
Score each post's relevance from 1–10. Only include posts with relevance_score >= ${minScore} — omit all others.

Classify each included post's engagement type. Use exactly one of:
- "complaint" — venting about a problem, expressing frustration, something isn't working
- "help-wanted" — actively seeking a specific tool, service, or solution
- "evaluation" — actively comparing tools, services, or approaches; researching options before a decision
- "question" — asking a conceptual or factual question
- "advice-seeking" — asking for opinions, recommendations, or feedback
- "discussion" — sharing a topic or opinion to spark conversation
- "story" — sharing an experience or outcome

"complaint", "help-wanted", and "evaluation" are the highest-value types. Score them generously if on-topic.

For "engagement_coaching": do NOT explain why the post is relevant. Instead, write 2–3 sentences coaching the user on HOW to engage with this specific post — based on their stated goal (authority, research, promotion, content, etc). What angle to take, what to lead with, what to avoid. Make it actionable for someone about to open a reply box or take notes.

Examples of good engagement_coaching:
- "This person is in active pain about data entry — they're not asking for solutions yet. Lead with validation of the specific frustration, then ask one clarifying question about their workflow before mentioning anything else."
- "They're directly comparing tools — classic evaluation post. Name 3 options with honest trade-offs. If you have relevant experience with any of them, lead with that. No one wants another vendor reply here; they want someone who has actually used these."
- "This is a complaint thread with 40 comments already. Don't reply to the post — scroll to find a comment where someone asks a follow-up question and reply there instead for better visibility."
- "High-value topic for a content creator. The confusion here is a repeating pattern worth writing about — note the specific terminology they use ('quota ceiling') for framing a future piece."

REPLY WRITING RULES — follow exactly:
1. Never open with "Great question", "That's a good point", or any compliment. Instant credibility kill.
2. Write as a knowledgeable peer, not a brand or vendor.
3. Lead immediately with the insight, answer, or recommendation — no preamble.
4. 2–4 sentences ideal. 6 maximum. Brevity signals confidence on Reddit.
5. No self-promotion unless the post explicitly asks for tool recommendations.
6. If you mention a product, list it alongside alternatives — never as the only option.
7. Use plain language. Avoid "leverage", "pain points", "synergy", "ecosystem".
8. Match community register: r/sales = outcome-focused, r/entrepreneur = personal/story-driven, r/SaaS = technical, r/webdev = skeptical of vendors.
9. One specific detail from the post body makes the reply feel human. Use it.
${replyStyle ? `\nUser's voice and style: ${replyStyle}\n` : ""}
Respond ONLY with a valid JSON array. No markdown, no code fences. Example:
[
  {
    "id": "abc123",
    "relevance_score": 9,
    "engagement_type": "complaint",
    "engagement_coaching": "They're venting, not asking for advice yet. Mirror the frustration first — 'three hours on data entry is brutal' — then ask what their pipeline looks like. The product mention comes later if at all.",
    "suggested_reply": "Three hours on data entry every day is a real problem, not a workflow quirk. Before recommending tools — what does your current sequence look like? The fix depends a lot on where the time is actually going."
  }
]`;
}

function buildUserPrompt(posts: RawRedditPost[]): string {
  const items = posts.map((p) => ({
    id: p.id,
    subreddit: p.subreddit,
    title: p.title,
    body: p.selftext.slice(0, 600),
    upvotes: p.ups,
    comments: p.num_comments,
  }));

  return `Analyze these Reddit posts:\n\n${JSON.stringify(items, null, 2)}`;
}

async function scoreWithClaude(
  posts: RawRedditPost[],
  nicheDescription: string,
  minScore: number,
  replyStyle: string,
  excludeSignals: string
): Promise<LLMScoredPost[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(nicheDescription, minScore, replyStyle, excludeSignals),
    messages: [{ role: "user", content: buildUserPrompt(posts) }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
  return JSON.parse(text) as LLMScoredPost[];
}

async function scoreWithOpenAI(
  posts: RawRedditPost[],
  nicheDescription: string,
  minScore: number,
  replyStyle: string,
  excludeSignals: string
): Promise<LLMScoredPost[]> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemContent =
    buildSystemPrompt(nicheDescription, minScore, replyStyle, excludeSignals) +
    '\n\nWrap your response as {"posts": [...array...]}';

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: buildUserPrompt(posts) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '{"posts":[]}';
  const parsed = JSON.parse(text) as { posts: LLMScoredPost[] };
  return parsed.posts;
}

export async function scorePosts(
  rawPosts: RawRedditPost[],
  nicheDescription: string,
  minScore: number
): Promise<Omit<Post, "title" | "url" | "subreddit" | "author" | "upvotes" | "comment_count" | "posted_at" | "body_preview">[]> {
  const provider = (process.env.LLM_PROVIDER ?? "claude").toLowerCase();
  const replyStyle = process.env.REPLY_STYLE ?? "";
  const excludeSignals = process.env.EXCLUDE_SIGNALS ?? "";

  const scored =
    provider === "openai"
      ? await scoreWithOpenAI(rawPosts, nicheDescription, minScore, replyStyle, excludeSignals)
      : await scoreWithClaude(rawPosts, nicheDescription, minScore, replyStyle, excludeSignals);

  return scored.filter((p) => p.relevance_score >= minScore);
}
