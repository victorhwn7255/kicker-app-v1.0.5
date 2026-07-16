import { NextRequest, NextResponse } from 'next/server';
import { attachReceipts, getFeedPage, decodeFeedCursor } from '@/lib/content';

/**
 * GET /api/posts?cursor=<published_at|seq> - one feed page for the infinite
 * scroll. No cursor = the newest page. Response: { items: [{ post, receiptHref }],
 * nextCursor }. Pages behind a cursor are append-stable (new posts only land above
 * the top of the feed), so the CDN is allowed to cache them.
 */
export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get('cursor');
  if (cursor && !decodeFeedCursor(cursor)) {
    return NextResponse.json({ error: 'bad cursor' }, { status: 400 });
  }
  const { posts, nextCursor } = await getFeedPage(cursor ?? null);
  const items = await attachReceipts(posts);
  return NextResponse.json(
    { items, nextCursor },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
