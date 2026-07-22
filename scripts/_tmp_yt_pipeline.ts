import './_env';
process.env.VERIFIER_ENABLED = 'true'; // exercise the full chain incl. the model verifier

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { AccountSchema, SourceSectionSchema } from '../src/lib/types';
import { runCandidate } from '../src/lib/engine/pipeline';
import { liveDeps } from '../src/lib/engine/deps';
import { lane } from '../src/lib/engine/config';
import { selectKeyFact } from '../src/lib/engine/planner';
import { checkCompliance } from '../src/lib/engine/compliance';
import type { GuardResult, PlanItem } from '../src/lib/engine/types';

const repo = path.resolve(__dirname, '..');
const accounts = z
  .array(AccountSchema)
  .parse(JSON.parse(fs.readFileSync(path.join(repo, 'content/accounts.json'), 'utf8')));
const sources = z
  .array(SourceSectionSchema)
  .parse(JSON.parse(fs.readFileSync(path.join(repo, 'content/sources.json'), 'utf8')));

const account = accounts.find((a) => a.handle === '@youtube-buzz')!;
const ytSources = sources.filter((s) => s.account === '@youtube-buzz').slice(0, 3);
const deps = liveDeps();
const genLane = lane('secondary');
const guard: GuardResult = { flagged: false, maxScore: 0, chunkScores: [] };

async function main() {
  console.log(`Generating with lane ${genLane.provider}:${genLane.modelId}, verifier ON\n`);
  for (const source of ytSources) {
    const plan: PlanItem = {
      account: account.handle,
      sourceId: source.id,
      trigger: 'ingest',
      keyFact: selectKeyFact(source),
      scheduledAt: '2026-07-22T12:00:00.000Z',
    };
    const c = await runCandidate({
      runId: 'tmp',
      account,
      source,
      plan,
      genLane,
      recentPosts: [],
      historyEmbeddings: [],
      guard,
      deps,
    });
    const comp = checkCompliance(c.body);
    console.log('='.repeat(90));
    console.log(`SOURCE ${source.id}  (${source.section_title})`);
    console.log(`STATUS: ${c.status}  | len ${c.charLen}  | attempts ${c.attempts}` + (c.droppedReason ? ` | dropped: ${c.droppedReason}` : ''));
    console.log(`independent checkCompliance: ${comp.ok ? 'OK' : 'BLOCK (' + comp.label + ')'}`);
    if (c.verdict) {
      console.log(`verdict: traceable=${c.verdict.claims_traceable} hedges=${c.verdict.hedges_preserved} invented#=${c.verdict.invented_numbers} advice=${c.verdict.buy_sell_language} personaOk=${c.verdict.persona_identity_ok}`);
      if (c.verdict.offending_claims.length) console.log(`  offending: ${c.verdict.offending_claims.join(' | ')}`);
    }
    console.log(`\nGENERATED TWEET:\n${c.body}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
