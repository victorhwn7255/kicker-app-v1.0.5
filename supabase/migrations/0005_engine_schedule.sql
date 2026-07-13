-- Daily scheduler (engine daily mode): every candidate can carry the slot it is
-- meant to fill, so the launch-phase publisher can release posts at realistic,
-- randomized times instead of dumping the whole batch at once. Nullable -
-- ad-hoc/test runs and all historical rows simply have no schedule.
alter table public.engine_candidates
  add column if not exists scheduled_at timestamptz;

create index if not exists engine_candidates_scheduled_idx
  on public.engine_candidates (scheduled_at)
  where scheduled_at is not null;
