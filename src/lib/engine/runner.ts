import { GENERATION_LANES, lane, engineEnabled, SIBLING_MAX_SIMILARITY, DAILY, type LaneKey } from './config';
import { planBatch } from './planner';
import { buildDayPlan } from './daily';
import { screenSource } from './guard';
import { runCandidate } from './pipeline';
import { jaccardSimilarity } from './novelty';
import { liveDeps, type EngineDeps } from './deps';
import {
  loadAccounts,
  loadPosts,
  loadSources,
  saveCandidates,
  loadAttemptedSlots,
  loadRecentEmbeddings,
  slotKey,
} from './data';
import type { Candidate, EngineRunResult, GuardResult, PlanItem } from './types';

/**
 * Collapse near-identical siblings from the same source in one run: two models
 * that reword the same fact almost identically add no value, so keep the first
 * and mark the rest dropped (they still passed the gates - verdict_pass stays
 * true - but they are redundant). Distinct takes are kept, so model comparison
 * survives. Ordered primary -> secondary -> fallback, so the kept one is stable.
 */
function dedupeSiblings(candidates: Candidate[]): void {
  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (c.status !== 'verified') continue;
    const key = `${c.account}::${c.sourceId}::${c.trigger}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  for (const group of groups.values()) {
    const kept: Candidate[] = [];
    for (const c of group) {
      const dup = kept.find((k) => jaccardSimilarity(c.body, k.body) >= SIBLING_MAX_SIMILARITY);
      if (dup) {
        c.status = 'dropped';
        c.droppedReason = `sibling-duplicate (~${jaccardSimilarity(c.body, dup.body).toFixed(2)} of ${dup.model})`;
      } else {
        kept.push(c);
      }
    }
  }
}

/**
 * The engine tick. Deterministic planner picks the work; the pipeline runs each
 * (source, model) through the safety gates; every candidate is stored in the
 * review table. This is DRY-RUN by design in Phase 5 - it never writes to `posts`.
 * The publish path is hard-gated behind ENGINE_ENABLED (and is not wired to the
 * cron route in this phase), so nothing can reach the public feed without a human.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runTick(opts?: {
  deps?: EngineDeps;
  batchSize?: number;
  /** Rotate the plan by this offset before slicing, so a nightly cron covers a
   *  different slice each run (pass a day counter). */
  rotateBy?: number;
  laneKeys?: LaneKey[];
  persist?: boolean;
  pace?: boolean;
  runId?: string;
  /**
   * Daily mode: plan the run from the randomized day schedule (daily.ts) instead
   * of the flat A/B work-queue. One lane per post (primary), with a fallback
   * retry, deterministic per-day runId - the production shape of the feed.
   */
  daily?: boolean;
  /** Inject a prebuilt plan (tests, or a pre-sliced day window). */
  plan?: PlanItem[];
  /** Retry an item on this lane when every generation lane dropped it. */
  fallbackLaneKey?: LaneKey;
  /** Wall-clock reference for the daily slice (defaults to now); tests inject it. */
  nowMs?: number;
  /** Pre-generate slots due within this many minutes (daily cron). */
  lookAheadMinutes?: number;
  /** Hard cap on slots one daily tick generates (timeout guard). */
  maxPerTick?: number;
  /** Stop STARTING new generations after this much wall-clock in a tick. */
  softBudgetMs?: number;
}): Promise<EngineRunResult> {
  const deps = opts?.deps ?? liveDeps();
  const persist = opts?.persist ?? true;
  const pace = opts?.pace ?? true;

  const [accounts, sources, posts] = await Promise.all([loadAccounts(), loadSources(), loadPosts()]);
  const accountBy = new Map(accounts.map((a) => [a.handle, a]));
  const sourceBy = new Map(sources.map((s) => [s.id, s]));

  const nowMs = opts?.nowMs ?? Date.now();
  const dayPlan = opts?.daily
    ? buildDayPlan({ accounts, sources, posts, ...(opts?.nowMs ? { date: new Date(nowMs) } : {}) })
    : undefined;
  const laneKeys = opts?.laneKeys ?? (opts?.daily ? (['primary'] as LaneKey[]) : GENERATION_LANES);
  const fallbackLaneKey = opts?.fallbackLaneKey ?? (opts?.daily ? ('secondary' as LaneKey) : undefined);
  const runId = opts?.runId ?? dayPlan?.runId ?? `run_${Date.now().toString(36)}`;

  // Novelty memory: recent published-post embeddings per account (daily mode). Empty
  // in flat/dry-run mode, so novelty stays inert until the feed has real history.
  let historyByHandle = new Map<string, number[][]>();
  let plan: PlanItem[];

  if (opts?.plan) {
    // Injected plan (tests / a pre-sliced window): use verbatim.
    plan = opts.plan;
  } else if (dayPlan) {
    // Daily mode: slice the fixed day plan to the work due now, skipping every slot
    // already attempted in this run. This is the idempotency guard AND the timeout
    // guard: a slot is generated exactly once, and only a bounded slice runs per tick.
    const attempted = await loadAttemptedSlots(runId);
    const pending = dayPlan.items
      .filter((it) => !attempted.has(slotKey(it.account, it.sourceId, it.trigger)))
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
    if (opts?.batchSize != null) {
      // Manual/test slice: the next N pending slots, ignoring the time window.
      plan = pending.slice(0, opts.batchSize);
    } else {
      // Cron slice: slots coming due within the look-ahead window, capped per tick.
      const dueBy = nowMs + (opts?.lookAheadMinutes ?? DAILY.lookAheadMinutes) * 60_000;
      plan = pending
        .filter((it) => (it.scheduledAt ? Date.parse(it.scheduledAt) : nowMs) <= dueBy)
        .slice(0, opts?.maxPerTick ?? DAILY.maxPerTick);
    }
    const handles = [...new Set(plan.map((it) => it.account))];
    historyByHandle = await loadRecentEmbeddings(handles);
  } else {
    // Flat A/B mode (unchanged): rotate the full work-queue, then take a batch.
    const allPlan = planBatch({ accounts, sources, posts });
    const nAll = allPlan.length || 1;
    const offset = (((opts?.rotateBy ?? 0) % nAll) + nAll) % nAll;
    const rotated = offset ? [...allPlan.slice(offset), ...allPlan.slice(0, offset)] : allPlan;
    plan = opts?.batchSize ? rotated.slice(0, opts.batchSize) : rotated;
  }

  const guardCache = new Map<string, GuardResult>();
  const candidates: Candidate[] = [];
  let persistedCount = 0;
  const t0 = Date.now();
  const softBudgetMs = opts?.softBudgetMs ?? DAILY.softBudgetMs;

  for (const item of plan) {
    // Timeout guard: stop STARTING new items before the platform kills the function;
    // the in-flight item still finishes and persists. The next tick picks up the rest.
    if (opts?.daily && candidates.length > 0 && Date.now() - t0 > softBudgetMs) break;
    const account = accountBy.get(item.account);
    const source = sourceBy.get(item.sourceId);
    if (!account || !source) continue;

    // Screen the source once (guard), regardless of how many lanes write about it.
    let guard = guardCache.get(source.id);
    if (!guard) {
      guard = await screenSource(source.body_text, deps);
      guardCache.set(source.id, guard);
    }

    // Novelty compares against this account's recent PUBLISHED posts (post_history,
    // loaded above). Empty until the engine has published, so a first dry-run has no
    // history to repeat; once live, an account cannot echo its own recent takes.
    const historyEmbeddings = historyByHandle.get(account.handle) ?? [];
    const recentPosts = posts.filter((p) => p.handle === account.handle);
    const sibling = item.replyToHandle ? posts.find((p) => p.handle === item.replyToHandle) : undefined;
    const replyToPost = sibling ? { handle: sibling.handle, body: sibling.body } : undefined;

    for (const key of laneKeys) {
      const genLane = lane(key);
      candidates.push(
        await runCandidate({
          runId,
          account,
          source,
          plan: item,
          genLane,
          recentPosts,
          replyToPost,
          historyEmbeddings,
          guard,
          deps,
        }),
      );
      // Respect the lane's free-tier rate pool (skipped when the source was quarantined).
      if (pace && !guard.flagged) await sleep(genLane.pacingMs);
    }

    // Daily-mode resilience: if EVERY generation lane dropped this item (model
    // hiccup, verifier rejection, truncation), retry it once on the fallback
    // lane. Quarantined items never retry - that is a source problem, not a
    // model problem. The fallback must be a lane that has NOT already run for
    // this item: candidate ids are (run, account, source, trigger, LANE), so a
    // same-lane retry would collide with its own row in one upsert batch.
    if (fallbackLaneKey && !laneKeys.includes(fallbackLaneKey)) {
      const mine = candidates.slice(-laneKeys.length);
      if (mine.length > 0 && mine.every((c) => c.status === 'dropped')) {
        const fb = lane(fallbackLaneKey);
        candidates.push(
          await runCandidate({
            runId,
            account,
            source,
            plan: item,
            genLane: fb,
            recentPosts,
            replyToPost,
            historyEmbeddings,
            guard,
            deps,
          }),
        );
        if (pace && !guard.flagged) await sleep(fb.pacingMs);
      }
    }

    // Kill-resilience for the live loop: persist each slot as it completes, so a
    // tick killed at the timeout keeps its finished work (those slots count as
    // attempted next tick, and any verified ones become publishable) instead of
    // discarding the whole batch. Idempotent upsert by candidate id.
    if (persist && opts?.daily) {
      await saveCandidates(candidates.slice(persistedCount));
      persistedCount = candidates.length;
    }
  }

  dedupeSiblings(candidates);

  // Final save: captures any dedupe status changes (flat mode) and is a no-op
  // idempotent re-upsert in daily mode (single lane -> nothing to dedupe).
  if (persist) await saveCandidates(candidates);

  return {
    runId,
    dryRun: true,
    planned: plan.length,
    verified: candidates.filter((c) => c.status === 'verified').length,
    dropped: candidates.filter((c) => c.status === 'dropped').length,
    quarantined: candidates.filter((c) => c.status === 'quarantined').length,
    candidates,
  };
}

/**
 * The live publish path exists but is inert in Phase 5: it refuses unless the
 * human has flipped ENGINE_ENABLED, and the cron route never calls it. Taking the
 * engine live is a separate, explicit human decision (launch phase).
 */
export function assertPublishAllowed(): void {
  if (!engineEnabled()) {
    throw new Error('Publishing is disabled: ENGINE_ENABLED is not true. Engine stays in dry-run.');
  }
}
