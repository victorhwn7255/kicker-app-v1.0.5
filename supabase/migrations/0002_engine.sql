-- Phase 5 - the tweet engine. Provenance + the dry-run review table.
--
-- Every generated post permanently records which model wrote it and the verifier
-- verdict that cleared it. Dry-run candidates land in engine_candidates (a private
-- review table) instead of posts; nothing reaches the public feed until a human
-- flips ENGINE_ENABLED and approves. Both tables are RLS-private like the source
-- reservoir - candidates and provenance are internal, never world-readable.

-- ---- provenance on generated posts (nullable: human fixtures predate the engine) ----
alter table public.posts add column if not exists model          text;
alter table public.posts add column if not exists provider       text;
alter table public.posts add column if not exists prompt_version text;
alter table public.posts add column if not exists engine_run_id  text;
alter table public.posts add column if not exists verified       boolean;
alter table public.posts add column if not exists verdict        jsonb;

-- ---- the dry-run candidate review table ----
create table if not exists public.engine_candidates (
  id                 text primary key,
  engine_run_id      text not null,
  account            text not null references public.accounts(handle) on delete cascade,
  source_id          text references public.sources(id) on delete set null,
  trigger            text check (trigger in ('ingest', 'event', 'conversation', 'rotation')),
  body               text not null,
  tier               text not null check (tier in ('solid', 'needs', 'disputed', 'open')),
  qualifier          text,
  char_len           integer not null,
  -- provenance: which model/prompt produced this candidate (hidden during blind review)
  model              text not null,
  provider           text not null,
  prompt_version     text not null,
  -- gate results
  guard_score        double precision,
  verdict            jsonb,
  verdict_pass       boolean not null default false,
  novelty_similarity double precision,
  status             text not null check (status in ('verified', 'quarantined', 'dropped')),
  dropped_reason     text,
  -- blind review: the human's rating, filled in AFTER rating; model revealed after
  reviewer_rating    integer check (reviewer_rating between 1 and 5),
  reviewer_note      text,
  created_at         timestamptz not null default now()
);
create index if not exists engine_candidates_run_idx on public.engine_candidates (engine_run_id);
create index if not exists engine_candidates_account_idx on public.engine_candidates (account);

-- RLS: private review material - only the secret key touches it.
alter table public.engine_candidates enable row level security;
grant all on public.engine_candidates to service_role;
grant usage, select on all sequences in schema public to service_role;
