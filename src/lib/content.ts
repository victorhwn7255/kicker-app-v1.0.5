import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { supabaseRead } from './supabase/read';
import { supabaseAdmin } from './supabase/admin';
import { permalinkHref, researchHref } from './links';
import { relativeTime, freshnessStamp } from './engine/format';
import {
  AccountSchema,
  PostSchema,
  KillListEntrySchema,
  TripwireSchema,
  SourceSectionSchema,
  ResearchPageSchema,
  type Account,
  type Post,
  type KillListEntry,
  type Tripwire,
  type SourceSection,
  type ResearchPage,
} from './types';

/**
 * Content loaders - the serving layer. Every public row stores its full validated
 * object in a `data` column; loaders read that column and zod-parse it HERE, at
 * the boundary, so every screen gets typed data and a single failure point
 * (identical contract to the fixture era, now from Supabase).
 *
 * Reads are wrapped in unstable_cache so public pages statically generate and
 * revalidate on a timer (the system design's "hot path" - a static, CDN-cached
 * feed). Each loader is tagged, so the engine (Phase 5) can revalidateTag('posts')
 * the moment it publishes instead of waiting for the timer.
 *
 * Public tables go through the RLS-respecting read client; the private reservoir
 * (`sources`) goes through the admin client. Ordering is by the seeded `seq` so
 * the feed and directory render in exactly the fixture order.
 */
const REVALIDATE_SECONDS = 300;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('\n');
}

/** Parse the `obj` (aliased `data` column) of each row through a schema. */
function parseRows<T>(schema: z.ZodType<T>, rows: { obj: unknown }[] | null, label: string): T[] {
  const result = z.array(schema).safeParse((rows ?? []).map((r) => r.obj));
  if (!result.success) {
    throw new Error(`Invalid ${label} from database:\n${formatIssues(result.error)}`);
  }
  return result.data;
}

/**
 * Stored account/research `freshness` reads "research verified Nd ago". The vault
 * DOES verify its research against primary sources at ingest, but to avoid echoing
 * the (now-disabled) tweet verifier's wording we render it as "research updated Nd
 * ago" at read time - no DB re-seed needed.
 */
function deVerifyFreshness<T extends { freshness?: string }>(row: T): T {
  if (!row.freshness) return row;
  return { ...row, freshness: row.freshness.replace(/^research verified\b/, 'research updated') } as T;
}

export const getAccounts = unstable_cache(
  async (): Promise<Account[]> => {
    const { data, error } = await supabaseRead().from('accounts').select('obj:data').order('seq');
    if (error) throw new Error(`Failed to load accounts: ${error.message}`);
    return parseRows(AccountSchema, data as { obj: unknown }[], 'accounts').map(deVerifyFreshness);
  },
  ['accounts'],
  { revalidate: REVALIDATE_SECONDS, tags: ['accounts'] },
);

export const getAccount = unstable_cache(
  async (handle: string): Promise<Account | undefined> => {
    const { data, error } = await supabaseRead()
      .from('accounts')
      .select('obj:data')
      .eq('handle', handle)
      .maybeSingle();
    if (error) throw new Error(`Failed to load account ${handle}: ${error.message}`);
    if (!data) return undefined;
    return deVerifyFreshness(AccountSchema.parse((data as { obj: unknown }).obj));
  },
  ['account'],
  { revalidate: REVALIDATE_SECONDS, tags: ['accounts'] },
);

export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    // Reverse-chron: engine-published posts (real published_at) newest-first, with
    // the human fixtures (null published_at) kept below in their narrative seq order.
    const { data, error } = await supabaseRead()
      .from('posts')
      .select('obj:data')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('seq', { ascending: true });
    if (error) throw new Error(`Failed to load posts: ${error.message}`);
    const posts = parseRows(PostSchema, data as { obj: unknown }[], 'posts');
    // Render a LIVE relative stamp for engine posts (recomputed each revalidation),
    // so "5m"/"2h" stay honest instead of freezing at publish time. Fixtures keep
    // their hand-authored `time`.
    const now = Date.now();
    return posts.map((p) =>
      p.postedAt
        ? {
            ...p,
            time: relativeTime(Date.parse(p.postedAt), now),
            freshness: freshnessStamp(Date.parse(p.postedAt), now),
          }
        : p,
    );
  },
  ['posts'],
  { revalidate: REVALIDATE_SECONDS, tags: ['posts'] },
);

export const getKillList = unstable_cache(
  async (): Promise<KillListEntry[]> => {
    const { data, error } = await supabaseRead().from('kill_list').select('obj:data').order('seq');
    if (error) throw new Error(`Failed to load kill_list: ${error.message}`);
    return parseRows(KillListEntrySchema, data as { obj: unknown }[], 'kill_list');
  },
  ['kill_list'],
  { revalidate: REVALIDATE_SECONDS, tags: ['kill_list'] },
);

export const getTripwires = unstable_cache(
  async (): Promise<Tripwire[]> => {
    const { data, error } = await supabaseRead().from('tripwires').select('obj:data').order('seq');
    if (error) throw new Error(`Failed to load tripwires: ${error.message}`);
    return parseRows(TripwireSchema, data as { obj: unknown }[], 'tripwires');
  },
  ['tripwires'],
  { revalidate: REVALIDATE_SECONDS, tags: ['tripwires'] },
);

/** Private reservoir - admin client only (no public read policy). */
export const getSources = unstable_cache(
  async (): Promise<SourceSection[]> => {
    const { data, error } = await supabaseAdmin().from('sources').select('obj:data').order('seq');
    if (error) throw new Error(`Failed to load sources: ${error.message}`);
    return parseRows(SourceSectionSchema, data as { obj: unknown }[], 'sources');
  },
  ['sources'],
  { revalidate: REVALIDATE_SECONDS, tags: ['sources'] },
);

export const getResearchPages = unstable_cache(
  async (): Promise<ResearchPage[]> => {
    const { data, error } = await supabaseRead().from('wiki_pages').select('obj:data').order('seq');
    if (error) throw new Error(`Failed to load wiki_pages: ${error.message}`);
    return parseRows(ResearchPageSchema, data as { obj: unknown }[], 'wiki_pages').map(deVerifyFreshness);
  },
  ['wiki_pages'],
  { revalidate: REVALIDATE_SECONDS, tags: ['wiki_pages'] },
);

export const getResearchPage = unstable_cache(
  async (slug: string): Promise<ResearchPage | undefined> => {
    const { data, error } = await supabaseRead()
      .from('wiki_pages')
      .select('obj:data')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new Error(`Failed to load wiki_page ${slug}: ${error.message}`);
    if (!data) return undefined;
    return deVerifyFreshness(ResearchPageSchema.parse((data as { obj: unknown }).obj));
  },
  ['wiki_page'],
  { revalidate: REVALIDATE_SECONDS, tags: ['wiki_pages'] },
);

/* ---- Receipt routing (pure resolvers operate on already-loaded data) ---- */

/**
 * The research section a post's receipt should open, matched from the post's
 * source string ("CRWV / customer concentration") to the account's research page.
 * Returns null when the account has no research page or no matching section.
 */
export function resolvePostResearchSection(
  post: Post,
  accounts: Account[],
  pages: ResearchPage[],
): { slug: string; section?: string } | null {
  const account = accounts.find((a) => a.handle === post.handle);
  if (!account?.research_slug) return null;
  const rp = pages.find((p) => p.slug === account.research_slug);
  if (!rp) return null;
  const srcSection = post.source.split('/').pop()?.trim().toLowerCase();
  const match = rp.sections.find((s) => s.title.toLowerCase() === srcSection);
  return { slug: rp.slug, section: match?.slug };
}

/** Where a post's receipt link navigates: its research section if any, else the permalink. */
export function resolveReceiptHref(post: Post, accounts: Account[], pages: ResearchPage[]): string {
  const rs = resolvePostResearchSection(post, accounts, pages);
  return rs ? researchHref(rs.slug, rs.section) : permalinkHref(post);
}

/** Single-post async convenience (loads the two reference sets, then resolves). */
export async function postResearchSection(
  post: Post,
): Promise<{ slug: string; section?: string } | null> {
  const [accounts, pages] = await Promise.all([getAccounts(), getResearchPages()]);
  return resolvePostResearchSection(post, accounts, pages);
}

export async function receiptHref(post: Post): Promise<string> {
  const [accounts, pages] = await Promise.all([getAccounts(), getResearchPages()]);
  return resolveReceiptHref(post, accounts, pages);
}

/**
 * Resolve receipt hrefs for a list of posts with the reference sets loaded ONCE,
 * so a feed of N posts costs a fixed number of queries, not 2N. Returns
 * render-ready { post, receiptHref } pairs.
 */
export async function attachReceipts(
  posts: Post[],
): Promise<{ post: Post; receiptHref: string }[]> {
  const [accounts, pages] = await Promise.all([getAccounts(), getResearchPages()]);
  return posts.map((post) => ({ post, receiptHref: resolveReceiptHref(post, accounts, pages) }));
}
