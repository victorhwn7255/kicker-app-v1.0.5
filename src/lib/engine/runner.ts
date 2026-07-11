import { GENERATION_LANES, lane, engineEnabled, type LaneKey } from './config';
import { planBatch } from './planner';
import { screenSource } from './guard';
import { runCandidate } from './pipeline';
import { liveDeps, type EngineDeps } from './deps';
import { loadAccounts, loadPosts, loadSources, saveCandidates } from './data';
import type { Candidate, EngineRunResult, GuardResult } from './types';

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
  laneKeys?: LaneKey[];
  persist?: boolean;
  pace?: boolean;
  runId?: string;
}): Promise<EngineRunResult> {
  const deps = opts?.deps ?? liveDeps();
  const laneKeys = opts?.laneKeys ?? GENERATION_LANES;
  const persist = opts?.persist ?? true;
  const pace = opts?.pace ?? true;
  const runId = opts?.runId ?? `run_${Date.now().toString(36)}`;

  const [accounts, sources, posts] = await Promise.all([loadAccounts(), loadSources(), loadPosts()]);
  const accountBy = new Map(accounts.map((a) => [a.handle, a]));
  const sourceBy = new Map(sources.map((s) => [s.id, s]));

  const plan = planBatch({ accounts, sources, posts, batchSize: opts?.batchSize });

  const guardCache = new Map<string, GuardResult>();
  const candidates: Candidate[] = [];

  for (const item of plan) {
    const account = accountBy.get(item.account);
    const source = sourceBy.get(item.sourceId);
    if (!account || !source) continue;

    // Screen the source once (guard), regardless of how many lanes write about it.
    let guard = guardCache.get(source.id);
    if (!guard) {
      guard = await screenSource(source.body_text, deps);
      guardCache.set(source.id, guard);
    }

    // Novelty compares against previously GENERATED posts (post_history), which is
    // empty until the engine has published; a first dry-run has no history to
    // repeat, so we do not treat the human fixtures as history.
    const historyEmbeddings: number[][] = [];
    const recentPosts = posts.filter((p) => p.handle === account.handle);

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
          historyEmbeddings,
          guard,
          deps,
        }),
      );
      // Respect the lane's free-tier rate pool (skipped when the source was quarantined).
      if (pace && !guard.flagged) await sleep(genLane.pacingMs);
    }
  }

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
