import { NOVELTY_MAX_SIMILARITY } from './config';

/**
 * The novelty gate's math, kept pure so it is unit-testable without an embedding
 * API. The pipeline fetches embeddings (models.embedTexts) and hands the vectors
 * here. A candidate too similar to a recent post is discarded, so accounts do not
 * repeat themselves.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Lexical (word-set Jaccard) similarity, for cheap near-duplicate detection
 * between sibling candidates generated from the SAME source in one run - no
 * embedding call needed. Two models rewording the same fact score high here.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const tokens = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9$%.]+/g) ?? []);
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  for (const t of A) if (B.has(t)) intersection++;
  return intersection / (A.size + B.size - intersection);
}

/** Novel when its closest match in history is below the similarity ceiling. */
export function checkNovelty(
  candidate: number[],
  history: number[][],
  max: number = NOVELTY_MAX_SIMILARITY,
): { novel: boolean; maxSimilarity: number } {
  let maxSimilarity = 0;
  for (const h of history) {
    const sim = cosineSimilarity(candidate, h);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }
  return { novel: maxSimilarity < max, maxSimilarity };
}
