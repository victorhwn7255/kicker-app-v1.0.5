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

export function liveDeps(): EngineDeps {
  return {
    guardScore: (chunk, signal) => models.guardScore(chunk, signal),
    generate: async (lane, a) => (await models.generate(lane, a)).text,
    verify: (lane, a) => models.generateStructured(lane, { ...a, schema: VerdictSchema }),
    embed: (values, signal) => models.embedTexts(values, signal),
  };
}
