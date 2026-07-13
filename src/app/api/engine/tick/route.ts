import { NextResponse, type NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { runTick } from '@/lib/engine/runner';
import { publishDue } from '@/lib/engine/publisher';
import { engineEnabled, type LaneKey } from '@/lib/engine/config';

/**
 * The engine cron endpoint. Protected by CRON_SECRET (Vercel Cron sends it as a
 * Bearer token; a ?secret= query allows manual local triggering).
 *
 * Two shapes:
 *  - default (A/B): a small rotating dry-run batch into the review table.
 *  - ?mode=daily: the LIVE loop. Each call (a) generates the slice of the day's
 *    schedule coming due soon - idempotent + time-boxed, so many short crons drain
 *    the day without exceeding the timeout - then (b) IF ENGINE_ENABLED, publishes
 *    every verified slot whose time has arrived and refreshes the feed cache. When
 *    ENGINE_ENABLED is false it still generates + schedules but publishes nothing,
 *    so the whole loop is testable in dry-run before go-live.
 */
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('secret') === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const batchSize = url.searchParams.get('batchSize');
  const lanes = url.searchParams.get('lanes');
  const pace = url.searchParams.get('pace');
  // ?mode=daily runs the randomized day schedule (daily.ts): production shape -
  // one lane per post + fallback retry, deterministic day runId (idempotent
  // re-runs). Use ?batchSize to generate the day in slices within the timeout.
  const daily = url.searchParams.get('mode') === 'daily';

  // Cron defaults (A/B mode): a small batch that rotates daily (so the whole
  // reservoir is covered across the week) and no pacing, to stay inside the
  // function timeout. Explicit ?batchSize disables rotation (a targeted run).
  const dayCounter = Math.floor(Date.now() / 86_400_000);

  try {
    const result = await runTick({
      daily,
      batchSize: batchSize ? Number(batchSize) : daily ? undefined : 2,
      rotateBy: daily || batchSize ? undefined : dayCounter,
      laneKeys: lanes ? (lanes.split(',') as LaneKey[]) : undefined,
      pace: pace ? pace !== 'false' : false,
    });

    // The publish half of the live loop: release verified slots whose time has
    // arrived. Hard-gated - only runs when a human has flipped ENGINE_ENABLED.
    let published = 0;
    const live = daily && engineEnabled();
    if (live) {
      const pub = await publishDue();
      published = pub.published;
      if (published > 0) revalidateTag('posts');
    }

    return NextResponse.json({
      runId: result.runId,
      mode: daily ? 'daily' : 'ab',
      live,
      published,
      dryRun: !live,
      planned: result.planned,
      verified: result.verified,
      dropped: result.dropped,
      quarantined: result.quarantined,
      note: live
        ? 'Live: generated the due slice and published verified slots.'
        : 'Dry-run. Candidates in the review table; nothing published (ENGINE_ENABLED not true).',
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
