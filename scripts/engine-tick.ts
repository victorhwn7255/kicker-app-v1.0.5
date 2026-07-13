import './_env';
import { runTick } from '@/lib/engine/runner';
import { publishDue } from '@/lib/engine/publisher';
import { engineEnabled } from '@/lib/engine/config';

/**
 * One production tick, for a self-managed scheduler (the AWS EC2 systemd timer /
 * cron). It is the exact same two steps the Vercel cron route runs, so the server
 * path and the serverless path behave identically:
 *   1. generate the slice of today's schedule coming due soon (idempotent, bounded)
 *   2. if ENGINE_ENABLED, publish every verified slot whose time has arrived
 *
 * Safe to run every N minutes: generation skips slots already attempted, and the
 * publisher is idempotent (deterministic post ids + published_at guard), so
 * overlapping or repeated runs never double-post. When ENGINE_ENABLED is not true
 * it generates + schedules but publishes nothing (previews the count instead).
 *
 *   pnpm engine:tick            # a normal production tick
 *   pnpm engine:tick --batch=2  # cap generation to N slots (manual/testing)
 */
function arg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : undefined;
}

async function main() {
  const batchSize = arg('batch') ? Number(arg('batch')) : undefined;
  const t0 = Date.now();
  const stamp = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

  console.log(`[tick] start ${new Date().toISOString()} (ENGINE_ENABLED=${engineEnabled()})`);

  const gen = await runTick({ daily: true, batchSize, pace: false });
  console.log(
    `[tick] generated @${stamp()}: planned ${gen.planned} -> verified ${gen.verified} · dropped ${gen.dropped} · quarantined ${gen.quarantined}`,
  );

  if (engineEnabled()) {
    const pub = await publishDue();
    console.log(`[tick] published @${stamp()}: ${pub.published} of ${pub.slotsConsidered} due slot(s)`);
  } else {
    const preview = await publishDue({ preview: true });
    console.log(`[tick] publish SKIPPED @${stamp()} (ENGINE_ENABLED not true) — ${preview.published} would publish`);
  }

  console.log(`[tick] done in ${stamp()}`);
}

main().catch((e) => {
  console.error(`[tick] FAILED: ${(e as Error).message}`);
  process.exit(1);
});
