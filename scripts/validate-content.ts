/**
 * Content validator - fails the build on any bad fixture.
 * Reads every /content bridge file (so every file is zod-parsed) and then checks
 * referential integrity across the fixtures. Wired into `pnpm build` via the
 * `validate-content` script, and it is the gate the seed passes content through
 * before importing it into the database. A validator that silently passes bad
 * content is worse than none.
 */
import {
  readAccounts,
  readPosts,
  readKillList,
  readTripwires,
  readSources,
  readResearchPages,
} from '../src/lib/fixtures';

function main(): void {
  const errors: string[] = [];

  let accounts, posts, killList, tripwires, sources, research;
  try {
    accounts = readAccounts();
    posts = readPosts();
    killList = readKillList();
    tripwires = readTripwires();
    sources = readSources();
    research = readResearchPages();
  } catch (err) {
    console.error('✗ schema validation failed:\n' + (err as Error).message);
    process.exit(1);
  }

  const handles = new Set(accounts.map((a) => a.handle));
  const postIds = new Set(posts.map((p) => p.id).filter(Boolean));
  const slugs = new Set(research.map((r) => r.slug));

  // Primary keys must be unique - a duplicate would silently shadow the first
  // match in getAccount()/getResearchPage() and make FKs ambiguous.
  function checkUnique<T>(items: T[], key: (t: T) => string | undefined, label: string): void {
    const seen = new Set<string>();
    for (const item of items) {
      const k = key(item);
      if (k === undefined) continue;
      if (seen.has(k)) errors.push(`duplicate ${label} "${k}"`);
      seen.add(k);
    }
  }
  checkUnique(accounts, (a) => a.handle, 'account handle');
  checkUnique(posts, (p) => p.id, 'post id');
  checkUnique(research, (r) => r.slug, 'research slug');
  checkUnique(killList, (k) => k.id, 'kill-list id');
  checkUnique(tripwires, (t) => t.id, 'tripwire id');
  checkUnique(sources, (s) => s.id, 'source id');

  const unknownAccount = (ctx: string, handle: string) => {
    if (!handles.has(handle)) errors.push(`${ctx} references unknown account ${handle}`);
  };

  for (const p of posts) {
    unknownAccount(`post ${p.id}`, p.handle);
    if (p.replyTo) unknownAccount(`post ${p.id} replyTo`, p.replyTo);
    if (p.quoted) unknownAccount(`post ${p.id} quoted`, p.quoted.handle);
  }
  for (const k of killList) for (const h of k.related_accounts) unknownAccount(`kill-list ${k.id}`, h);
  for (const t of tripwires) {
    unknownAccount(`tripwire ${t.id}`, t.account);
    if (t.post_id && !postIds.has(t.post_id)) errors.push(`tripwire ${t.id} references unknown post ${t.post_id}`);
  }
  for (const s of sources) unknownAccount(`source ${s.id}`, s.account);
  for (const r of research) unknownAccount(`research ${r.slug}`, r.account);
  const sourceCounts = new Map<string, number>();
  for (const s of sources) sourceCounts.set(s.account, (sourceCounts.get(s.account) ?? 0) + 1);

  const warnings: string[] = [];
  for (const a of accounts) {
    for (const h of a.supply_chain ?? []) unknownAccount(`account ${a.handle} supply_chain`, h);
    if (a.research_slug && !slugs.has(a.research_slug))
      errors.push(`account ${a.handle} research_slug references unknown page ${a.research_slug}`);
    // A "more"-cadence account burns fresh sources ~2x faster; with a thin page it
    // slides into recycled takes the novelty gate then drops. Warn, don't fail.
    // Threshold 5 = the fleet's depth range is 3-6, so this flags only the
    // genuinely thin (3-4 source) pages, not the standard-depth cohort.
    if (a.cadence === 'more' && (sourceCounts.get(a.handle) ?? 0) < 5)
      warnings.push(
        `account ${a.handle} has cadence "more" but only ${sourceCounts.get(a.handle) ?? 0} sources - expect recycling/novelty drops (consider "normal" or a deeper vault export)`,
      );
  }

  const fired = tripwires.filter((t) => t.status === 'fired').length;
  console.log(
    'content loaded:\n' +
      `  accounts: ${accounts.length}\n` +
      `  posts: ${posts.length}\n` +
      `  kill-list: ${killList.length}\n` +
      `  tripwires: ${tripwires.length} (${fired} fired · ${tripwires.length - fired} armed)\n` +
      `  sources: ${sources.length}\n` +
      `  research pages: ${research.length}`,
  );

  if (warnings.length) {
    console.warn(`\n⚠ ${warnings.length} warning(s):\n` + warnings.map((w) => '  - ' + w).join('\n'));
  }

  if (errors.length) {
    console.error(`\n✗ ${errors.length} referential error(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }

  console.log('\n✓ content valid');
}

main();
