import { attachReceipts, getFeedPage } from '@/lib/content';
import { FeedStream } from '@/components/feed/FeedStream';

/**
 * The landing page IS the feed. Reverse-chron, single centered column, X-style.
 * Every post is real, sourced, and confidence-labeled; the feed ends on purpose.
 *
 * X-style loading: the server renders only the NEWEST page (statically cached,
 * CDN-served); FeedStream pulls the rest through /api/posts cursor pages as the
 * reader scrolls. getFeedPage serves engine posts only (published_at is the
 * filter), so the hand-authored fixtures with hardcoded "1h" stamps never render.
 */
export const revalidate = 300;

export default async function Home() {
  const { posts, nextCursor } = await getFeedPage(null);
  const items = await attachReceipts(posts);

  return (
    <div className="mx-auto min-h-screen max-w-[600px] border-line sm:border-x">
      {items.length === 0 ? (
        <div className="px-4 py-16 text-center text-[15px] text-muted">Nothing has posted yet.</div>
      ) : (
        <FeedStream initialItems={items} initialCursor={nextCursor} />
      )}
    </div>
  );
}
