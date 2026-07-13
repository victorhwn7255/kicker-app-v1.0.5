import { generateText, generateObject, embedMany } from 'ai';
import type { LanguageModel } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { z } from 'zod';
import { type ModelLane, type Provider, GUARD, EMBEDDING, USER_AGENT } from './config';

/**
 * The model layer: every call to a hosted model goes through here, behind the
 * Vercel AI SDK, so a provider swap is a config change. Groq requests carry a
 * browser User-Agent (Groq 403s default Node UAs). Providers are memoized and
 * read their keys from env lazily, so importing this module never requires keys
 * (unit tests mock at a higher layer and never construct a real provider).
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (needed for a live model call).`);
  return v;
}

let _groq: ReturnType<typeof createGroq> | null = null;
let _google: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let _nim: ReturnType<typeof createOpenAICompatible> | null = null;
let _openrouter: ReturnType<typeof createOpenAICompatible> | null = null;

function groq() {
  if (!_groq)
    _groq = createGroq({ apiKey: required('GROQ_API_KEY'), headers: { 'User-Agent': USER_AGENT } });
  return _groq;
}
function google() {
  if (!_google) _google = createGoogleGenerativeAI({ apiKey: required('GOOGLE_GENERATIVE_AI_API_KEY') });
  return _google;
}
function nim() {
  if (!_nim)
    _nim = createOpenAICompatible({
      name: 'nim',
      baseURL: required('MODEL_BASE_URL'),
      apiKey: required('MODEL_API_KEY'),
      headers: { 'User-Agent': USER_AGENT },
      // NVIDIA's endpoint accepts response_format json_schema (probed 2026-07-13);
      // without this flag the SDK silently skips it and generateObject fails.
      supportsStructuredOutputs: true,
    });
  return _nim;
}
function openrouter() {
  if (!_openrouter)
    _openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
      apiKey: required('OPENROUTER_API_KEY'),
      headers: { 'User-Agent': USER_AGENT },
    });
  return _openrouter;
}

function modelFor(provider: Provider, modelId: string): LanguageModel {
  switch (provider) {
    case 'groq':
      return groq()(modelId);
    case 'google':
      return google()(modelId);
    case 'nim':
      return nim()(modelId);
    case 'openrouter':
      return openrouter()(modelId);
  }
}

/** Groq reasoning models: think at low effort, and keep thinking OUT of the answer. */
function providerOptions(lane: ModelLane) {
  if (lane.provider === 'groq' && lane.reasoning) {
    return { groq: { reasoningEffort: 'low', reasoningFormat: 'parsed' } };
  }
  return undefined;
}

export interface GenResult {
  text: string;
  finishReason: string;
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined;
}

/** Free-text generation on a lane (the generator step). */
export async function generate(
  lane: ModelLane,
  args: { system: string; prompt: string; signal?: AbortSignal },
): Promise<GenResult> {
  const res = await generateText({
    model: modelFor(lane.provider, lane.modelId),
    system: args.system,
    prompt: args.prompt,
    temperature: lane.temperature,
    maxOutputTokens: lane.maxOutputTokens,
    maxRetries: 2,
    abortSignal: args.signal,
    providerOptions: providerOptions(lane),
  });
  return { text: res.text.trim(), finishReason: res.finishReason, usage: res.usage };
}

/** Structured generation on a lane (the verifier step). Temperature 0. */
export async function generateStructured<T>(
  lane: ModelLane,
  args: { system: string; prompt: string; schema: z.ZodType<T>; signal?: AbortSignal },
): Promise<T> {
  const res = await generateObject({
    model: modelFor(lane.provider, lane.modelId),
    schema: args.schema,
    system: args.system,
    prompt: args.prompt,
    temperature: 0,
    maxOutputTokens: lane.maxOutputTokens,
    maxRetries: 2,
    abortSignal: args.signal,
    providerOptions: providerOptions(lane),
  });
  return res.object;
}

/**
 * Prompt-injection score for one chunk, in [0,1]. The classifier returns the
 * jailbreak probability as its completion; we parse it. A parse failure throws
 * so the caller can fail-safe (quarantine), never silently pass.
 */
export async function guardScore(chunk: string, signal?: AbortSignal): Promise<number> {
  const res = await generateText({
    model: groq()(GUARD.modelId),
    prompt: chunk,
    temperature: 0,
    maxOutputTokens: 10,
    maxRetries: 2,
    abortSignal: signal,
  });
  const score = Number.parseFloat(res.text.trim());
  if (Number.isNaN(score)) {
    throw new Error(`Prompt guard returned a non-numeric score: ${JSON.stringify(res.text)}`);
  }
  return score;
}

/** Embed a batch of texts for the novelty gate. */
export async function embedTexts(values: string[], signal?: AbortSignal): Promise<number[][]> {
  if (values.length === 0) return [];
  const { embeddings } = await embedMany({
    model: google().embeddingModel(EMBEDDING.modelId),
    values,
    maxRetries: 2,
    abortSignal: signal,
  });
  return embeddings;
}
