import { GUARD } from './config';
import type { GuardResult } from './types';
import type { EngineDeps } from './deps';

/**
 * Prompt-injection screening. Every source section is scored by the classifier
 * BEFORE generation; chunked to fit its ~512-token window. A score at/above the
 * threshold QUARANTINES the source for human review - it is never silently
 * dropped, because kill-list entries legitimately quote hostile-shaped text and
 * false positives are expected. A classifier error fails safe (treated as a hit).
 */
export function chunkForGuard(text: string, chunkChars: number = GUARD.chunkChars): string[] {
  if (text.length <= chunkChars) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkChars) chunks.push(text.slice(i, i + chunkChars));
  return chunks;
}

export async function screenSource(
  sourceText: string,
  deps: EngineDeps,
  signal?: AbortSignal,
): Promise<GuardResult> {
  const chunks = chunkForGuard(sourceText);
  const chunkScores: number[] = [];
  for (const chunk of chunks) {
    try {
      chunkScores.push(await deps.guardScore(chunk, signal));
    } catch {
      chunkScores.push(1); // fail-safe: cannot verify safety -> quarantine
    }
  }
  const maxScore = chunkScores.length ? Math.max(...chunkScores) : 0;
  return { flagged: maxScore >= GUARD.threshold, maxScore, chunkScores };
}
