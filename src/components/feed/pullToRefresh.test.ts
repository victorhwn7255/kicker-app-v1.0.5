import { describe, it, expect } from 'vitest';
import { resistance, shouldRefresh, PULL_THRESHOLD, MAX_PULL } from './usePullToRefresh';
import { dedupeById, type FeedItem } from './feedMerge';
import type { Post } from '@/lib/types';

// dedupeById only reads post.id, so a minimal cast is enough for the unit.
const fi = (id?: string): FeedItem => ({ post: { id } as Post, receiptHref: '' });

describe('resistance (pull damping)', () => {
  it('is zero for no / upward travel', () => {
    expect(resistance(0)).toBe(0);
    expect(resistance(-40)).toBe(0);
  });
  it('damps raw finger travel by half', () => {
    expect(resistance(40)).toBe(20);
    expect(resistance(100)).toBe(50);
  });
  it('is monotonic below the cap, then flat at MAX_PULL', () => {
    expect(resistance(50)).toBeLessThan(resistance(120));
    expect(resistance(300)).toBe(MAX_PULL); // 300*0.5=150 -> capped at 110
    expect(resistance(10_000)).toBe(MAX_PULL);
  });
});

describe('shouldRefresh (release threshold)', () => {
  it('fires only at/after the threshold', () => {
    expect(shouldRefresh(0)).toBe(false);
    expect(shouldRefresh(PULL_THRESHOLD - 1)).toBe(false);
    expect(shouldRefresh(PULL_THRESHOLD)).toBe(true);
    expect(shouldRefresh(PULL_THRESHOLD + 10)).toBe(true);
  });
});

describe('dedupeById (shared newer/older merge guard)', () => {
  it('drops incoming items already present by id', () => {
    const existing = [fi('a'), fi('b')];
    const incoming = [fi('b'), fi('c'), fi('a'), fi('d')];
    expect(dedupeById(existing, incoming).map((i) => i.post.id)).toEqual(['c', 'd']);
  });
  it('passes id-less items (fixtures) through', () => {
    const out = dedupeById([fi('a')], [fi(undefined), fi(undefined)]);
    expect(out).toHaveLength(2);
  });
  it('preserves incoming order for the kept items', () => {
    const out = dedupeById([fi('x')], [fi('m'), fi('x'), fi('n')]);
    expect(out.map((i) => i.post.id)).toEqual(['m', 'n']);
  });
});
