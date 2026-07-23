import type { Post } from '@/lib/types';

export type FeedItem = { post: Post; receiptHref: string };

/**
 * Drop incoming items whose `post.id` already appears in `existing`; id-less items
 * pass through (fixtures). Pure + shared by the older-scroll and newer-refresh paths
 * so a revalidation that shifts a page boundary can never double-render a post.
 */
export function dedupeById(existing: FeedItem[], incoming: FeedItem[]): FeedItem[] {
  const seen = new Set(existing.map((i) => i.post.id).filter(Boolean));
  return incoming.filter((i) => !i.post.id || !seen.has(i.post.id));
}
