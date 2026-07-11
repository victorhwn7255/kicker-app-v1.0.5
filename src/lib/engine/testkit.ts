import type { Account, SourceSection, Post } from '@/lib/types';
import type { EngineDeps } from './deps';
import type { Verdict } from './types';

/**
 * Test fixtures + a mock EngineDeps. Not a *.test.ts file, so vitest does not run
 * it as a suite; it is imported by the suites. The mock lets the whole pipeline be
 * exercised deterministically with zero live model calls.
 */
export function makeAccount(over: Partial<Account> = {}): Account {
  return {
    handle: '@CRWV',
    kind: 'company',
    desc: 'a company',
    bio: 'I am a single-tenant AI datacenter landlord.',
    persona_card: { voice: 'dry, precise', constraints: ['never advise', 'keep hedges'] },
    ...over,
  };
}

export function makeSource(over: Partial<SourceSection> = {}): SourceSection {
  return {
    id: 'src-1',
    account: '@CRWV',
    section_title: 'Customer concentration',
    body_text:
      'Colocation revenue is 100% attributable to a single customer, financed by a $3.3B project bond at 7.75%.',
    tier: 'solid',
    qualifier: 'from the 10-K',
    vault_ref: 'CRWV 10-K / customer concentration',
    ...over,
  };
}

export function makePost(over: Partial<Post> = {}): Post {
  return {
    id: 'p1',
    handle: '@CRWV',
    kind: 'company',
    time: '1h',
    body: 'One customer is the whole business.',
    tier: 'solid',
    source: 'CRWV / customer concentration',
    freshness: 'verified 1d ago',
    ...over,
  };
}

export const PASS_VERDICT: Verdict = {
  claims_traceable: true,
  hedges_preserved: true,
  invented_numbers: false,
  buy_sell_language: false,
  persona_identity_ok: true,
  offending_claims: [],
  reasoning: 'grounded',
};

/** A body guaranteed inside the 400-600 length window. */
export function validBody(len = 500): string {
  const base = 'Colocation revenue is entirely one customer, financed by a project bond. ';
  return base.repeat(Math.ceil(len / base.length)).slice(0, len);
}

export function mockDeps(over: Partial<EngineDeps> = {}): EngineDeps {
  return {
    guardScore: async () => 0.0004,
    generate: async () => validBody(),
    verify: async () => PASS_VERDICT,
    embed: async (values) => values.map(() => [1, 0, 0]),
    ...over,
  };
}
