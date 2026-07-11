import { NextResponse, type NextRequest } from 'next/server';
import { runTick } from '@/lib/engine/runner';
import type { LaneKey } from '@/lib/engine/config';

/**
 * The engine cron endpoint. Protected by CRON_SECRET (Vercel Cron sends it as a
 * Bearer token; a ?secret= query allows manual local triggering). It ALWAYS runs
 * in dry-run in Phase 5 - it writes candidates to the review table and never
 * publishes. The response reports counts only, keeping the model hidden so the
 * blind review stays blind.
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

  // Cron defaults: a small batch that rotates daily (so the whole reservoir is
  // covered across the week) and no pacing, to stay inside the function timeout.
  // Explicit ?batchSize disables rotation (a targeted manual run).
  const dayCounter = Math.floor(Date.now() / 86_400_000);

  try {
    const result = await runTick({
      batchSize: batchSize ? Number(batchSize) : 2,
      rotateBy: batchSize ? undefined : dayCounter,
      laneKeys: lanes ? (lanes.split(',') as LaneKey[]) : undefined,
      pace: pace ? pace !== 'false' : false,
    });
    return NextResponse.json({
      runId: result.runId,
      dryRun: result.dryRun,
      planned: result.planned,
      verified: result.verified,
      dropped: result.dropped,
      quarantined: result.quarantined,
      note: 'Dry-run only. Review candidates with `pnpm engine:review <runId>`.',
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
