import './_env';
import { readAccounts, readSources } from '../src/lib/fixtures';
import { auditSourceAttribution } from '../src/lib/engine/attribution';

/**
 * Attribution audit over the source reservoir. Run this on every source import:
 * it catches the one error class the verifier structurally cannot - a source
 * holding another entity's facts, which becomes false when spoken in the
 * account's first person. Exits non-zero if any source is misattributed.
 */
async function main() {
  const accounts = readAccounts();
  const sources = readSources();
  const byHandle = new Map(accounts.map((a) => [a.handle, a]));

  console.log(`Auditing ${sources.length} sources for attribution...\n`);
  let flagged = 0;
  for (const s of sources) {
    const account = byHandle.get(s.account);
    if (!account) {
      console.log(`SKIP  ${s.id}: unknown account ${s.account}`);
      continue;
    }
    const verdict = await auditSourceAttribution(account, s);
    console.log(`${verdict.belongs ? 'OK  ' : 'FLAG'}  ${s.account.padEnd(22)} ${s.id}`);
    if (!verdict.belongs) {
      flagged++;
      console.log(`      misattributed: ${verdict.misattributed_facts.join('; ')}`);
      console.log(`      ${verdict.reasoning}`);
    }
  }

  console.log(`\n${flagged} source(s) flagged.`);
  if (flagged) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
