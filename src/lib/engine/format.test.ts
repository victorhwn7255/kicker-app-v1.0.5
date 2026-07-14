import { describe, it, expect } from 'vitest';
import { relativeTime, freshnessStamp, sanitizeId } from './format';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  const now = Date.parse('2026-07-13T12:00:00Z');
  it('reads "now" within the first 45s', () => {
    expect(relativeTime(now - 10_000, now)).toBe('now');
  });
  it('steps through m / h / d / w', () => {
    expect(relativeTime(now - 5 * MIN, now)).toBe('5m');
    expect(relativeTime(now - 3 * HOUR, now)).toBe('3h');
    expect(relativeTime(now - 2 * DAY, now)).toBe('2d');
    expect(relativeTime(now - 21 * DAY, now)).toBe('3w');
  });
  it('never goes negative (clock skew / future stamps)', () => {
    expect(relativeTime(now + 10 * MIN, now)).toBe('now');
  });
});

describe('freshnessStamp', () => {
  const now = Date.parse('2026-07-13T12:00:00Z');
  it('is "just now" fresh at publish', () => {
    expect(freshnessStamp(now, now)).toBe('posted just now');
  });
  it('ages with the post', () => {
    expect(freshnessStamp(now - 3 * HOUR, now)).toBe('posted 3h ago');
  });
});

describe('sanitizeId', () => {
  it('lowercases, strips @, and dashes non-alnum runs', () => {
    expect(sanitizeId('@CRWV')).toBe('crwv');
    expect(sanitizeId('day_20260713')).toBe('day-20260713');
    expect(sanitizeId('@who-holds-the-risk')).toBe('who-holds-the-risk');
    expect(sanitizeId('src :: weird // id')).toBe('src-weird-id');
  });
});
