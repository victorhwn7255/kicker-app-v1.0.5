import './_env';
import { publishDue } from '@/lib/engine/publisher';
import { engineEnabled } from '@/lib/engine/config';

/**
 * Manual publisher. SAFE BY DEFAULT: with no flags it PREVIEWS - it computes every
 * verified slot whose time has arrived and prints what would go live, writing
 * nothing. `--live` actually publishes, and even then publishDue refuses unless
 * ENGINE_ENABLED=true. `--now=<ISO>` overrides the clock for testing a slice.
 *
 *   pnpm engine:publish            # preview: what is due right now
 *   pnpm engine:publish --live     # publish for real (requires ENGINE_ENABLED=true)
 *   pnpm engine:publish --now=2026-07-13T17:00:00Z
 */
function arg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : undefined;
}

async function main() {
  const live = process.argv.includes('--live');
  const nowArg = arg('now');
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  const preview = !live;

  if (live && !engineEnabled()) {
    console.error('Refusing --live: ENGINE_ENABLED is not true. Nothing published.');
    process.exit(1);
  }

  console.log(
    `${preview ? 'PREVIEW' : 'LIVE PUBLISH'} at ${new Date(nowMs).toISOString()}` +
      `  (ENGINE_ENABLED=${engineEnabled()})`,
  );
  const res = await publishDue({ nowMs, preview });

  console.log(`\n  slots due: ${res.slotsConsidered}  ->  ${preview ? 'would publish' : 'published'} ${res.published}`);
  for (const p of res.posts.slice(0, 20)) {
    console.log(`    ${p.scheduledAt?.slice(11, 16) ?? '--:--'}  ${p.handle.padEnd(22)} ${p.id}`);
  }
  if (res.posts.length > 20) console.log(`    ... and ${res.posts.length - 20} more`);
  if (preview) console.log('\nNothing was written. Re-run with --live (and ENGINE_ENABLED=true) to publish.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
