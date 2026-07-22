import { describe, it, expect } from 'vitest';
import { checkCompliance } from './compliance';

describe('checkCompliance (always-on deterministic advice backstop)', () => {
  // PRECISION: legitimate financial reporting must never trip the gate. These mirror
  // real phrasings from the live reservoir (dollar figures, percentages, plain verbs).
  const ALLOWED = [
    'Broadcom guarantees the lease with a disclosed maximum exposure of $29 billion, per its filing.',
    'S&P models 70-90% loss-given-default on GPU-cloud unsecured debt, the filing notes.',
    'The company said the new fuel outperforms the prior grade in its qualification tests.',
    'Management is carrying an overweight cash position into the quarter, per the call.',
    'A $3.3 billion buyback was announced alongside the results.',
    'Selling pressure hit the sector after the print, the desk observed.',
    'The analyst expects margins to hold, though they flagged that as still uncertain.',
  ];

  // RECALL on the unambiguous advice constructions the gate exists to stop.
  const BLOCKED: [string, string][] = [
    ['We are bullish on the datacenter build-out here.', 'bullish/bearish framing'],
    ['The setup looks bearish into earnings.', 'bullish/bearish framing'],
    ['Their price target implies plenty of upside.', 'price target'],
    ['The desk moved it to a strong buy this morning.', 'analyst rating (strong buy/sell)'],
    ['They slapped an overweight rating on the name.', 'analyst rating (over/underweight)'],
    ['You should buy this before the print.', 'direct advice'],
    ['Buy it now while it is cheap.', 'buy/sell instruction'],
    ['Sell the shares into the rally.', 'buy/sell instruction'],
    ['The note set a fresh price-target of 200.', 'price target'],
    ['The firm now rates it a buy.', 'analyst rating'],
    ['They rated a hold on the name.', 'analyst rating'],
    ['Analysts recommend buying ahead of the split.', 'recommendation'],
    ['He recommends a sell here.', 'recommendation'],
    ['Traders were told to sell the rally.', 'buy/sell instruction'],
  ];

  for (const body of ALLOWED) {
    it(`allows: ${body.slice(0, 48)}...`, () => {
      expect(checkCompliance(body).ok).toBe(true);
    });
  }

  for (const [body, label] of BLOCKED) {
    it(`blocks (${label}): ${body.slice(0, 40)}...`, () => {
      const r = checkCompliance(body);
      expect(r.ok).toBe(false);
      expect(r.label).toBe(label);
    });
  }
});
