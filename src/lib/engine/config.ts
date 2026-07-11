/**
 * Engine configuration. Model choice is config, never code: the lane registry
 * below holds sensible defaults (the models we A/B-tested), and every lane can be
 * overridden by an env var of the form "provider:model-id" (e.g.
 * MODEL_PRIMARY="groq:openai/gpt-oss-120b"). Switching a model or provider is
 * therefore an env change, not a code change.
 *
 * Lanes:
 *  - primary   the current favorite. A REASONING model (gpt-oss-120b): it needs
 *              reasoningEffort=low + a real token budget or the silent thinking
 *              eats the answer (a 59-char truncated post was observed).
 *  - secondary the A/B challenger on the same Groq quota-family (llama-3.3-70b).
 *  - fallback  a separate provider + separate quota pool (Gemini Flash).
 *  - premium   paid escape hatch (Groq paid / OpenRouter). Config-only: defined
 *              but pointed at the primary model until a human activates it.
 *  - guard     the prompt-injection classifier (llama-prompt-guard-2-86m).
 *
 * The three generation lanes have SEPARATE rate-limit pools, so the runner may
 * spread load across them; a batch slipping to the next day is acceptable.
 */
export type Provider = 'groq' | 'google' | 'nim' | 'openrouter';
export type LaneKey = 'primary' | 'secondary' | 'fallback' | 'premium';

export interface ModelLane {
  key: LaneKey;
  provider: Provider;
  modelId: string;
  /** Human label, shown only AFTER a blind review is revealed. */
  label: string;
  /** Token budget. Reasoning models need headroom for thinking + the answer. */
  maxOutputTokens: number;
  temperature: number;
  /** Reasoning model: pass reasoningEffort=low and separate thinking from output. */
  reasoning: boolean;
  /** Min gap between calls on this lane's pool (observed free-tier limits). */
  pacingMs: number;
}

const DEFAULT_LANES: Record<LaneKey, ModelLane> = {
  primary: {
    key: 'primary',
    provider: 'groq',
    modelId: 'openai/gpt-oss-120b',
    label: 'Groq gpt-oss-120b',
    maxOutputTokens: 1400, // reasoning headroom + a 400-600 char answer
    temperature: 0.6,
    reasoning: true,
    pacingMs: 45_000, // 8k tokens/min free lane -> ~45s between batches
  },
  secondary: {
    key: 'secondary',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    label: 'Groq llama-3.3-70b',
    maxOutputTokens: 700,
    temperature: 0.6,
    reasoning: false,
    pacingMs: 2_000, // 30 req/min
  },
  fallback: {
    key: 'fallback',
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    maxOutputTokens: 700,
    temperature: 0.6,
    reasoning: false,
    pacingMs: 4_000, // 15 req/min
  },
  premium: {
    key: 'premium',
    provider: 'groq',
    modelId: 'openai/gpt-oss-120b',
    label: 'Premium (escape hatch, inactive)',
    maxOutputTokens: 1400,
    temperature: 0.5,
    reasoning: true,
    pacingMs: 45_000,
  },
};

/** Parse a "provider:model-id" override; returns null if unset/malformed. */
function laneOverride(base: ModelLane, raw: string | undefined): ModelLane {
  if (!raw) return base;
  const idx = raw.indexOf(':');
  if (idx <= 0) return base;
  const provider = raw.slice(0, idx) as Provider;
  const modelId = raw.slice(idx + 1);
  if (!['groq', 'google', 'nim', 'openrouter'].includes(provider) || !modelId) return base;
  return { ...base, provider, modelId };
}

export function lane(key: LaneKey): ModelLane {
  const envKey = `MODEL_${key.toUpperCase()}`;
  return laneOverride(DEFAULT_LANES[key], process.env[envKey]);
}

/** The generation lanes the planner spreads work across (for the blind A/B). */
export const GENERATION_LANES: LaneKey[] = ['primary', 'secondary', 'fallback'];

/**
 * The verifier model. It must be independent of all three generation lanes AND
 * support Groq's `json_schema` structured output - which rules out llama-3.3-70b
 * (json_object only) and Gemini (too rate-limited to also verify). gpt-oss-20b is
 * json_schema-capable, fast, and distinct from every generator, so one fixed
 * verifier checks them all. Overridable via MODEL_VERIFIER="provider:model".
 */
export function verifierLane(): ModelLane {
  return laneOverride(
    {
      key: 'primary', // cosmetic; this lane is only used for verification calls
      provider: 'groq',
      modelId: 'openai/gpt-oss-20b',
      label: 'Groq gpt-oss-20b (verifier)',
      maxOutputTokens: 1400,
      temperature: 0,
      reasoning: true,
      pacingMs: 2000,
    },
    process.env.MODEL_VERIFIER,
  );
}

/** The prompt-injection classifier lane. Groq-hosted; ~512-token context. */
export const GUARD = {
  provider: 'groq' as Provider,
  modelId: 'meta-llama/llama-prompt-guard-2-86m',
  /** Score above this quarantines the source for human review (never a silent drop). */
  threshold: 0.5,
  /** Chunk size (chars) fed to the 512-token classifier window. */
  chunkChars: 1500,
};

/** Embeddings for the novelty gate. Groq has no embedding endpoint; Google does. */
export const EMBEDDING = {
  provider: 'google' as Provider,
  modelId: 'gemini-embedding-001',
};

/** Version stamped onto every candidate so provenance survives prompt edits. */
export const PROMPT_VERSION = 'p5.2026-07-11';

/**
 * Hard length gate, enforced in code. Floor is deliberately low (140) so posts
 * are "as long as the fact needs, no longer" - the old 400 floor forced padding
 * tails. Ceiling stays 600.
 */
export const LENGTH = { min: 140, max: 600 };

/** Candidates per (source, model). Generator produces this many, best passes win. */
export const CANDIDATES_PER_SOURCE = 2;

/** Cosine-similarity ceiling for the novelty gate (>= this = too similar, discard). */
export const NOVELTY_MAX_SIMILARITY = 0.9;

/** Lexical (Jaccard) ceiling for sibling dedup: near-identical candidates from the
 *  same source in one run collapse to one, so a run does not accumulate repeats. */
export const SIBLING_MAX_SIMILARITY = 0.6;

/** Regeneration attempts after a length/verifier failure before dropping (fail-closed). */
export const MAX_REGENERATIONS = 3;

/**
 * Browser-like User-Agent. Groq returns 403 to default Node/undefined UAs, so
 * every Groq request must carry one. Overridable via ENGINE_USER_AGENT.
 */
export const USER_AGENT =
  process.env.ENGINE_USER_AGENT ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** Master kill switch. The engine only ever leaves dry-run when this is true. */
export function engineEnabled(): boolean {
  return process.env.ENGINE_ENABLED === 'true';
}
