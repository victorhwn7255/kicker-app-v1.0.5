import './_env';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { blindSortKey } from '../src/lib/engine/blind';

/**
 * Blind candidate review. Prints every candidate for a run grouped by source,
 * with the model HIDDEN behind A/B/C labels, so the reviewer can rate voice and
 * grounding without knowing which model wrote which. `pnpm engine:reveal <runId>`
 * shows the mapping afterwards.
 */
const LABELS = 'ABCDEFGH';

type Row = {
  id: string;
  account: string;
  source_id: string | null;
  trigger: string | null;
  body: string;
  tier: string;
  qualifier: string | null;
  char_len: number;
  guard_score: number | null;
  verdict_pass: boolean;
  novelty_similarity: number | null;
  status: string;
  dropped_reason: string | null;
};

async function main() {
  const runId = process.argv[2];
  const admin = supabaseAdmin();
  let query = admin.from('engine_candidates').select('*');
  if (runId) query = query.eq('engine_run_id', runId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as Row[]).slice();
  if (!rows.length) {
    console.log('No candidates found. Generate some with: pnpm engine:dry-run');
    return;
  }

  // If no runId given, review the most recent run only.
  const runs = [...new Set((data as { engine_run_id: string }[]).map((r) => r.engine_run_id))];
  console.log(`Blind review${runId ? ` for ${runId}` : ` (latest of ${runs.length} run(s))`}\n`);

  // Group by (account, source), then order blind within each group.
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.account}::${r.source_id ?? '-'}::${r.trigger ?? '-'}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  for (const [key, group] of [...groups.entries()].sort()) {
    group.sort((a, b) => blindSortKey(a.id).localeCompare(blindSortKey(b.id)));
    const [account, , trigger] = key.split('::');
    console.log('='.repeat(78));
    console.log(`${account}  ·  trigger: ${trigger}`);
    console.log('='.repeat(78));
    group.forEach((r, i) => {
      const label = LABELS[i] ?? String(i);
      const gate =
        r.status === 'verified'
          ? 'VERIFIED'
          : r.status === 'quarantined'
            ? 'QUARANTINED (source flagged)'
            : `DROPPED (${(r.dropped_reason ?? 'unknown').split('\n')[0].slice(0, 88)})`;
      console.log(`\n  [${label}]  ${gate}`);
      console.log(`       tier: ${r.tier}${r.qualifier ? ` (${r.qualifier})` : ''}  ·  ${r.char_len} chars` +
        `  ·  guard ${fmt(r.guard_score)}  ·  novelty ${fmt(r.novelty_similarity)}`);
      if (r.body) console.log(indent(r.body));
    });
    console.log('');
  }

  console.log('Rate A/B/C per source, then reveal which model is which:');
  console.log(`  pnpm engine:reveal ${runId ?? runs[runs.length - 1]}`);
}

function fmt(n: number | null): string {
  return n === null ? '-' : n.toFixed(4);
}
function indent(text: string): string {
  return text
    .split('\n')
    .map((l) => '       | ' + l)
    .join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
