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

/**
 * LIVE relative stamps for engine posts (recomputed each revalidation), so
 * "5m"/"2h" stay honest instead of freezing at publish time. Fixtures keep
 * their hand-authored `time`.
 */
function stampLive(p: Post, now: number): Post {
  return p.postedAt
    ? {
        ...p,
        time: relativeTime(Date.parse(p.postedAt), now),
        freshness: freshnessStamp(Date.parse(p.postedAt), now),
      }
    : p;
}

export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    // Reverse-chron: engine-published posts (real published_at) newest-first, with
    // the human fixtures (null published_at) kept below in their narrative seq order.
    // NOTE: loads the WHOLE table - reserved for whole-corpus consumers (sitemap).
    // Screens use the bounded loaders below; do not add new getPosts() callers.
    const { data, error } = await supabaseRead()
      .from('posts')
      .select('obj:data')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('seq', { ascending: true });
    if (error) throw new Error(`Failed to load posts: ${error.message}`);
    const posts = parseRows(PostSchema, data as { obj: unknown }[], 'posts');
    const now = Date.now();
    return posts.map((p) => stampLive(p, now));
  },
  ['posts'],
  { revalidate: REVALIDATE_SECONDS, tags: ['posts'] },
);

/** One post by id - a single-row fetch, not a scan (permalink + OG image path). */
export const getPost = unstable_cache(
  async (id: string): Promise<Post | undefined> => {
    const { data, error } = await supabaseRead()
      .from('posts')
      .select('obj:data')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load post ${id}: ${error.message}`);
    if (!data) return undefined;
    return stampLive(PostSchema.parse((data as { obj: unknown }).obj), Date.now());
  },
  ['post'],
  { revalidate: REVALIDATE_SECONDS, tags: ['posts'] },
);

/**
 * One account's posts, newest first, BOUNDED (profile page). The `account`
 * column is indexed by the publish-time index set, so this stays fast no
 * matter how large the posts table grows.
 */
export const getAccountPosts = unstable_cache(
  async (handle: string, limit: number = 30): Promise<Post[]> => {
    const { data, error } = await supabaseRead()
      .from('posts')
      .select('obj:data')
      .eq('account', handle)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('seq', { ascending: true })
      .limit(limit);
    if (error) throw new Error(`Failed to load posts for ${handle}: ${error.message}`);
    const now = Date.now();
    return parseRows(PostSchema, data as { obj: unknown }[], 'posts').map((p) => stampLive(p, now));
  },
  ['account_posts'],
  { revalidate: REVALIDATE_SECONDS, tags: ['posts'] },
);

/** Replies TO an account (permalink page), bounded. replyTo lives in the data jsonb. */
export const getReplies = unstable_cache(
  async (handle: string, limit: number = 20): Promise<Post[]> => {
    const { data, error } = await supabaseRead()
      .from('posts')
      .select('obj:data')
      .eq('data->>replyTo', handle)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('seq', { ascending: true })
      .limit(limit);
    if (error) throw new Error(`Failed to load replies to ${handle}: ${error.message}`);
    const now = Date.now();
    return parseRows(PostSchema, data as { obj: unknown }[], 'posts').map((p) => stampLive(p, now));
  },
  ['replies'],
  { revalidate: REVALIDATE_SECONDS, tags: ['posts'] },
);

/* ---- Cursor-paged feed (the X-style timeline pattern) ---- */

export const FEED_PAGE_SIZE = 30;

/**
 * Opaque feed cursor: "<published_at ISO>|<seq>" of the last row the client holds.
 * A tick publishes its batch under ONE published_at (seq = schedule-second breaks
 * ties), so the cursor must be composite - a timestamp alone would skip or repeat
 * posts when a page boundary lands inside a batch.
 */
export function encodeFeedCursor(ts: string, seq: number): string {
  return `${ts}|${seq}`;
}

export function decodeFeedCursor(cursor: string): { ts: string; seq: number } | null {
  const i = cursor.lastIndexOf('|');
  if (i < 0) return null;
  const ts = cursor.slice(0, i);
  const seq = Number(cursor.slice(i + 1));
  if (!ts || Number.isNaN(Date.parse(ts)) || !Number.isFinite(seq)) return null;
  return { ts, seq };
}

export type FeedPage = { posts: Post[]; nextCursor: string | null };

/**
 * One feed page, newest-first from the cursor. Engine posts only (fixtures have no
 * published_at). Fetches limit+1 rows so "is there another page?" needs no second
 * query. Cached per cursor - and older pages are append-stable (new posts only ever
 * land above the newest cursor), so they cache cleanly.
 */
export const getFeedPage = unstable_cache(
  async (cursor: string | null, limit: number = FEED_PAGE_SIZE): Promise<FeedPage> => {
    let q = supabaseRead()
      .from('posts')
      .select('obj:data, published_at, seq')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('seq', { ascending: true })
      .limit(limit + 1);
    const c = cursor ? decodeFeedCursor(cursor) : null;
    if (c) {
      // Strictly after the cursor in feed order: an older batch, or same batch + later seq.
      q = q.or(`published_at.lt."${c.ts}",and(published_at.eq."${c.ts}",seq.gt.${c.seq})`);
    }
    const { data, error } = await q;
    if (error) throw new Error(`Failed to load feed page: ${error.message}`);
    const rows = (data ?? []) as unknown as { obj: unknown; published_at: string; seq: number }[];
    const pageRows = rows.slice(0, limit);
    const posts = parseRows(PostSchema, pageRows, 'posts');
    // Same live relative stamps as getPosts, recomputed each revalidation.
    const now = Date.now();
    const stamped = posts.map((p) =>
      p.postedAt
        ? {
            ...p,
            time: relativeTime(Date.parse(p.postedAt), now),
            freshness: freshnessStamp(Date.parse(p.postedAt), now),
          }
        : p,
    );
    const last = pageRows[pageRows.length - 1];
    const nextCursor =
      rows.length > limit && last ? encodeFeedCursor(last.published_at, last.seq) : null;
    return { posts: stamped, nextCursor };
  },
  ['feed_page'],
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
