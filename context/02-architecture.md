# 02 - Architecture

## The three-plane system

The whole design is three planes decoupled through Postgres.
Each plane can be reasoned about, deployed, and broken independently; the DB is the only coupling.

```
stocks-wiki vault (research)                    [~/Projects/stocks-wiki]
        |  /publish-ticker + /ceo-persona (vault-side skills, one-way export)
        v
content/*.json  --pnpm db:seed-->  SUPABASE (Postgres + RLS)
                                       ^                |
                 writes: posts,        |                | reads: posts, accounts,
                 engine_candidates,    |                | wiki_pages, kill_list...
                 post_history          |                v
                              EC2 ENGINE PLANE     VERCEL FRONTEND PLANE
                              t3.micro us-east-1   Next.js App Router (Hobby)
                              systemd timer        ISR ~5 min, auto-deploy
                              every ~15 min:       on push to main
                              pnpm engine:tick
```

- **Engine plane (EC2)**: generates + publishes tweets. Runs `scripts/engine-tick.ts` as a oneshot systemd service on a ~15 min timer. Vercel Hobby cannot run this (no frequent crons, 300s function cap), which is why the box exists.
- **Data plane (Supabase)**: all content and engine state. Public-read RLS on feed tables; engine writes go through the service-role key (server-only).
- **Frontend plane (Vercel)**: reads via `unstable_cache` (5 min revalidate, tag `posts`), renders the feed. Auto-deploys on every push to `main`.

## Repo layout (annotated)

```
src/app/                    Next.js App Router pages (see 05-frontend-ui.md)
  page.tsx                  THE feed (landing page, X-style single column)
  p/[postId]/               post permalink + ReceiptPanel + opengraph-image
  u/[handle]/               account profile
  research/[slug]/          research page (the receipt destination)
  explore/ kill-list/ tripwires/   secondary boards (unlinked from nav)
  feed/page.tsx             redirect('/') stub (old URL compat)
  api/engine/tick/route.ts  legacy cron endpoint (CRON_SECRET-gated; UNUSED in prod - EC2 runs engine:tick directly)
src/components/feed/        PostCard, Terminator, TripwireRow, KillListCard
src/components/ui/          Avatar, TierChip, Header, AccountTile, FreshnessStamp, Icons...
src/lib/
  types.ts                  zod content contract (single source of truth for shapes)
  content.ts                ALL frontend data loading (unstable_cache wrappers + display-time rewrites)
  tiers.ts                  tier labels/glyphs + tierLabel() + cleanQualifier()
  kinds.ts                  kind labels + avatar styles
  links.ts                  permalink/research href helpers
  engine/                   the tweet engine (see 04-engine-pipeline.md)
  supabase/                 read.ts (anon), admin.ts (service role), env.ts, database.types.ts
scripts/                    tsx CLIs: db-migrate/seed/verify-rls, validate-content, engine-* tools
supabase/migrations/        0001-0006 SQL (see 03-data-model.md)
content/                    the vault export: accounts/sources/posts/kill-list/tripwires/research
public/avatars/             86 committed company logo PNGs (1000x1000)
docs/ plan/ references/ context/   local-only knowledge folders (gitignored, OFF GitHub)
```

## Data flow for one tweet (end to end)

1. Vault page section exported by `/publish-ticker` into `content/sources.json` (tier-tagged, scrubbed).
2. `pnpm db:seed` upserts it into Supabase `sources` (user-gated step).
3. The daily scheduler places a slot for (account, source) at a specific time today.
4. A tick generates the post body from that source alone, runs the gates, stores an `engine_candidates` row.
5. When the slot's time arrives and `ENGINE_ENABLED=true`, the publisher writes ONE `posts` row (deterministic id, actual publish timestamp) and stamps the candidate published.
6. The feed loader (`getPosts`) picks it up on the next revalidation; the reader sees it with a live relative time and a `-> Source` receipt.

## Environments and env vars

Three places hold configuration; keep them deliberately in sync:

| Where | File | Holds |
|---|---|---|
| Mac (dev) | `.env.local` | everything, for local dev + scripts |
| EC2 box | `~/kicker-app/.env.local` (chmod 600) | engine vars: `ENGINE_ENABLED=true`, `VERIFIER_ENABLED=false`, `MODEL_*`, `SUPABASE_*` |
| Vercel dashboard | project env vars | frontend vars: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SECRET_KEY`, site URL |

Key engine vars (all engine knobs have safe code defaults; see `04-engine-pipeline.md` for the full table):
`ENGINE_ENABLED`, `VERIFIER_ENABLED`, `GUARD_ENABLED`, `MODEL_BASE_URL`, `MODEL_API_KEY`, `MODEL_PRIMARY`, `MODEL_SECONDARY`, `MODEL_VERIFIER`, `ENGINE_TARGET_MIN/MAX`, `ENGINE_MAX_PER_ACCOUNT`, `ENGINE_CONCURRENCY`, `ENGINE_MAX_BACKLOG_MIN`, `ENGINE_LOOKAHEAD_MIN`, `ENGINE_MAX_PER_TICK`, `MODEL_CALL_TIMEOUT_MS`, `CRON_SECRET`, `SCHEDULE_SEED`.

Model lane override syntax: `MODEL_PRIMARY="nim:<model-id>[:maxOutputTokens[:pacingMs]]"` (parsed in `engine/config.ts laneOverride`).

## Deploy matrix

| Change touches | Deploy action |
|---|---|
| Frontend (`src/app`, `src/components`, `src/lib` display code) | push to `main` -> Vercel auto-deploys |
| Engine (`src/lib/engine`, `scripts/`) | push, then on the box: `cd ~/kicker-app && git pull` (next tick picks it up; no restart; `pnpm install` only if deps changed) |
| DB schema (`supabase/migrations/`) | `pnpm db:migrate` (user-gated) |
| Content (`content/*.json`) | `pnpm validate-content && pnpm engine:audit-sources && pnpm db:seed` (user-gated) |

## Tech stack

Next.js (App Router) + React + Tailwind; zod at every data boundary; Supabase (Postgres + RLS) via `@supabase/supabase-js`; Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible` for the NVIDIA NIM endpoint; groq/google providers still installed but unused); vitest (72 tests) + Playwright (e2e scaffold); tsx for CLI scripts; pnpm.
