import type { Post } from '@/lib/types';
import { PostSchema, type Account, type SourceSection } from '@/lib/types';
import { engineEnabled } from './config';
import { liveDeps, type EngineDeps } from './deps';
import {
  loadAccounts,
  loadSources,
  loadPosts,
  loadDuePublishable,
  publishPosts,
  markCandidatesPublished,
  savePostHistory,
  type PublishableCandidate,
} from './data';
import { relativeTime, freshnessStamp, sanitizeId } from './format';

/**
 * The publisher: the ONLY path from a verified candidate to the public feed. It
 * is the launch-phase counterpart to the dry-run pipeline - the pipeline decides
 * WHAT may ship; the publisher ships it, on schedule, exactly once.
 *
 * Hard safety contract:
 *  - It refuses unless ENGINE_ENABLED is true. A preview run (the CLI) bypasses
 *    the gate but writes NOTHING - it only shows what would go live.
 *  - It is idempotent. Post ids are deterministic per (day, account, source,
 *    trigger) slot, so an upsert can never double-post; and a candidate is stamped
 *    published_at the moment it ships, so `published_at is null` guarantees it is
 *    never republished. Overlapping crons are safe.
 *  - One post per slot. If a slot somehow has more than one verified candidate
 *    (e.g. a fallback lane that also passed), the highest-priority lane wins and
 *    every sibling is stamped published against the same post id.
 *  - No dangling replies. A conversation reply ships as a reply ONLY if its parent
 *    handle already has a published post; otherwise it ships as a standalone.
 */

const LANE_PRIORITY: Record<string, number> = { primary: 0, secondary: 1, fallback: 2, premium: 3 };

function laneFromId(candidateId: string): string {
  const parts = candidateId.split('::');
  return parts[parts.length - 1] ?? '';
}

/** The slot (day, account, source, trigger) a candidate id belongs to - lane dropped. */
function slotPartsFromId(candidateId: string): [string, string, string, string] | null {
  const parts = candidateId.split('::');
  if (parts.length < 5) return null;
  return [parts[0], parts[1], parts[2], parts[3]];
}

/** Deterministic public post id for a slot: same slot -> same id -> upsert, never dup. */
function postIdForSlot(runId: string, account: string, sourceId: string, trigger: string): string {
  return `p-${sanitizeId(runId)}-${sanitizeId(account)}-${sanitizeId(sourceId)}-${sanitizeId(trigger)}`;
}

function postIdOf(candidateId: string): string {
  const slot = slotPartsFromId(candidateId);
  if (!slot) return `p-${sanitizeId(candidateId)}`;
  return postIdForSlot(slot[0], slot[1], slot[2], slot[3]);
}

function buildPost(
  cand: PublishableCandidate,
  account: Account | undefined,
  source: SourceSection | undefined,
  parentPublished: boolean,
  nowMs: number,
): Post {
  const scheduledMs = cand.scheduled_at ? Date.parse(cand.scheduled_at) : nowMs;
  const kind = account?.kind ?? 'company';
  const handleName = cand.account.replace(/^@/, '');
  const sectionTitle = source?.section_title ?? 'update';
  const isReply = cand.trigger === 'conversation' && !!cand.reply_to && parentPublished;

  const post: Post = {
    id: postIdOf(cand.id),
    handle: cand.account,
    kind,
    time: relativeTime(scheduledMs, nowMs),
    body: cand.body,
    tier: cand.tier as Post['tier'],
    ...(cand.qualifier ? { qualifier: cand.qualifier } : {}),
    source: `${handleName} / ${sectionTitle}`,
    freshness: freshnessStamp(scheduledMs, nowMs),
    ...(account?.avatar ? { avatar: account.avatar } : {}),
    variant: isReply ? 'reply' : 'original',
    ...(isReply ? { replyTo: cand.reply_to! } : {}),
    postedAt: new Date(scheduledMs).toISOString(),
  };
  // Validate at the boundary, exactly like the seed/loader do, so a malformed post
  // can never reach the feed table.
  return PostSchema.parse(post);
}

export interface PublishResult {
  published: number;
  slotsConsidered: number;
  preview: boolean;
  posts: { id: string; handle: string; scheduledAt: string | null }[];
}

export async function publishDue(opts?: {
  nowMs?: number;
  deps?: EngineDeps;
  /** Compute what WOULD publish without the gate and without writing anything. */
  preview?: boolean;
}): Promise<PublishResult> {
  const preview = opts?.preview ?? false;
  if (!preview && !engineEnabled()) {
    throw new Error('Publishing is disabled: ENGINE_ENABLED is not true. Engine stays in dry-run.');
  }
  const nowMs = opts?.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const due = await loadDuePublishable(nowIso);
  if (!due.length) return { published: 0, slotsConsidered: 0, preview, posts: [] };

  const [accounts, sources, existingPosts] = await Promise.all([
    loadAccounts(),
    loadSources(),
    loadPosts(),
  ]);
  const accountBy = new Map(accounts.map((a) => [a.handle, a]));
  const sourceBy = new Map(sources.map((s) => [s.id, s]));
  const handlesWithPosts = new Set(existingPosts.map((p) => p.handle));

  // One canonical candidate per slot: highest-priority lane wins. Every due row
  // (canonical AND its siblings) still gets stamped published against the same
  // post id, so no sibling is left to publish on a later tick.
  const canonical = new Map<string, PublishableCandidate>();
  for (const c of due) {
    const slot = slotPartsFromId(c.id);
    if (!slot) continue;
    const key = slot.join('::');
    const cur = canonical.get(key);
    if (!cur || (LANE_PRIORITY[laneFromId(c.id)] ?? 9) < (LANE_PRIORITY[laneFromId(cur.id)] ?? 9)) {
      canonical.set(key, c);
    }
  }

  const chosen = [...canonical.values()].sort((a, b) =>
    (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''),
  );

  const postRows: Record<string, unknown>[] = [];
  const built: { post: Post; cand: PublishableCandidate }[] = [];
  for (const cand of chosen) {
    const account = accountBy.get(cand.account);
    const source = cand.source_id ? sourceBy.get(cand.source_id) : undefined;
    const parentPublished = !!cand.reply_to && handlesWithPosts.has(cand.reply_to);
    const post = buildPost(cand, account, source, parentPublished, nowMs);
    built.push({ post, cand });
    postRows.push({
      id: post.id,
      account: post.handle,
      kind: post.kind,
      variant: post.variant ?? 'original',
      tier: post.tier,
      source_id: cand.source_id,
      trigger: cand.trigger,
      // Epoch seconds of the go-live time: monotonic, and always far above the
      // handful of fixture seqs so live posts never collide with the demo feed.
      seq: Math.floor((cand.scheduled_at ? Date.parse(cand.scheduled_at) : nowMs) / 1000),
      published_at: cand.scheduled_at ?? nowIso,
      data: post,
      model: cand.model,
      provider: cand.provider,
      prompt_version: cand.prompt_version,
      engine_run_id: cand.engine_run_id,
      verified: true,
      verdict: cand.verdict ?? null,
    });
  }

  const posts = built.map(({ post, cand }) => ({
    id: post.id!,
    handle: post.handle,
    scheduledAt: cand.scheduled_at,
  }));

  if (preview) {
    return { published: built.length, slotsConsidered: canonical.size, preview, posts };
  }

  // Write order matters for idempotency: publish the posts FIRST (the upsert is the
  // source of truth), THEN stamp candidates. If the stamp fails, the next tick
  // re-publishes the SAME post id (a no-op upsert) and re-stamps - never a dup.
  await publishPosts(postRows);
  await markCandidatesPublished(due, postIdOf, nowIso);

  // Novelty memory: embed each new body and store it keyed by handle. Best-effort -
  // a failure here only weakens future repeat-detection, it must not fail a publish
  // that already landed.
  try {
    const deps = opts?.deps ?? liveDeps();
    const bodies = built.map(({ post }) => post.body);
    const embeddings = await deps.embed(bodies);
    const history = built
      .map(({ post }, i) => ({ post_id: post.id!, handle: post.handle, embedding: embeddings[i] }))
      .filter((h) => Array.isArray(h.embedding) && h.embedding.length > 0);
    await savePostHistory(history);
  } catch {
    // swallow: memory is a best-effort quality aid, not part of the publish contract
  }

  return { published: built.length, slotsConsidered: canonical.size, preview, posts };
}
