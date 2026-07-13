import './_env';
import { runTick } from '@/lib/engine/runner';
import { buildDayPlan } from '@/lib/engine/daily';
import { loadAccounts, loadPosts, loadSources } from '@/lib/engine/data';
import type { LaneKey } from '@/lib/engine/config';

/**
 * Live dry-run: plan a batch, run every (source, model) through the safety gates,
 * and store the outcomes in engine_candidates. Nothing is published. Flags:
 *   --batch=N          cap the number of planned sources
 *   --lanes=primary,…  restrict generation lanes (default: all three)
 *   --no-pace          skip the free-tier rate pacing (small batches only)
 *   --daily            use the randomized day schedule (production shape: one
 *                      lane per post + fallback retry, runId day_<date>)
 *   --plan-only        with --daily: print today's plan distribution and exit
 *                      WITHOUT any model calls (free, instant)
 */
function arg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : undefined;
}

async function planOnly() {
  const [accounts, sources, posts] = await Promise.all([loadAccounts(), loadSources(), loadPosts()]);
  const plan = buildDayPlan({ accounts, sources, posts });

  const counts = new Map<string, number>();
  for (const item of plan.items) counts.set(item.account, (counts.get(item.account) ?? 0) + 1);
  const silent = accounts.length - counts.size;
  const histogram = new Map<number, number>();
  for (const c of counts.values()) histogram.set(c, (histogram.get(c) ?? 0) + 1);

  console.log(`Day plan ${plan.dateKey} (runId ${plan.runId}) - target ${plan.target}, planned ${plan.items.length}\n`);
  console.log(`  accounts silent today: ${silent} of ${accounts.length}`);
  for (const n of [...histogram.keys()].sort((a, b) => a - b)) {
    console.log(`  accounts with ${n} post(s): ${histogram.get(n)}`);
  }

  const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`\n  busiest today: ${busiest.map(([h, n]) => `${h}×${n}`).join('  ')}`);

  const byHour = new Array(24).fill(0);
  for (const item of plan.items) byHour[new Date(item.scheduledAt).getUTCHours()]++;
  console.log(`\n  posts per UTC hour:`);
  console.log(`  ${byHour.map((n, h) => `${String(h).padStart(2, '0')}:${String(n).padStart(3)}`).slice(0, 12).join(' ')}`);
  console.log(`  ${byHour.map((n, h) => `${String(h).padStart(2, '0')}:${String(n).padStart(3)}`).slice(12).join(' ')}`);

  console.log(`\n  first 10 slots:`);
  for (const item of plan.items.slice(0, 10)) {
    console.log(`    ${item.scheduledAt.slice(11, 16)}  ${item.account.padEnd(22)} ${item.trigger.padEnd(12)} ${item.sourceId}`);
  }
  console.log('\nNo model calls made. Generate with: pnpm engine:dry-run --daily [--batch=N]');
}

async function main() {
  const batchSize = arg('batch') ? Number(arg('batch')) : undefined;
  const lanes = arg('lanes')?.split(',') as LaneKey[] | undefined;
  const pace = !process.argv.includes('--no-pace');
  const daily = process.argv.includes('--daily');

  if (daily && process.argv.includes('--plan-only')) return planOnly();

  console.log(`Engine DRY-RUN${daily ? ' (daily schedule)' : ''}. Candidates -> engine_candidates. Nothing is published.`);
  const t0 = Date.now();
  const result = await runTick({ batchSize, laneKeys: lanes, pace, daily });
  const secs = ((Date.now() - t0) / 1000).toFixed(0);

  console.log(`\nrun ${result.runId}  (${secs}s)`);
  console.log(
    `  planned ${result.planned}  ->  verified ${result.verified} · dropped ${result.dropped} · quarantined ${result.quarantined}`,
  );
  console.log(`\nReview blind:  pnpm engine:review ${result.runId}`);
  console.log(`Reveal models: pnpm engine:reveal ${result.runId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
