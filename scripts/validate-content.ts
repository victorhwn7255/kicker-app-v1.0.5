/**
 * Content validator - fails the build on any bad fixture.
 * Runs every loader (so every file is zod-parsed) and then checks referential
 * integrity across the fixtures. Wired into `pnpm build` via the `validate-content`
 * script. A validator that silently passes bad content is worse than none.
 */
import {
  getAccounts,
  getPosts,
  getKillList,
  getTripwires,
  getSources,
  getResearchPages,
} from '../src/lib/content';

function main(): void {
  const errors: string[] = [];

  let accounts, posts, killList, tripwires, sources, research;
  try {
    accounts = getAccounts();
    posts = getPosts();
    killList = getKillList();
    tripwires = getTripwires();
    sources = getSources();
    research = getResearchPages();
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
  for (const a of accounts) {
    for (const h of a.supply_chain ?? []) unknownAccount(`account ${a.handle} supply_chain`, h);
    if (a.research_slug && !slugs.has(a.research_slug))
      errors.push(`account ${a.handle} research_slug references unknown page ${a.research_slug}`);
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

  if (errors.length) {
    console.error(`\n✗ ${errors.length} referential error(s):\n` + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }

  console.log('\n✓ content valid');
}

main();
