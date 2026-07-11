import { describe, it, expect } from 'vitest';
import { auditSourceAttribution, type Attribution } from './attribution';
import { makeAccount, makeSource } from './testkit';

const CLEAN: Attribution = { belongs: true, misattributed_facts: [], reasoning: 'own facts' };
const MISATTRIBUTED: Attribution = {
  belongs: false,
  misattributed_facts: ["colocation revenue is 100% one customer (the landlord's, not the tenant's)"],
  reasoning: 'these are the datacenter provider (CORZ) facts, false in the tenant CRWV first person',
};

describe('source attribution audit (the error class the verifier cannot catch)', () => {
  it('passes a source whose facts belong to the account', async () => {
    const v = await auditSourceAttribution(makeAccount(), makeSource(), async () => CLEAN);
    expect(v.belongs).toBe(true);
  });

  it("flags a source holding another entity's facts", async () => {
    const v = await auditSourceAttribution(
      makeAccount({ handle: '@CRWV', kind: 'company', bio: 'I am a datacenter tenant.' }),
      makeSource({ body_text: 'Colocation revenue is 100% attributable to a single customer.' }),
      async () => MISATTRIBUTED,
    );
    expect(v.belongs).toBe(false);
    expect(v.misattributed_facts.length).toBeGreaterThan(0);
  });

  it('gives the auditor the account identity and source in the prompt', async () => {
    let seen = '';
    await auditSourceAttribution(
      makeAccount({ handle: '@NVDA' }),
      makeSource({ section_title: 'Bandwidth' }),
      async (_system, prompt) => {
        seen = prompt;
        return CLEAN;
      },
    );
    expect(seen).toContain('@NVDA');
    expect(seen).toContain('Bandwidth');
  });
});
