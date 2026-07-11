import './_env';
import { runTick } from '@/lib/engine/runner';
import type { LaneKey } from '@/lib/engine/config';

/**
 * Live dry-run: plan a batch, run every (source, model) through the safety gates,
 * and store the outcomes in engine_candidates. Nothing is published. Flags:
 *   --batch=N          cap the number of planned sources
 *   --lanes=primary,…  restrict generation lanes (default: all three)
 *   --no-pace          skip the free-tier rate pacing (small batches only)
 */
function arg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : undefined;
}

async function main() {
  const batchSize = arg('batch') ? Number(arg('batch')) : undefined;
  const lanes = arg('lanes')?.split(',') as LaneKey[] | undefined;
  const pace = !process.argv.includes('--no-pace');

  console.log('Engine DRY-RUN. Candidates -> engine_candidates. Nothing is published.');
  const t0 = Date.now();
  const result = await runTick({ batchSize, laneKeys: lanes, pace });
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
