/**
 * Deterministic blind ordering for candidate review. Within a source, the review
 * and reveal scripts sort candidates by this key - a hash of the candidate id -
 * so the display order (and thus the A/B/C labels) is decoupled from the model
 * lane baked into the id. The reviewer rates A/B/C without knowing which model is
 * which; reveal re-derives the same order to map labels back to models.
 */
export function blindSortKey(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
