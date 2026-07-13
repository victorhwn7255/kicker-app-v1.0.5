import type { ModelLane } from './config';
import type { Verdict } from './types';
import { VerdictSchema } from './types';
import * as models from './models';

/**
 * The model seam. Every hosted-model call the pipeline makes goes through an
 * EngineDeps object, so unit tests inject a deterministic mock and the entire
 * planner -> guard -> generate -> verify -> novelty flow is provable with zero
 * live calls. liveDeps() is the only place that touches the real models.
 */
export interface EngineDeps {
  guardScore(chunk: string, signal?: AbortSignal): Promise<number>;
  generate(lane: ModelLane, a: { system: string; prompt: string; signal?: AbortSignal }): Promise<string>;
  verify(lane: ModelLane, a: { system: string; prompt: string; signal?: AbortSignal }): Promise<Verdict>;
  embed(values: string[], signal?: AbortSignal): Promise<number[][]>;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * A monotonic min-gap pacer: successive calls start at least `gapMs` apart, and
 * each slot is reserved SYNCHRONOUSLY (before any await) so overlapping callers
 * still space out. This is what holds verifier calls under the model's free-tier
 * tokens-per-minute pool: a candidate's regeneration loop can fire up to
 * (1 + MAX_REGENERATIONS) verify calls, and the runner only paces BETWEEN
 * candidates - so without this the verifier (a reasoning model on an 8k-TPM free
 * lane) bursts and 429s. verifierLane().pacingMs was declared but never applied
 * until this seam used it.
 */
function minGapPacer(): (gapMs: number) => Promise<void> {
  let nextAllowed = 0;
  return async (gapMs) => {
    if (gapMs <= 0) return;
    const now = Date.now();
    const start = Math.max(now, nextAllowed);
    nextAllowed = start + gapMs; // reserve synchronously, before the await below
    const wait = start - now;
    if (wait > 0) await sleep(wait);
  };
}

export function liveDeps(): EngineDeps {
  // One pacer per run (liveDeps is called once per runTick), so the verifier's
  // per-minute token budget is respected across every candidate in the run.
  const paceVerify = minGapPacer();
  return {
    guardScore: (chunk, signal) => models.guardScore(chunk, signal),
    generate: async (lane, a) => (await models.generate(lane, a)).text,
    verify: async (lane, a) => {
      await paceVerify(lane.pacingMs);
      try {
        return await models.generateStructured(lane, { ...a, schema: VerdictSchema });
      } catch (err) {
        // Some OpenAI-compatible hosts reject the SDK's structured-output plumbing
        // (or truncate mid-object) while happily returning plain JSON when asked.
        // Fall back to a raw-JSON request and validate with the same schema; a
        // parse failure re-throws, so the pipeline's fail-closed drop still holds.
        const out = await models.generate(lane, {
          system: a.system,
          prompt:
            `${a.prompt}\n\nRespond with ONLY one JSON object - no markdown fences, no prose - ` +
            `with exactly these keys: claims_traceable (boolean), hedges_preserved (boolean), ` +
            `invented_numbers (boolean), buy_sell_language (boolean), persona_identity_ok (boolean), ` +
            `offending_claims (array of strings), reasoning (string).`,
          signal: a.signal,
        });
        const raw = out.text;
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) throw err;
        return VerdictSchema.parse(JSON.parse(raw.slice(start, end + 1)));
      }
    },
    embed: (values, signal) => models.embedTexts(values, signal),
  };
}
