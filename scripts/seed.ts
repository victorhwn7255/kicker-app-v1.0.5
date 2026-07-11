import './_env';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import {
  readAccounts,
  readPosts,
  readKillList,
  readTripwires,
  readSources,
  readResearchPages,
} from '../src/lib/fixtures';

/**
 * Seeds Supabase from the validated /content fixtures. Idempotent: every table
 * is upserted on its primary key, so re-running updates rows in place and never
 * duplicates. `seq` carries the fixture array order so the feed and directory
 * render exactly as before. The full validated object is stored in `data`; the
 * other columns are the queryable projection the engine and RLS use.
 */
async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string) {
  if (!rows.length) return;
  const { error } = await supabaseAdmin().from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Seed ${table} failed: ${error.message}`);
  console.log(`  ${table}: ${rows.length} row(s) upserted`);
}

async function main() {
  const accounts = readAccounts();
  const sources = readSources();
  const posts = readPosts();
  const killList = readKillList();
  const tripwires = readTripwires();
  const pages = readResearchPages();

  const missingId = posts.find((p) => !p.id);
  if (missingId) throw new Error(`Post is missing an id (required as primary key): ${missingId.handle}`);

  console.log('Seeding Supabase from /content fixtures (idempotent upserts)...');

  // Accounts first - every other table's account FK points here.
  await upsert(
    'accounts',
    accounts.map((a, i) => ({
      handle: a.handle,
      kind: a.kind,
      display_name: a.display_name ?? null,
      domain: a.domain ?? null,
      research_slug: a.research_slug ?? null,
      freshness: a.freshness ?? null,
      seq: i,
      data: a,
    })),
    'handle',
  );

  await upsert(
    'sources',
    sources.map((s, i) => ({
      id: s.id,
      account: s.account,
      section_title: s.section_title,
      body_text: s.body_text,
      tier: s.tier,
      qualifier: s.qualifier ?? null,
      vault_ref: s.vault_ref,
      seq: i,
      data: s,
    })),
    'id',
  );

  await upsert(
    'posts',
    posts.map((p, i) => ({
      id: p.id,
      account: p.handle,
      kind: p.kind,
      variant: p.variant ?? null,
      tier: p.tier,
      source_id: null,
      trigger: null,
      seq: i,
      data: p,
    })),
    'id',
  );

  await upsert(
    'kill_list',
    killList.map((k, i) => ({ id: k.id, verdict: k.verdict, seq: i, data: k })),
    'id',
  );

  await upsert(
    'tripwires',
    tripwires.map((t, i) => ({
      id: t.id,
      account: t.account,
      status: t.status,
      post_id: t.post_id ?? null,
      seq: i,
      data: t,
    })),
    'id',
  );

  await upsert(
    'wiki_pages',
    pages.map((w, i) => ({
      slug: w.slug,
      account: w.account,
      title: w.title,
      is_paid: true,
      freshness: w.freshness,
      section_count: w.section_count,
      seq: i,
      data: w,
    })),
    'slug',
  );

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
