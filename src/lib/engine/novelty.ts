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
