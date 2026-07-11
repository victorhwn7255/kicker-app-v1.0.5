import { describe, it, expect } from 'vitest';
import { checkLength } from './lengthGate';
import { cosineSimilarity, checkNovelty, jaccardSimilarity } from './novelty';
import { verdictPasses } from './types';
import { chunkForGuard, screenSource } from './guard';
import { mockDeps, PASS_VERDICT, validBody } from './testkit';

describe('lengthGate (enforced in code, never trusted to the model)', () => {
  it('accepts a body within the 140-600 window', () => expect(checkLength(validBody(300)).ok).toBe(true));
  it('rejects too short (below the 140 floor)', () => {
    const r = checkLength('x'.repeat(139));
    expect(r.ok).toBe(false);
    expect(r.len).toBe(139);
  });
  it('rejects too long', () => expect(checkLength('x'.repeat(601)).ok).toBe(false));
});

describe('novelty math', () => {
  it('cosine of identical vectors is 1', () => expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1));
  it('cosine of orthogonal vectors is 0', () => expect(cosineSimilarity([1, 0], [0, 1])).toBe(0));
  it('rejects a near-duplicate of history', () => expect(checkNovelty([1, 0, 0], [[1, 0, 0]]).novel).toBe(false));
  it('accepts a novel candidate', () => expect(checkNovelty([1, 0, 0], [[0, 1, 0]]).novel).toBe(true));
  it('is novel against empty history', () => expect(checkNovelty([1, 0, 0], []).novel).toBe(true));
});

describe('jaccard (sibling dedup)', () => {
  it('identical text scores 1', () => expect(jaccardSimilarity('a b c', 'a b c')).toBe(1));
  it('disjoint text scores 0', () => expect(jaccardSimilarity('a b', 'c d')).toBe(0));
  it('near-duplicate siblings score high', () =>
    expect(
      jaccardSimilarity(
        'colocation revenue is 100% one customer',
        'colocation revenue is 100% a single customer',
      ),
    ).toBeGreaterThan(0.5));
});

describe('verdictPasses (fail-closed truth table)', () => {
  it('passes a clean verdict', () => expect(verdictPasses(PASS_VERDICT)).toBe(true));
  it('fails on an untraceable claim', () =>
    expect(verdictPasses({ ...PASS_VERDICT, claims_traceable: false })).toBe(false));
  it('fails on invented numbers', () =>
    expect(verdictPasses({ ...PASS_VERDICT, invented_numbers: true })).toBe(false));
  it('fails on buy/sell language', () =>
    expect(verdictPasses({ ...PASS_VERDICT, buy_sell_language: true })).toBe(false));
  it('fails on dropped hedges', () =>
    expect(verdictPasses({ ...PASS_VERDICT, hedges_preserved: false })).toBe(false));
  it('fails on persona-identity drift', () =>
    expect(verdictPasses({ ...PASS_VERDICT, persona_identity_ok: false })).toBe(false));
});

describe('prompt guard', () => {
  it('chunks long text to the classifier window', () =>
    expect(chunkForGuard('a'.repeat(4000), 1500).length).toBe(3));
  it('flags when a chunk scores at/above threshold (quarantine)', async () => {
    const g = await screenSource('poison', mockDeps({ guardScore: async () => 0.997 }));
    expect(g.flagged).toBe(true);
    expect(g.maxScore).toBeCloseTo(0.997);
  });
  it('passes clean text', async () => {
    const g = await screenSource('clean', mockDeps({ guardScore: async () => 0.0004 }));
    expect(g.flagged).toBe(false);
  });
  it('fails safe (quarantines) when the classifier throws', async () => {
    const g = await screenSource(
      'x',
      mockDeps({
        guardScore: async () => {
          throw new Error('down');
        },
      }),
    );
    expect(g.flagged).toBe(true);
    expect(g.maxScore).toBe(1);
  });
});
