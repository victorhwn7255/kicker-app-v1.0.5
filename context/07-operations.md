# 07 - Operations (GitHub Actions engine, deploys, diagnostics, costs)

This file is the operational summary an agent needs to act safely.
Historical: the engine ran on an AWS EC2 box 2026-07-13 -> 2026-07-20 (terminated;
see "The EC2 era" at the bottom). `docs/deploy-aws-ec2.md` is the recipe to rebuild
one if ever needed.

## The engine (GitHub Actions - since 2026-07-20)

| Fact | Value |
|---|---|
| Public URL | `https://ticker.thevixguy.com` (Cloudflare DNS-only CNAME -> Vercel; `kicker-app-v1-0-5.vercel.app` = alias) |
| GitHub repo | `victorhwn7255/ticker-app-v1.0.8` (PUBLIC - that's what makes Actions free; renamed 2026-07-16 from `kicker-app-v1.0.5`) |
| Workflow | `.github/workflows/engine-tick.yml` - checkout + pnpm install + `pnpm engine:tick` on a throwaway runner |
| Schedule | **Primary heartbeat = an external pinger (cron-job.org) POSTing the `workflow_dispatch` API every 15 min** (adopted 2026-07-22; dispatched runs bypass GitHub's schedule throttle and start in seconds). The native `schedule` cron is now `8 * * * *` - a once-hourly BACKUP only (so the feed degrades to hourly, not zero, if the pinger dies). The pinger uses a fine-grained PAT (`ticker-engine-pinger`, Actions:Read+write on this repo only, no expiry) stored ONLY in cron-job.org; its "notify on failure" email is the pinger's own dead-man alert. GitHub had throttled the pure-schedule setup to ~hourly with ~6h overnight gaps (the "no plan B" era, 2026-07-20 to 07-22). |
| Gate | repo VARIABLE `ENGINE_CRON_ENABLED='true'` gates scheduled runs; manual dispatch always works |
| Secrets (4) | `MODEL_API_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (GitHub Settings -> Secrets; names must match exactly) |
| Non-secret env | Baked into the workflow: NVIDIA lanes, `MODEL_CALL_TIMEOUT_MS=180000` (free-tier latency), `ENGINE_MAX_BACKLOG_MIN=360` (6h - late slots publish late instead of dropping across dispatch gaps) |
| Volume expectation | ~30-60 published/day (accepted range). With the pinger live (2026-07-22) posts spread on the even 15-min drip again rather than the hourly bursts of the throttle era. |

## Standard operations

- **Deploy = `git push`.** Every Actions run checks out fresh main; Vercel auto-builds the site. There is no second deploy step anymore.
- **Watch it work**: repo -> Actions tab -> `engine-tick` runs (full logs kept per run; look for the `[tick]` lines). README badge shows latest-run status.
- **Force a tick now**: Actions tab -> engine-tick -> Run workflow (or `gh workflow run engine-tick`) - user-gated like any production write.
- **Pause tweeting**: set repo variable `ENGINE_CRON_ENABLED=false` (scheduled runs no-op; manual still works). Resume: set back to `true`.
- **Health check from the Mac**: `pnpm pipeline:health` (deterministic; `--sample` feeds /inspect-tweet-pipeline).
- A healthy tick log: `[tick] generated @Ns: planned P -> verified V - dropped D` -> `[tick] published @Ns: X of X due slot(s)` -> `[tick] done in Ns`.
- **Failure alerting**: GitHub emails the workflow author on failed runs (Settings -> Notifications -> Actions, "failed only"). Covers run-failures, NOT "green runs but nothing publishing" - a feed-freshness alarm is still the Phase A gap.
- **60-day rule**: GitHub pauses schedules on repos with no activity for ~60 days (emails first; one click resumes). Normal push cadence makes this theoretical.

## The permission model for agents (learned in practice)

- **Read-only diagnostics** (run lists/logs, DB SELECTs, pipeline:health) are fine once the user asks for a check.
- **Any write** - dispatching a run, editing secrets/variables, DB migrate/seed, flipping `ENGINE_CRON_ENABLED` - needs the user's explicit go-ahead in that conversation. The auto-mode classifier WILL block unauthorized production writes; do not try to route around it.

## Frontend / Vercel

- Push to `main` -> Vercel auto-deploys (GitHub App integration). `vercel.json` was deleted (the old `/api/engine/tick` cron is legacy; the route still exists, CRON_SECRET-gated, unused in prod).
- Vercel env vars live in the dashboard (`NEXT_PUBLIC_SITE_URL=https://ticker.thevixguy.com`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, ...). Env edits need a redeploy to take effect.

## Database (Supabase)

- Migrations: `pnpm db:migrate` (uses `SUPABASE_DB_URL`; additive, idempotent). Seeding: `pnpm db:seed`. Both user-gated.
- Quick state checks are done with throwaway tsx scripts using `supabaseAdmin()` (pattern: write `scripts/_tmp.ts`, run, DELETE it - never leave temp scripts in the tree).

## Health signals (what "working" looks like)

1. Newest `posts.published_at` within ~1-2h (hourly clusters are NORMAL under the throttled cron; many hours = check the Actions run history first).
2. `engine_candidates` ship rate ~30-40%; drop mix dominated by novelty (fine) not generation errors (infra problem). pipeline_health flags published <30/day and ship rate <30%.
3. Actions tick duration: seconds (no-op) to ~10 min (busy backlog).

## Costs (as of 2026-07-20 - the $0 end-state)

- **Ticker infra = $0/month**: GitHub Actions (public repo, free) + Supabase (free) + Vercel Hobby (free) + NVIDIA API (free) + Cloudflare DNS (free). Only real cost: the domain (~$10/yr).
- The AWS account's remaining bill is **Lightsail only** (the user's OTHER project, option-harvest) + tax - under the $6/mo line. A $6 AWS Budget with email alerts is the standing guard.
- Dependencies that keep it $0: repo stays PUBLIC (private -> Actions minutes are metered); NVIDIA free tier persists (paywall -> model-cost conversation).
- "Plan B" (the external pinger) is LIVE as of 2026-07-22 - see the Schedule row above. It is what restores the even 15-min cadence; $0 (cron-job.org free tier). If it ever breaks, cron-job.org emails you AND the native hourly backup cron keeps the feed alive.

## The EC2 era (historical, 2026-07-13 -> 2026-07-20)

- t3.micro `us-east-1`, systemd timer every ~15 min, SSM Session Manager access (`ssh ticker`, since removed from `~/.ssh/config`). Terminated 2026-07-20 after a 2-day parallel trial with Actions (shared idempotent slot ledger made double-posting impossible).
- Bill was ~$12/mo (the account is NOT on the legacy free tier - AWS retired it for accounts created after mid-2025).
- AWS leftovers (free, harmless, deletable anytime): the security group, `ticker-ssm-role`, the `ticker-key` key pair.
- Rebuild recipe if ever needed: `docs/deploy-aws-ec2.md` (~45 min).
