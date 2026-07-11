import { describe, it, expect } from 'vitest';
import { selectKeyFact, frequencyCap, planBatch } from './planner';
import { makeAccount, makeSource, makePost } from './testkit';

describe('selectKeyFact (so the model cannot bury the lede)', () => {
  it('prefers the sentence carrying a quantity', () => {
    const s = makeSource({ body_text: 'The pivot is real. Revenue was $77.5M last quarter. It matters.' });
    expect(selectKeyFact(s)).toContain('$77.5M');
  });
  it('falls back to the first sentence when there are no numbers', () => {
    const s = makeSource({ body_text: 'The narrative is shifting. Slowly.' });
    expect(selectKeyFact(s)).toBe('The narrative is shifting.');
  });
});

describe('frequencyCap (scales with reservoir size)', () => {
  it('is 0 for no sources', () => expect(frequencyCap(0)).toBe(0));
  it('is 1 for one source', () => expect(frequencyCap(1)).toBe(1));
  it('grows with the reservoir', () => expect(frequencyCap(4)).toBe(2));
});

describe('planBatch (deterministic trigger priority)', () => {
  it('picks ingest for a source nothing has posted about', () => {
    const plan = planBatch({ accounts: [makeAccount()], sources: [makeSource()], posts: [] });
    expect(plan[0].trigger).toBe('ingest');
    expect(plan[0].account).toBe('@CRWV');
    expect(plan[0].keyFact).toContain('$3.3B');
  });

  it('uses rotation when the source is already referenced', () => {
    const posts = [makePost({ source: 'CRWV / customer concentration' })];
    const plan = planBatch({ accounts: [makeAccount()], sources: [makeSource()], posts });
    expect(plan.find((p) => p.account === '@CRWV')?.trigger).toBe('rotation');
  });

  it('emits a conversation reply when a supply_chain sibling posted recently', () => {
    const crwv = makeAccount({ handle: '@CRWV', supply_chain: ['@CORZ'] });
    const corz = makeAccount({ handle: '@CORZ' });
    const sources = [
      makeSource({ id: 's-crwv', account: '@CRWV' }),
      makeSource({ id: 's-corz', account: '@CORZ', section_title: 'Financials' }),
    ];
    const posts = [makePost({ handle: '@CORZ', source: 'CORZ / financials' })];
    const plan = planBatch({ accounts: [crwv, corz], sources, posts });
    const convo = plan.find((p) => p.trigger === 'conversation');
    expect(convo).toBeTruthy();
    expect(convo?.replyToHandle).toBe('@CORZ');
  });

  it('respects the frequency cap', () => {
    const sources = [makeSource({ id: 'a' }), makeSource({ id: 'b', section_title: 'Debt' })];
    const plan = planBatch({ accounts: [makeAccount()], sources, posts: [] });
    const nonConvo = plan.filter((p) => p.account === '@CRWV' && p.trigger !== 'conversation');
    expect(nonConvo.length).toBe(1); // 2 sources -> cap 1
  });
});
