-- Ticker - Phase 4 schema. Source of truth for the database; applied by
-- `pnpm db:migrate`, never clicked into the dashboard.
--
-- Shape: every content table carries typed, queryable columns (the documented
-- data model + what the engine and RLS need) PLUS a `data` jsonb column holding
-- the full validated content object. Loaders read `data` and zod-parse it, so
-- the app renders byte-identically to the fixture era while the columns give us
-- indexes, foreign keys, and RLS predicates. `seq` preserves fixture order.
--
-- RLS is on for every table from row one: published content is world-readable,
-- nothing is world-writable (only the secret key, which bypasses RLS, writes),
-- and the reservoir + user tables are fully private until later phases open them.

-- ---------------------------------------------------------------------------
-- Content tables (rendered by the public app)
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  handle        text primary key,
  kind          text not null check (kind in ('company', 'chokepoint', 'theme')),
  display_name  text,
  domain        text,
  research_slug text,
  freshness     text,
  seq           integer not null default 0,
  data          jsonb not null,
  created_at    timestamptz not null default now()
);

-- The generation reservoir the engine may reword (Phase 5). Private: raw source
-- text is internal, never rendered directly to the public.
create table if not exists public.sources (
  id            text primary key,
  account       text not null references public.accounts(handle) on delete cascade,
  section_title text not null,
  body_text     text not null,
  tier          text not null check (tier in ('solid', 'needs', 'disputed', 'open')),
  qualifier     text,
  vault_ref     text not null,
  seq           integer not null default 0,
  published_at  timestamptz not null default now(),
  data          jsonb not null
);

create table if not exists public.posts (
  id         text primary key,
  account    text not null references public.accounts(handle) on delete cascade,
  kind       text not null check (kind in ('company', 'chokepoint', 'theme')),
  variant    text check (variant in ('original', 'quote', 'reply', 'thread', 'high')),
  tier       text not null check (tier in ('solid', 'needs', 'disputed', 'open')),
  source_id  text references public.sources(id) on delete set null,
  trigger    text check (trigger in ('ingest', 'event', 'conversation', 'rotation')),
  seq        integer not null default 0,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists posts_account_idx on public.posts (account);
create index if not exists posts_seq_idx on public.posts (seq);

-- Novelty gate for the engine (Phase 5). Embedding type is deliberately deferred
-- to jsonb until the model (and its dimensions) is chosen.
create table if not exists public.post_history (
  id         bigint generated always as identity primary key,
  post_id    text not null references public.posts(id) on delete cascade,
  embedding  jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.kill_list (
  id         text primary key,
  verdict    text not null check (verdict in ('killed', 'survived', 'partly')),
  seq        integer not null default 0,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tripwires (
  id          text primary key,
  account     text not null references public.accounts(handle) on delete cascade,
  status      text not null check (status in ('armed', 'fired')),
  post_id     text,
  seq         integer not null default 0,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- Research pages. is_paid is carried now for the Phase 7 paywall; Phase 4 leaves
-- the whole page world-readable (per-section lock flags live inside `data` and
-- are honored by the UI, exactly as in the fixture era).
create table if not exists public.wiki_pages (
  slug          text primary key,
  account       text not null references public.accounts(handle) on delete cascade,
  title         text not null,
  is_paid       boolean not null default true,
  freshness     text,
  section_count integer,
  seq           integer not null default 0,
  data          jsonb not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Identity, follows, billing (created now for a stable schema; used Phases 6-7)
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.users(id) on delete cascade,
  account_handle text not null references public.accounts(handle) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, account_handle)
);

-- Written ONLY by the Stripe webhook (Phase 7), which uses the secret key.
create table if not exists public.subscriptions (
  user_id            uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id text,
  tier               text check (tier in ('reader', 'pro')),
  status             text,
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.accounts      enable row level security;
alter table public.sources       enable row level security;
alter table public.posts         enable row level security;
alter table public.post_history  enable row level security;
alter table public.kill_list     enable row level security;
alter table public.tripwires     enable row level security;
alter table public.wiki_pages    enable row level security;
alter table public.users         enable row level security;
alter table public.follows       enable row level security;
alter table public.subscriptions enable row level security;

-- Public read on published content. No insert/update/delete policies exist, so
-- anon and authenticated cannot write; the secret key bypasses RLS and is the
-- only writer (seed script now, engine + webhook later).
drop policy if exists "public read accounts"   on public.accounts;
drop policy if exists "public read posts"       on public.posts;
drop policy if exists "public read kill_list"   on public.kill_list;
drop policy if exists "public read tripwires"   on public.tripwires;
drop policy if exists "public read wiki_pages"  on public.wiki_pages;
create policy "public read accounts"  on public.accounts   for select using (true);
create policy "public read posts"      on public.posts      for select using (true);
create policy "public read kill_list"  on public.kill_list  for select using (true);
create policy "public read tripwires"  on public.tripwires  for select using (true);
create policy "public read wiki_pages" on public.wiki_pages for select using (true);

-- sources, post_history, users, follows, subscriptions: RLS on with no policy =
-- fully private to anon/authenticated. Later phases add scoped policies.

-- Explicit grants so read/write access does not depend on project default
-- privileges. RLS still filters every row on top of these grants.
grant select on public.accounts, public.posts, public.kill_list, public.tripwires, public.wiki_pages
  to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
