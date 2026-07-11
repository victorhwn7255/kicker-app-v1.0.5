import type { Account, SourceSection, Post } from '@/lib/types';
import type { PlanItem, TriggerType } from './types';

/**
 * The planner is deterministic code, never a model call. It decides WHICH account
 * writes about WHICH source under WHICH trigger; the model only supplies wording.
 *
 * Trigger priority (highest first):
 *   1. ingest       a source with no post referencing it yet (fresh vault content)
 *   2. event        an external peg (earnings date, anniversary) - hook only; no
 *                   event feed in the fixtures, so it never fires here
 *   3. conversation a sibling in this account's supply_chain posted recently, so
 *                   this account can reply
 *   4. rotation     least-recently-used source, to keep quiet accounts alive
 *
 * Frequency cap scales with reservoir size: an account with more approved sources
 * may appear more often in a batch. With one source per account (fixtures) the cap
 * is one, which is exactly what we want for the dry-run.
 */

/** A post "references" a source when its source string names the section. */
function postReferencesSource(post: Post, source: SourceSection): boolean {
  const section = post.source.split('/').pop()?.trim().toLowerCase() ?? '';
  return section === source.section_title.toLowerCase();
}

/** Cap on how many posts an account may get in one batch, from its reservoir depth. */
export function frequencyCap(sourceCount: number): number {
  if (sourceCount <= 0) return 0;
  return Math.max(1, Math.ceil(sourceCount / 2));
}

/**
 * Pre-select the single most important fact so the model can't bury it (a model
 * once named Microsoft zero times in a source where it was 67% of revenue).
 * Heuristic: the first sentence carrying a quantity ($/%/number), else the first
 * sentence. Deterministic, no model.
 */
export function selectKeyFact(source: SourceSection): string {
  const sentences = source.body_text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return source.body_text.trim();
  const quantitative = sentences.find((s) => /\$|%|\d/.test(s));
  return quantitative ?? sentences[0];
}

/** Most recent post time is unknown in fixtures; we approximate LRU by array order. */
function leastRecentlyUsed(sources: SourceSection[], posts: Post[]): SourceSection {
  const usedTitles = new Set(posts.map((p) => p.source.split('/').pop()?.trim().toLowerCase()));
  const unused = sources.find((s) => !usedTitles.has(s.section_title.toLowerCase()));
  return unused ?? sources[0];
}

export function planBatch(input: {
  accounts: Account[];
  sources: SourceSection[];
  posts: Post[];
  batchSize?: number;
}): PlanItem[] {
  const { accounts, sources, posts } = input;
  const batchSize = input.batchSize ?? Infinity;
  const accountByHandle = new Map(accounts.map((a) => [a.handle, a]));
  const sourcesByAccount = new Map<string, SourceSection[]>();
  for (const s of sources) {
    if (!sourcesByAccount.has(s.account)) sourcesByAccount.set(s.account, []);
    sourcesByAccount.get(s.account)!.push(s);
  }
  const recentPostByHandle = new Map<string, Post>();
  for (const p of posts) if (!recentPostByHandle.has(p.handle)) recentPostByHandle.set(p.handle, p);

  const plan: PlanItem[] = [];

  for (const [handle, accountSources] of sourcesByAccount) {
    const account = accountByHandle.get(handle);
    if (!account) continue;
    const cap = frequencyCap(accountSources.length);
    let used = 0;

    // 1. ingest: sources nothing has posted about yet.
    for (const source of accountSources) {
      if (used >= cap) break;
      const referenced = posts.some((p) => postReferencesSource(p, source));
      if (!referenced) {
        plan.push(item(handle, source, 'ingest'));
        used++;
      }
    }

    // 4. rotation: fill the remaining cap with the LRU source.
    while (used < cap) {
      const source = leastRecentlyUsed(accountSources, posts);
      plan.push(item(handle, source, 'rotation'));
      used++;
    }
  }

  // 3. conversation: an account whose supply_chain names a sibling that posted
  // recently may reply to it. One per batch keeps threads legible.
  for (const account of accounts) {
    const sibling = (account.supply_chain ?? []).find((h) => recentPostByHandle.has(h));
    const own = sourcesByAccount.get(account.handle)?.[0];
    if (sibling && own) {
      plan.push({ ...item(account.handle, own, 'conversation'), replyToHandle: sibling });
      break;
    }
  }

  return plan.slice(0, batchSize);
}

function item(handle: string, source: SourceSection, trigger: TriggerType): PlanItem {
  return { account: handle, sourceId: source.id, trigger, keyFact: selectKeyFact(source) };
}
