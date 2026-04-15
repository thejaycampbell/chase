# Chase

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fthejaycampbell%2Fchase&env=NICHE_NAME,NICHE_DESCRIPTION,SUBREDDITS,LLM_PROVIDER,ANTHROPIC_API_KEY,SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY&envDescription=Required%20variables%20to%20configure%20Chase&envLink=https%3A%2F%2Fgithub.com%2Fthejaycampbell%2Fchase%23setup)

A self-hosted Reddit signal monitor. Every day it scans your configured subreddits, scores each post for relevance to your niche, and surfaces the ones worth engaging with — with coaching on how to approach each conversation and a suggested reply to start from.

**Built for:** anyone who wants to show up in Reddit conversations consistently and authentically — whether you're building authority, promoting a product, doing competitive research, or gathering content ideas.

**Stack:** Next.js 16 · Supabase · Claude or GPT-4o · Tailwind · Vercel (free Hobby plan)

---

## How it works

1. A daily Vercel cron hits `/api/run` at 11am UTC
2. It fetches **rising** posts from your subreddits — posts currently gaining momentum, not already-peaked ones
3. An LLM scores each post for relevance, classifies the engagement type (complaint, help-wanted, question, advice-seeking, discussion, story), and writes engagement coaching: not just why it's relevant, but how to approach that specific conversation
4. Posts above your threshold are saved to Supabase
5. The dashboard shows each opportunity with: post body, engagement type, coaching, a suggested reply to edit and post, and a color-coded age indicator so you know which threads are still live

---

## Before you configure — five questions

Your answers map directly to `.env.local`. Read them before copying the example file.

**1. What is your niche — and why do you want to show up there?**
One specific sentence. "I build AI tools for sales teams" is good. "I work in tech" is useless. This is the scoring lens — precision here directly determines output quality. Set as `NICHE_DESCRIPTION`.

You don't need a product to sell. The niche description works equally well for authority-building, competitive research, or content ideation — just describe what you're looking for. "I'm a freelance CRO consultant looking for posts where people are struggling with conversion or questioning their landing page strategy" is just as valid as a product pitch.

**2. What subreddits do you want to monitor?**
Go one level more specific than feels obvious. The broad communities (`r/entrepreneur`, `r/sales`, `r/SaaS`) are overcrowded with vendors and have aggressive moderation. The communities one level down have genuine conversations, less competition, and more receptive audiences.

See the [Subreddit selection guide](#subreddit-selection-guide) below.

**3. What kinds of posts are you looking for?**
Refine `NICHE_DESCRIPTION` to describe what a signal looks like in practice. "...especially complaints about their current CRM or direct asks for outreach tool recommendations" is much better than stopping at the niche description.

**4. Which LLM — Claude or OpenAI?**
Both work. Claude (`claude-sonnet-4-6`) produces more consistent structured JSON. GPT-4o is fine too. Set `LLM_PROVIDER=claude` or `LLM_PROVIDER=openai`.

**5. Public dashboard or password-protected?**
Set `DASHBOARD_PASSWORD` to password-protect. Leave empty for public access.

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- An Anthropic or OpenAI API key
- A [Vercel](https://vercel.com) account (free Hobby plan)

### 1. Clone

```bash
git clone https://github.com/your-username/chase.git
cd chase
npm install
```

### 2. Create the Supabase table

In your Supabase project, go to **SQL Editor** and run:

```sql
create table if not exists chase_runs (
  id uuid default gen_random_uuid() primary key,
  date text unique not null,
  generated_at timestamptz not null default now(),
  posts jsonb not null default '[]'::jsonb
);
```

Copy your **Project URL** and **service_role key** from Project Settings > API. Use the service_role key — not the anon key.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Required:

| Variable | What it is |
|----------|-----------|
| `NICHE_NAME` | Short label for the dashboard header |
| `NICHE_DESCRIPTION` | The scoring lens — your niche + what a good signal looks like |
| `SUBREDDITS` | Comma-separated subreddits (no `r/` prefix) |
| `LLM_PROVIDER` | `claude` or `openai` |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | Key for your chosen provider |
| `SUPABASE_URL` | From Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase > Project Settings > API |

Optional but recommended:

| Variable | Default | What it does |
|----------|---------|-------------|
| `REPLY_STYLE` | — | Your voice and tone — biggest single improvement to reply quality |
| `EXCLUDE_SIGNALS` | — | Post types to skip (e.g. "job postings, memes, weekly threads") |
| `REDDIT_SORT` | `rising` | `rising` (recommended) or `hot` |
| `MAX_REPLY_AGE_HOURS` | `12` | Filter out posts older than this — past their reply window |
| `MIN_RELEVANCE_SCORE` | `6` | Raise to `7–8` for tighter signal |
| `MIN_UPVOTES` | `5` | Posts below this count aren't proven yet |
| `MIN_COMMENTS` | `1` | Skip posts with zero engagement |
| `DASHBOARD_PASSWORD` | — | Password-protect the dashboard |

### 4. Run locally

```bash
npm run dev
```

### 5. Complete setup at `/setup`

Visit [http://localhost:3000/setup](http://localhost:3000/setup).

The setup page checks every required env var live, shows your subreddit list and config, and has a "Trigger first run" button that disables until all required vars are set. No guessing what's missing.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git remote add origin https://github.com/your-username/chase.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add all environment variables from `.env.local` in **Project Settings > Environment Variables**
4. Deploy

The `vercel.json` cron runs `/api/run` daily at 11am UTC (7am ET).

### 3. Verify at `/setup`

Visit `https://your-app.vercel.app/setup`. Trigger the first run from there, or via curl:

```bash
# CRON_SECRET is auto-generated by Vercel — find it in Project Settings > Environment Variables
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/run
```

---

## Subreddit selection guide

The most common mistake is starting with the biggest, most obvious subreddits. Don't.

**Why broad subreddits hurt you:**
- r/sales, r/entrepreneur, r/SaaS are monitored by every vendor and marketer already
- Mod teams actively remove vendor replies and shadowban promotional accounts
- High volume = high noise = the LLM scores more posts as borderline-relevant
- Your reply competes with 50+ others in an already-noisy thread

**The right approach: go one level more specific**

| Instead of | Try |
|-----------|-----|
| `r/sales` | `r/salestechniques`, `r/salesforce`, `r/hubspot` |
| `r/SaaS` | `r/microsaas`, `r/indiehackers` |
| `r/entrepreneur` | `r/smallbusiness`, `r/ecommerce` |
| `r/marketing` | `r/content_marketing`, `r/SEO`, `r/PPC` |
| `r/programming` | `r/webdev`, `r/devops`, `r/ExperiencedDevs` |
| `r/personalfinance` | `r/financialindependence`, `r/Bogleheads` |

Niche subreddits have: less vendor competition, more genuine conversations, smaller mod teams, and audiences who aren't already numb to tool recommendations.

**Starter lists by category:**

- Sales tools: `salestechniques, salesforce, hubspot, outreach_io, apollo_io`
- Dev tools: `webdev, devops, ExperiencedDevs, node`
- SaaS / founders: `microsaas, indiehackers, EntrepreneurRideAlong`
- Finance tools: `financialindependence, Bogleheads, personalfinance`
- HR / recruiting: `recruitinghell, humanresources, jobs`
- Design tools: `graphic_design, UI_Design, web_design`

Start with 3–5 subreddits, not 10. Better signal, easier to manage.

---

## Reddit account health

**Read this before your first run.**

Chase surfaces opportunities and writes suggested replies. What it cannot do is protect your Reddit account from spam detection. That's on you.

Reddit's algorithm flags accounts that:
- Comment in a narrow topical range across multiple subreddits in the same day
- Post at consistent daily intervals (automated-looking patterns)
- Have a low karma-to-activity ratio
- Are new accounts making high volumes of comments

**Minimum account hygiene:**

1. **Don't use your personal account.** Create a dedicated account for this. If it gets flagged, you lose the tool account — not your reputation.
2. **Warm up the account first.** Spend 2–3 weeks making genuine contributions before you start using Chase output. Vote on posts. Comment on things you actually know about. Build karma in your target subreddits.
3. **Limit replies to 2–3 per day.** More than that starts to look automated. Quality beats volume on Reddit.
4. **Always edit the suggested reply before posting.** One specific detail that references something in the thread — the OP's wording, a number they mentioned, a specific tool they named — makes your reply feel human. Copy-pasting AI output verbatim is the fastest way to get downvoted and flagged.
5. **Check the subreddit rules before your first post there.** Many subreddits have explicit "no vendor replies" or "no self-promotion" rules. Chase doesn't know these. You need to.

---

## How to read the dashboard

**Engagement types:**
- **Complaint** (red) — someone venting about a problem. Don't lead with solutions. Validate first.
- **Help wanted** (blue) — actively seeking a tool or service. You can be direct and specific.
- **Evaluation** (amber) — actively comparing tools or approaches before a decision. High intent. Name trade-offs honestly — lists with pros/cons outperform pure endorsements here.
- **Question / Advice-seeking** — conceptual or opinion-based. Be a peer, not a vendor.
- **Discussion / Story** — low commercial intent. Engage genuinely or skip.

**Age color on the timestamp:**
- Green = under 4 hours. Thread is live. Reply now.
- Yellow = 4–10 hours. Still worth it for slower subreddits.
- Grey = over 10 hours. Thread is cooling. Evaluate before spending time.

**The suggested reply is a starting point, not a final draft.** Read the actual thread before replying. If the top comment already covers what you were going to say, find a different angle or reply to that comment instead of the original post.

---

## Customization

### Improve reply quality

Set `REPLY_STYLE`. This is the highest-leverage thing you can do after initial setup:

```
REPLY_STYLE="Direct and specific. I'm a practitioner who has run outbound
sales teams. I lead with what actually worked, not generic advice. I mention
my product only when someone explicitly asks for tool recommendations, and
always alongside 2-3 alternatives — never as the only answer."
```

### Filter by post age

`MAX_REPLY_AGE_HOURS=12` is the default. Adjust for your subreddits:
- Fast communities (r/sales, r/webdev): lower to `6`
- Slower communities (r/microsaas, niche tools): raise to `24`

### Change sort method

`REDDIT_SORT=rising` is the default and recommended setting. If rising returns too few posts for your subreddits (common for smaller communities), switch to `hot`.

### Change the cron schedule

Edit `vercel.json`. Vercel Hobby plan: max 1 cron job, once per day minimum. Pro plan supports every 5 minutes.

```json
{
  "crons": [{ "path": "/api/run", "schedule": "0 11 * * *" }]
}
```

---

## Project structure

```
app/
  api/
    health/route.ts      # Config status — used by /setup
    run/route.ts         # Cron endpoint: Reddit → LLM → Supabase
  login/page.tsx         # Password gate (active when DASHBOARD_PASSWORD is set)
  setup/page.tsx         # Onboarding checklist + first-run trigger
  page.tsx               # Dashboard
components/
  post-card.tsx          # Post card: body preview, coaching, reply, copy nudge
  post-list.tsx          # List with opportunity count
lib/
  api.ts                 # Supabase read helper
  llm.ts                 # LLM scoring — Claude + OpenAI, engagement coaching
  reddit.ts              # Rising/hot post fetcher with age + engagement filter
  supabase.ts            # Supabase client factory
  types.ts               # Shared TypeScript types
proxy.ts                 # Password gate (Next.js 16 proxy)
vercel.json              # Daily cron schedule
.env.local.example       # All env vars with comments
```

---

## Cost estimate

Typical config: 5 subreddits · ~80 posts/day after rising + age filter · Claude Sonnet.

| Item | Est. cost |
|------|-----------|
| Claude Sonnet input (~12k tokens/day) | ~$0.036/day |
| Claude Sonnet output (~2.5k tokens/day) | ~$0.012/day |
| Supabase free tier | $0 |
| Vercel Hobby | $0 |
| **Total** | **~$1.45/month** |

Switching to Claude Haiku or GPT-4o-mini cuts LLM cost ~10x with some quality tradeoff.

---

## Troubleshooting

**`/setup` shows Supabase as unconfigured**
Make sure you're using the `service_role` key, not the `anon` key. Restart the dev server after changing `.env.local`.

**Run finds 0 posts**
Rising has fewer posts than hot for smaller subreddits. Try `REDDIT_SORT=hot` or lower `MAX_REPLY_AGE_HOURS` to `24`. Also check subreddit names — no `r/` prefix, exact spelling, public subreddits only.

**Posts are surfacing but replies feel generic**
Set `REPLY_STYLE`. This is the most common cause of generic output and the easiest fix.

**LLM returns malformed JSON**
Re-trigger the run — rare but the LLM occasionally produces non-JSON with very large post lists. If consistent, lower `POSTS_PER_SUBREDDIT` in `lib/reddit.ts`.

**Cron isn't running on Vercel**
`vercel.json` must be at the project root. Check Vercel > project > Cron Jobs. Crons only run on production deployments, not preview URLs.

---

## License

MIT
