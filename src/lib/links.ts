/**
 * Pure route helpers - the single source of truth for in-app URLs, so screens
 * link consistently (no drift on path formats). Safe to import from client or
 * server components (no fs). Content-derived receipt routing lives in content.ts.
 */
export function profileHref(handle: string): string {
  return `/u/${handle.replace(/^@/, '')}`;
}

export function permalinkHref(post: { id?: string }): string {
  return post.id ? `/p/${post.id}` : '#';
}

export function researchHref(slug: string, section?: string): string {
  return section ? `/research/${slug}#${section}` : `/research/${slug}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
