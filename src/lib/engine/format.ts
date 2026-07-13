/**
 * Pure display helpers, shared by the publisher (engine, server) and the feed
 * loader (app, server). No model or DB imports live here, so importing it from
 * the app bundle pulls in nothing heavy.
 */

/**
 * A compact, Twitter-style relative stamp: "now", "5m", "3h", "2d". Computed from
 * a post's real publish time against a reference "now", so the feed reads live -
 * the loader recomputes it every revalidation instead of freezing a stale "2h".
 */
export function relativeTime(fromMs: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (s < 45) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  return `${w}w`;
}

/** A freshness stamp for a freshly published post, e.g. "verified just now". */
export function freshnessStamp(fromMs: number, nowMs: number): string {
  const rel = relativeTime(fromMs, nowMs);
  return rel === 'now' ? 'verified just now' : `verified ${rel} ago`;
}

/** Make an arbitrary string safe as a URL-ish primary key: lower, alnum + dashes. */
export function sanitizeId(s: string): string {
  return s
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
