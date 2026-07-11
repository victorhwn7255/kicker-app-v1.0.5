import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  AccountSchema,
  PostSchema,
  SourceSectionSchema,
  type Account,
  type Post,
  type SourceSection,
} from '@/lib/types';
import type { Candidate } from './types';

/**
 * Engine-side DB access. The engine is a privileged backend process, so it reads
 * via the admin (secret-key) client and does not depend on the app's unstable_cache
 * loaders - that keeps it usable from a plain Node context too. It reads the source
 * reservoir + accounts + posts, and writes dry-run candidates to the review table.
 */
async function loadAll<T>(table: string, schema: z.ZodType<T>): Promise<T[]> {
  const { data, error } = await supabaseAdmin().from(table).select('obj:data').order('seq');
  if (error) throw new Error(`engine: failed to load ${table}: ${error.message}`);
  return z.array(schema).parse((data ?? []).map((r) => (r as { obj: unknown }).obj));
}

export const loadAccounts = () => loadAll<Account>('accounts', AccountSchema);
export const loadPosts = () => loadAll<Post>('posts', PostSchema);
export const loadSources = () => loadAll<SourceSection>('sources', SourceSectionSchema);

function candidateRow(c: Candidate) {
  return {
    id: `${c.engineRunId}::${c.account}::${c.sourceId}::${c.trigger}::${c.laneKey}`,
    engine_run_id: c.engineRunId,
    account: c.account,
    source_id: c.sourceId,
    trigger: c.trigger,
    body: c.body,
    tier: c.tier,
    qualifier: c.qualifier ?? null,
    char_len: c.charLen,
    model: c.model,
    provider: c.provider,
    prompt_version: c.promptVersion,
    guard_score: c.guardScore,
    verdict: c.verdict,
    verdict_pass: c.verdictPass,
    novelty_similarity: c.noveltySimilarity,
    status: c.status,
    dropped_reason: c.droppedReason ?? null,
  };
}

/** Idempotent: candidate ids are deterministic per run, so a re-run overwrites. */
export async function saveCandidates(candidates: Candidate[]): Promise<void> {
  if (!candidates.length) return;
  const { error } = await supabaseAdmin()
    .from('engine_candidates')
    .upsert(candidates.map(candidateRow), { onConflict: 'id' });
  if (error) throw new Error(`engine: failed to save candidates: ${error.message}`);
}
