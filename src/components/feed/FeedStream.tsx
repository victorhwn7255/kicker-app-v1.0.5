'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PostCard } from './PostCard';
import { Terminator } from './Terminator';
import { NewPostsPill } from './NewPostsPill';
import { dedupeById, type FeedItem } from './feedMerge';
import { usePullToRefresh } from './usePullToRefresh';

const SPINNER = 'h-7 w-7 animate-spin rounded-pill border-[3px] border-line border-t-cyan';
const POLL_MS = 75_000; // background check for newer posts while the tab is visible

/**
 * FeedStream - the X-style timeline. Scroll DOWN loads older cursor-pages from
 * /api/posts (IntersectionObserver at the bottom, unchanged). At the top, NEWER
 * posts arrive from the uncached /api/posts/newer route two ways:
 *   - pull-to-refresh (touch): prepends the newest posts immediately, spinner shown;
 *   - the "N new posts" pill: a ~75s visible-tab poll buffers newer posts and offers
 *     them (the desktop path - no pull gesture on a mouse); a click prepends + scrolls up.
 * The feed still ENDS on purpose (Terminator once the older cursor runs out).
 */
export function FeedStream({
  initialItems,
  initialCursor,
  initialHeadCursor,
}: {
  initialItems: FeedItem[];
  initialCursor: string | null;
  initialHeadCursor: string | null;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [pending, setPending] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef(false);
  const newerInFlight = useRef(false);
  // Refs mirror state so the async fetch/poll closures read the latest, not a stale capture.
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const headCursorRef = useRef(initialHeadCursor);
  const refreshingRef = useRef(refreshing);
  refreshingRef.current = refreshing;

  // ---- older posts (scroll down) - behavior unchanged ----
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
      setItems((prev) => [...prev, ...dedupeById(prev, next)]);
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

  // ---- newer posts (pull / pill / poll) ----
  const fetchNewer = useCallback(async (): Promise<{
    items: FeedItem[];
    hasMore: boolean;
    tailCursor: string | null;
  } | null> => {
    const after = headCursorRef.current;
    if (!after || newerInFlight.current) return null;
    newerInFlight.current = true;
    try {
      const res = await fetch(`/api/posts/newer?after=${encodeURIComponent(after)}`);
      if (!res.ok) throw new Error(`newer ${res.status}`);
      const data = (await res.json()) as {
        items: FeedItem[];
        headCursor: string | null;
        tailCursor: string | null;
        hasMore: boolean;
      };
      if (data.headCursor) headCursorRef.current = data.headCursor;
      // Dedupe against what's on screen AND already buffered, so a poll can't double-count.
      const fresh = dedupeById([...itemsRef.current, ...pendingRef.current], data.items);
      return { items: fresh, hasMore: data.hasMore, tailCursor: data.tailCursor };
    } catch {
      return null;
    } finally {
      newerInFlight.current = false;
    }
  }, []);

  // Background poll: buffer newer posts into `pending` so the pill can offer them.
  useEffect(() => {
    const tick = async () => {
      if (document.hidden || refreshingRef.current) return;
      const r = await fetchNewer();
      if (r && r.items.length) setPending((prev) => [...r.items, ...prev]);
    };
    const onVis = () => {
      if (!document.hidden) void tick();
    };
    const timer = setInterval(() => void tick(), POLL_MS);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchNewer]);

  // Manual refresh (pull-to-refresh gesture OR the pill click): show the freshest up top.
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const r = await fetchNewer();
      // r.items are deduped against the current items + pending, and everything newer
      // is strictly above what's on screen, so a plain prepend can't duplicate or
      // reorder. (In the astronomically-rare case of >1 page of new posts between
      // polls, the newest page prepends and the middle re-loads via scroll-down - no
      // duplicates, which the old tailCursor-reset path could produce.)
      const combined = [...(r?.items ?? []), ...pendingRef.current];
      if (combined.length) {
        setItems((prev) => [...combined, ...dedupeById(combined, prev)]);
      }
      setPending([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [fetchNewer]);

  usePullToRefresh({ indicatorRef, onRefresh: refresh, disabled: refreshing });

  return (
    <>
      {refreshing ? (
        <div className="flex items-center justify-center py-4" role="status" aria-label="Refreshing">
          <span className={SPINNER} />
        </div>
      ) : (
        // The pull indicator: height/opacity are driven imperatively by usePullToRefresh
        // via this ref (no React re-render per touchmove). Collapsed (0) at rest.
        <div
          ref={indicatorRef}
          aria-hidden="true"
          className="flex items-center justify-center overflow-hidden"
          style={{ height: 0, opacity: 0 }}
        >
          <span className={SPINNER} />
        </div>
      )}

      {pending.length > 0 && !refreshing && (
        <NewPostsPill count={pending.length} onClick={() => void refresh()} />
      )}

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
          <span className={SPINNER} />
        </div>
      ) : (
        <Terminator />
      )}
    </>
  );
}
