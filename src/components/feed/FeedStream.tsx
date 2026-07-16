'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PostCard } from './PostCard';
import { Terminator } from './Terminator';
import type { Post } from '@/lib/types';

type FeedItem = { post: Post; receiptHref: string };

/**
 * FeedStream - the X-style infinite timeline. The server renders the newest page;
 * a sentinel near the bottom watches the viewport (IntersectionObserver, 1000px
 * early so the fetch usually finishes before the reader arrives), pulls the next
 * cursor page from /api/posts, and appends. The spinner sits exactly where the
 * next batch will land. The feed still ENDS on purpose: the Terminator renders
 * only once the cursor runs out.
 */
export function FeedStream({
  initialItems,
  initialCursor,
}: {
  initialItems: FeedItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef(false);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const loadMore = useCallback(async () => {
    const c = cursorRef.current;
    if (!c || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`/api/posts?cursor=${encodeURIComponent(c)}`);
      if (!res.ok) throw new Error(`feed page ${res.status}`);
      const { items: next, nextCursor } = (await res.json()) as {
        items: FeedItem[];
        nextCursor: string | null;
      };
      setItems((prev) => {
        // Belt-and-braces dedupe: a revalidation between pages can shift a boundary.
        const seen = new Set(prev.map((i) => i.post.id).filter(Boolean));
        return [...prev, ...next.filter((i) => !i.post.id || !seen.has(i.post.id))];
      });
      setCursor(nextCursor);
    } catch {
      // Network hiccup: keep the cursor; the observer retries as the reader scrolls.
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '1000px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, cursor]);

  return (
    <>
      {items.map(({ post, receiptHref }) => (
        <PostCard
          key={post.id ?? post.handle + post.time}
          post={post}
          receiptHref={receiptHref}
          interactive
        />
      ))}
      {cursor ? (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
          role="status"
          aria-label="Loading more posts"
        >
          <span className="h-7 w-7 animate-spin rounded-pill border-[3px] border-line border-t-cyan" />
        </div>
      ) : (
        <Terminator />
      )}
    </>
  );
}
