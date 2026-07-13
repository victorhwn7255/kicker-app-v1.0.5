import { z } from 'zod';
import { TierSchema, type Tier } from '@/lib/types';
import type { LaneKey } from './config';

/** What made the planner pick this account now. */
export type TriggerType = 'ingest' | 'event' | 'conversation' | 'rotation';

/**
 * The verifier's structured verdict. This is the safety mechanism, not a
 * formality: the pipeline is fail-closed, so a candidate ships only when every
 * safety field is satisfied (see verdictPasses). Booleans are phrased so the
 * verifier answers plainly; `invented_numbers` / `buy_sell_language` are true
 * when something BAD is present.
 */
export const VerdictSchema = z.object({
  /** Every factual claim traces to the provided source text or the persona bio. */
  claims_traceable: z.boolean(),
  /** Hedges/uncertainty in the source are preserved (trivially true if none). */
  hedges_preserved: z.boolean(),
  /** A number appears that is NOT in the source (fabrication). */
  invented_numbers: z.boolean(),
  /** Buy/sell/price-target/bullish-bearish advice language is present. */
  buy_sell_language: z.boolean(),
  /** The post speaks ABOUT its subject in the account's voice, never AS the wrong entity. */
  persona_identity_ok: z.boolean(),
  /** Specific offending fragments, for the human review log. */
  offending_claims: z.array(z.string()),
  /** One-line rationale. */
  reasoning: z.string(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

/** Fail-closed: pass only when all safety conditions hold. Any doubt = drop. */
export function verdictPasses(v: Verdict): boolean {
  return (
    v.claims_traceable &&
    v.hedges_preserved &&
    !v.invented_numbers &&
    !v.buy_sell_language &&
    v.persona_identity_ok
  );
}

/** Result of screening a source through the prompt-injection classifier. */
export interface GuardResult {
  flagged: boolean;
  maxScore: number;
  chunkScores: number[];
}

/** A deterministic planning decision: which account/source/trigger to write now. */
export interface PlanItem {
  account: string; // handle, e.g. "@CRWV"
  sourceId: string;
  trigger: TriggerType;
  /** The single most important fact, pre-selected so the model can't bury it. */
  keyFact: string;
  /** For the conversation trigger: the sibling post being answered. */
  replyToHandle?: string;
  quotePostId?: string;
  /** Daily-mode: when this post should go live (ISO, inside the plan's UTC day). */
  scheduledAt?: string;
}

export type CandidateStatus = 'verified' | 'quarantined' | 'dropped';

/**
 * One pipeline outcome for one (source, model). Every candidate is recorded -
 * verified, dropped, or quarantined - so the human review sees what shipped AND
 * what the gates caught, with the reason.
 */
export interface Candidate {
  engineRunId: string;
  account: string;
  sourceId: string;
  trigger: TriggerType;
  /** For conversation replies: the handle this post replies to. */
  replyTo?: string;
  laneKey: LaneKey;
  model: string;
  provider: string;
  promptVersion: string;
  body: string;
  tier: Tier;
  qualifier?: string;
  charLen: number;
  guardScore: number | null;
  verdict: Verdict | null;
  verdictPass: boolean;
  noveltySimilarity: number | null;
  status: CandidateStatus;
  attempts: number;
  droppedReason?: string;
  /** Daily-mode: the slot this candidate is scheduled to fill (ISO). */
  scheduledAt?: string;
}

/** Summary returned by a dry-run tick. */
export interface EngineRunResult {
  runId: string;
  dryRun: boolean;
  planned: number;
  verified: number;
  dropped: number;
  quarantined: number;
  candidates: Candidate[];
}

/** DB row shape for a stored candidate (engine_candidates). Model is hidden in blind review. */
export const CandidateRowSchema = z.object({
  id: z.string(),
  engine_run_id: z.string(),
  account: z.string(),
  source_id: z.string().nullable(),
  trigger: z.string().nullable(),
  body: z.string(),
  tier: TierSchema,
  qualifier: z.string().nullable(),
  char_len: z.number(),
  model: z.string(),
  provider: z.string(),
  prompt_version: z.string(),
  guard_score: z.number().nullable(),
  verdict: z.unknown().nullable(),
  verdict_pass: z.boolean(),
  novelty_similarity: z.number().nullable(),
  status: z.string(),
  dropped_reason: z.string().nullable(),
  reviewer_rating: z.number().nullable(),
  reviewer_note: z.string().nullable(),
  scheduled_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type CandidateRow = z.infer<typeof CandidateRowSchema>;
