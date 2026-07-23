import { NextRequest, NextResponse } from 'next/server';
import { attachReceipts, getNewerFeed, decodeFeedCursor } from '@/lib/content';

// Freshness is the whole point of this route: never let Next's route/data cache
// serve a stale "newest posts" - it must reflect what was published seconds ago.
// `dynamic` opts the route out of static rendering; `fetchCache` forces every fetch
// in it (incl. the Supabase read) to no-store, belt-and-suspenders over Next 15's
// already-uncached fetch default so freshness survives any config/version drift.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/posts/newer?after=<published_at|seq> - posts NEWER than the client's head
 * cursor, newest-first. Powers pull-to-refresh + the "new posts" pill. Unlike the
 * older-page route this is UNCACHED (`no-store`): it MUST reflect just-published
 * posts, so it bypasses the 300s feed cache that /api/posts and the page rely on.
 * Response: { items: [{ post, receiptHref }], headCursor, tailCursor, hasMore }.
 */
export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get('after');
  if (!after || !decodeFeedCursor(after)) {
    return NextResponse.json({ error: 'bad or missing after cursor' }, { status: 400 });
  }
  const { posts, headCursor, tailCursor, hasMore } = await getNewerFeed(after);
  const items = await attachReceipts(posts);
  return NextResponse.json(
    { items, headCursor, tailCursor, hasMore },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
