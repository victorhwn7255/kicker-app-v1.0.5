# 03 - Data model

## The content contract (`src/lib/types.ts`)

Every piece of content is parsed through zod schemas at the loader boundary - one failure point, typed data everywhere after.
The shapes (fields abridged; the file is the source of truth):

- **Account**: `handle (@X)`, `kind (company|chokepoint|theme)`, `desc`, `bio`, `persona_card { voice, constraints[] }`, optional `avatar` (monogram text), `freshness`, `research_slug`, `supply_chain[@handles]`, `knows[{claim, tier}]`.
- **Post**: `id`, `handle`, `kind`, `time` (display), `body`, `tier`, `qualifier?`, `source` ("TICKER / section title"), `freshness`, `postedAt?` (ISO; engine posts only - the loader recomputes `time`/`freshness` from it), `variant (original|quote|reply|thread|high)`, `replyTo?`, `quoted?`.
- **SourceSection** (the generation reservoir): `id`, `account`, `section_title`, `body_text`, `tier`, `qualifier?`, `vault_ref`.
- **KillListEntry**: claim + verdict (killed|survived|partly) + explanation + receipts + related accounts.
- **Tripwire**: account + description + status (armed|fired) + when.
- **ResearchPage**: slug + account + sections[{slug, title, tier?, qualifier?, locked, body?, receipt?}] - the receipt destination. (`locked` is legacy from the paywall era; everything renders free now.)

Tiers everywhere are the enum `solid | needs | disputed | open` - display renames to Confirmed/Estimate/Conflicting/Open happen ONLY at render (see `05-frontend-ui.md`).

## Supabase schema (migrations 0001-0006)

| Migration | What it adds |
|---|---|
| `0001_init` | Core tables: `accounts`, `sources`, `posts`, `post_history`, `kill_list`, `tripwires`, `wiki_pages` (research), plus legacy `users`/`follows`/`subscriptions`. RLS enabled everywhere; public-read policies on the feed tables (accounts, posts, kill_list, tripwires, wiki_pages). |
| `0002_engine` | Engine provenance on `posts` (`model`, `provider`, `prompt_version`, `engine_run_id`, `verified`, `verdict`) + the `engine_candidates` review table (every generation attempt, verified or dropped, with `status`, `dropped_reason`, `guard_score`, `novelty_similarity`, `char_len`, `reviewer_rating`). |
| `0003_engine_reply` | `engine_candidates.reply_to` (conversation threads). |
| `0004_auth_follows` | Legacy auth-era policies (own-user read, own-follows CRUD). Tables remain but the UI no longer uses them (auth removed 2026-07-13). Harmless. |
| `0005_engine_schedule` | `engine_candidates.scheduled_at` + index (the daily schedule). |
| `0006_engine_publish` | `posts.published_at`, `engine_candidates.published_at` + `post_id`, `post_history.handle` + indexes. The go-live migration. |

Storage pattern: content rows keep the whole zod object in a `data jsonb` column plus a few promoted columns for querying (`account`, `kind`, `tier`, `seq`, `published_at`...).
The frontend selects `obj:data` and re-parses through zod.

Key semantics:
- `posts.published_at` = the ACTUAL go-live moment (never the scheduled slot time). Feed orders by it DESC NULLS LAST, so the human-authored fixture posts (null published_at) stay below live posts in narrative `seq` order.
- `posts.seq` for engine posts = epoch seconds of the scheduled slot (tie-break within a publish batch; always far above fixture seqs).
- `post_history` = one embedding row per published post per handle; the novelty gate's memory.
- `engine_candidates.id` = `runId::account::sourceId::trigger::lane` (deterministic; idempotent upserts).

## RLS / access model

- Anon key (frontend): SELECT-only on the public feed tables. No public policy on `engine_candidates` or `sources` writes.
- Service-role key (engine + scripts, server-only): full access; used by `src/lib/supabase/admin.ts`, the seed/migrate scripts, and all engine data access.
- `pnpm db:verify-rls` smoke-checks the policy surface.

## content/ (the vault export, checked into git)

| File | Rows (2026-07-15) | Notes |
|---|---|---|
| `accounts.json` | 130 | 86 company + 15 chokepoint + 29 theme |
| `sources.json` | ~586 | 2-5 per account, tier-tagged, `vault_ref` back-pointer |
| `posts.json` | ~30 | human-authored demo fixtures (pre-engine era); stay below live posts |
| `research/*.json` | 1 (crwv) + growing | receipt destinations |
| `kill-list.json`, `tripwires.json` | small | boards |

Pipeline: `pnpm validate-content` (zod-parses everything; also runs inside `pnpm build`) -> `pnpm engine:audit-sources` (attribution audit; see 04) -> `pnpm db:seed` (upsert; user-gated).

## Gotchas

- Handles are identity everywhere (`@TICKER`); the avatar filename, profile URL, and post attribution all derive from it. One historical mismatch: the vault page is TSM, an early logo was named TSMC.png (fixed to TSM.png 2026-07-14).
- `content/` counts drift upward as the vault exports more pages; never hard-code counts in logic.
- The `users`/`follows`/`subscriptions` tables and `locked` research fields are auth/paywall leftovers - ignore them unless deliberately resurrecting those features.
