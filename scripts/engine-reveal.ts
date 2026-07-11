import './_env';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { blindSortKey } from '../src/lib/engine/blind';

/**
 * Reveal the A/B/C -> model mapping for a run, in the SAME blind order the review
 * script used. Run this only after you have rated the candidates.
 */
const LABELS = 'ABCDEFGH';

type Row = {
  id: string;
  account: string;
  source_id: string | null;
  trigger: string | null;
  model: string;
  provider: string;
  status: string;
  char_len: number;
};

async function main() {
  const runId = process.argv[2];
  const admin = supabaseAdmin();
  let query = admin.from('engine_candidates').select('id,account,source_id,trigger,model,provider,status,char_len');
  if (runId) query = query.eq('engine_run_id', runId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (!rows.length) {
    console.log('No candidates found.');
    return;
  }

  console.log(`Reveal${runId ? ` for ${runId}` : ''}\n`);

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.account}::${r.source_id ?? '-'}::${r.trigger ?? '-'}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  // Aggregate a verified-rate scoreboard per model.
  const tally = new Map<string, { verified: number; total: number }>();

  for (const [key, group] of [...groups.entries()].sort()) {
    group.sort((a, b) => blindSortKey(a.id).localeCompare(blindSortKey(b.id)));
    const [account] = key.split('::');
    console.log(`${account}`);
    group.forEach((r, i) => {
      const label = LABELS[i] ?? String(i);
      console.log(`  [${label}] = ${r.provider}/${r.model}  (${r.status})`);
      const t = tally.get(r.model) ?? { verified: 0, total: 0 };
      t.total++;
      if (r.status === 'verified') t.verified++;
      tally.set(r.model, t);
    });
    console.log('');
  }

  console.log('Model scoreboard (verified / total):');
  for (const [model, t] of [...tally.entries()].sort((a, b) => b[1].verified - a[1].verified)) {
    console.log(`  ${model}: ${t.verified}/${t.total}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
