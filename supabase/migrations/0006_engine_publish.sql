-- Launch phase - the publisher + the daily self-tweeting loop.
--
-- Three things the live loop needs on top of the dry-run schema:
--  1. posts.published_at - the real timestamp a post went live, so the public
--     feed can order reverse-chron (newest first) and derive a live relative
--     stamp. Null for the human fixtures (they predate the engine); the loader
--     sorts them below the live feed.
--  2. engine_candidates.published_at + post_id - the idempotency ledger. A
--     verified candidate is published exactly once; once published_at is set it
--     is never re-published, and post_id links the candidate to the row it became
--     (so a re-run upserts the same post instead of duplicating it).
--  3. post_history.handle - the novelty memory. Every published body is embedded
--     and stored here keyed by account, so the next generation can reject a take
--     too similar to what the account already said. (post_id already existed; the
--     handle column + an embedding index make "recent posts for @X" a cheap read.)

-- ---- 1. published_at on the public feed ----
alter table public.posts add column if not exists published_at timestamptz;
create index if not exists posts_published_at_idx
  on public.posts (published_at desc)
  where published_at is not null;

-- ---- 2. the publish ledger on candidates ----
alter table public.engine_candidates add column if not exists published_at timestamptz;
alter table public.engine_candidates add column if not exists post_id text;
-- The publisher's hot query: verified + due + not-yet-published, by schedule.
create index if not exists engine_candidates_publish_idx
  on public.engine_candidates (status, scheduled_at)
  where published_at is null;

-- ---- 3. novelty memory keyed by account ----
alter table public.post_history add column if not exists handle text;
create index if not exists post_history_handle_idx
  on public.post_history (handle, created_at desc);
