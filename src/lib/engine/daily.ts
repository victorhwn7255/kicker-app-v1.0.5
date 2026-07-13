import type { Account, SourceSection, Post } from '@/lib/types';
import type { PlanItem, TriggerType } from './types';
import { selectKeyFact } from './planner';
import { DAILY } from './config';

/**
 * The daily scheduler: turns the flat account/source reservoir into ONE day's
 * worth of realistic, uneven activity. Where planBatch is a deterministic
 * work-queue (every account, fixed caps, fixed order), this layer answers a
 * different question: "what does TODAY look like on a feed that feels alive?"
 *
 *  - a daily total drawn from [DAILY.targetMin, DAILY.targetMax] (not a constant),
 *  - heavy-tailed allocation across accounts (lognormal weights): a few accounts
 *    have a busy day (up to DAILY.maxPerAccount), most post once or twice, and a
 *    real fraction stay SILENT that day,
 *  - each planned post gets a scheduled_at time drawn from a two-peak day curve
 *    (US hours + Asia/Europe hours + a small anytime tail), with a minimum gap
 *    between one account's posts so nobody machine-guns the feed.
 *
 * Everything is seeded by the DATE: random across days, deterministic within a
 * day. A crashed or re-run cron rebuilds the identical plan, and because
 * candidate ids are deterministic per (runId, account, source, trigger, lane),
 * the day's re-run upserts over itself instead of double-posting.
 */

/** xmur3 string hash -> 32-bit seed. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG: tiny, fast, good enough for scheduling. */
export function makeRng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box-Muller. */
function gauss(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** UTC date key, e.g. "20260713". */
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

/**
 * One post's time-of-day, in ms from UTC midnight. A mixture, not a uniform:
 * 55% cluster on US business/afternoon hours, 30% on Asia/Europe hours (the
 * feed covers Japanese and Chinese filers too), 15% anywhere - so the feed has
 * believable peaks without ever being fully quiet.
 */
function sampleTimeMs(rng: () => number): number {
  const r = rng();
  let hour: number;
  if (r < 0.55) hour = 16.5 + gauss(rng) * 2.2;
  else if (r < 0.85) hour = 4.5 + gauss(rng) * 2.5;
  else hour = rng() * 24;
  hour = ((hour % 24) + 24) % 24; // wrap into [0, 24)
  return Math.floor(hour * 3_600_000);
}

/** A post "references" a source when its source string names the section (planner's rule). */
function referenced(posts: Post[], source: SourceSection): boolean {
  return posts.some(
    (p) => (p.source.split('/').pop()?.trim().toLowerCase() ?? '') === source.section_title.toLowerCase(),
  );
}

export interface DailyPlanItem extends PlanItem {
  scheduledAt: string; // ISO timestamp inside the plan's UTC day
}

export interface DayPlan {
  dateKey: string;
  runId: string;
  /** The day's sampled tweet target (the allocation may land a touch under). */
  target: number;
  items: DailyPlanItem[];
}

export function buildDayPlan(input: {
  accounts: Account[];
  sources: SourceSection[];
  posts: Post[];
  date?: Date;
}): DayPlan {
  const { accounts, sources, posts } = input;
  const date = input.date ?? new Date();
  const key = dateKey(date);
  const rng = makeRng(`${key}:${DAILY.seedSalt}`);
  const dayStartMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  // The day's total: a different number every day, inside the configured band.
  const target = DAILY.targetMin + Math.floor(rng() * (DAILY.targetMax - DAILY.targetMin + 1));

  const sourcesByAccount = new Map<string, SourceSection[]>();
  for (const s of sources) {
    if (!sourcesByAccount.has(s.account)) sourcesByAccount.set(s.account, []);
    sourcesByAccount.get(s.account)!.push(s);
  }
  const recentPostByHandle = new Map<string, Post>();
  for (const p of posts) if (!recentPostByHandle.has(p.handle)) recentPostByHandle.set(p.handle, p);

  // Heavy-tailed activity weights: lognormal spread is what makes SOME accounts
  // loud today and others silent, instead of everyone politely posting once.
  const eligible = accounts.filter((a) => (sourcesByAccount.get(a.handle)?.length ?? 0) > 0);
  const weights = eligible.map(() => Math.exp(gauss(rng)));
  const capFor = (a: Account) =>
    Math.min(DAILY.maxPerAccount, sourcesByAccount.get(a.handle)!.length);

  // Weighted draws with per-account caps. A draw that hits a capped account is
  // re-drawn; if the pool saturates we stop short of target (never force it).
  const counts = new Map<string, number>();
  const totalCapacity = eligible.reduce((n, a) => n + capFor(a), 0);
  const want = Math.min(target, totalCapacity);
  const weightSum = weights.reduce((s, w) => s + w, 0);
  let allocated = 0;
  let attempts = 0;
  while (allocated < want && attempts < want * 30) {
    attempts++;
    let r = rng() * weightSum;
    let idx = 0;
    while (idx < eligible.length - 1 && r > weights[idx]) r -= weights[idx++];
    const acct = eligible[idx];
    const c = counts.get(acct.handle) ?? 0;
    if (c >= capFor(acct)) continue;
    counts.set(acct.handle, c + 1);
    allocated++;
  }

  // Pick WHICH sources each account posts about: fresh (never-referenced) ones
  // first - the planner's ingest priority - then rotation, shuffled within each
  // group so the same source does not lead every single day.
  const items: DailyPlanItem[] = [];
  for (const [handle, count] of counts) {
    const accountSources = sourcesByAccount.get(handle)!;
    const account = eligible.find((a) => a.handle === handle)!;
    const fresh = shuffle(accountSources.filter((s) => !referenced(posts, s)), rng);
    const used = shuffle(accountSources.filter((s) => referenced(posts, s)), rng);
    const picked = [...fresh, ...used].slice(0, count);

    // Schedule this account's posts with a minimum gap between them.
    const times: number[] = [];
    for (let i = 0; i < picked.length; i++) {
      let t = sampleTimeMs(rng);
      for (let tries = 0; tries < 8; tries++) {
        if (times.every((x) => Math.abs(x - t) >= DAILY.minGapMinutes * 60_000)) break;
        t = sampleTimeMs(rng);
      }
      times.push(t);
    }

    picked.forEach((source, i) => {
      const trigger: TriggerType = referenced(posts, source) ? 'rotation' : 'ingest';
      // Occasionally answer a supply-chain sibling that has a recent post - the
      // feed's reply threads - instead of a standalone take on the same source.
      const sibling = (account.supply_chain ?? []).find((h) => recentPostByHandle.has(h));
      const conversational = sibling && rng() < 0.15;
      items.push({
        account: handle,
        sourceId: source.id,
        trigger: conversational ? 'conversation' : trigger,
        keyFact: selectKeyFact(source),
        ...(conversational ? { replyToHandle: sibling } : {}),
        scheduledAt: new Date(dayStartMs + times[i]).toISOString(),
      });
    });
  }

  items.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return { dateKey: key, runId: `day_${key}`, target, items };
}
