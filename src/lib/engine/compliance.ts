/**
 * The always-on compliance backstop on a generated post body.
 *
 * Ticker's editorial rule is "describe, never recommend": no buy/sell/hold advice,
 * no price targets, no bullish/bearish calls. The adversarial VERIFIER already
 * checks this - but the verifier is an optional model call that can be turned OFF
 * for free-tier throughput (VERIFIER_ENABLED=false, the current default). This gate
 * is deterministic (no model), costs nothing, and runs UNCONDITIONALLY in the
 * pipeline, so an advice phrase can never reach the feed even with no model in the
 * loop. It hardens EVERY account, not just the opinion-driven ones (@youtube-buzz).
 *
 * PRECISION over recall by design. It must never drop a legitimate financial FACT -
 * dollar figures ("$29 billion exposure"), percentages ("70-90% loss-given-default"),
 * or plain reporting that a stock "outperformed last quarter" are all valid content.
 * So it matches only unambiguous ADVICE constructions, calibrated to ZERO hits across
 * the current 132-account source reservoir. The verifier, the ingest-time
 * generate->verify pass, and the publish_ticker scrub remain the primary defenses;
 * this is the cheap deterministic floor beneath them.
 */

const ADVICE_PATTERNS: { re: RegExp; label: string }[] = [
  // Classic FinTwit advice framing. Zero legitimate uses in a "describe, don't
  // recommend" feed - the DDOG onboarding proved the model will emit "bullish" if
  // not stopped, so this is the hard stop.
  { re: /\b(bullish|bearish)\b/i, label: 'bullish/bearish framing' },
  // Price-target language (incl. the hyphenated "price-target").
  { re: /\bprice[- ]?target\b|\btarget price\b/i, label: 'price target' },
  // Analyst-style ratings, matched only in their unambiguous rating phrasing so the
  // plain English verbs ("the fuel outperforms", "an overweight position in cash")
  // do not false-positive.
  { re: /\bstrong (buy|sell)\b/i, label: 'analyst rating (strong buy/sell)' },
  { re: /\b(over|under)weight\s+rating\b/i, label: 'analyst rating (over/underweight)' },
  { re: /\brate[sd]?\s+(?:it\s+)?(?:a\s+)?(buy|sell|hold)\b/i, label: 'analyst rating' },
  // Explicit recommendation verb + a buy/sell/hold action.
  { re: /\brecommend(?:s|ed|ing)?\s+(?:a\s+)?(buy|sell|buying|selling|hold|holding)\b/i, label: 'recommendation' },
  // Direct second-person advice.
  { re: /\byou\s+should\s+(buy|sell|hold|own|avoid|short|dump|load\s+up)\b/i, label: 'direct advice' },
  // Imperative buy/sell instructions (verb + an object/urgency word), which a bare
  // "buyback"/"buy-side"/"selling pressure" mention will not match.
  {
    re: /\b(buy|sell|short|accumulate)\s+(it|this|now|here|the\s+(stock|shares|dip|rally|bounce)|shares)\b/i,
    label: 'buy/sell instruction',
  },
];

export interface ComplianceResult {
  ok: boolean;
  /** The human-readable label of the first pattern that matched (for the drop reason). */
  label?: string;
}

/** Returns { ok:false, label } on the first advice-language match, else { ok:true }. */
export function checkCompliance(body: string): ComplianceResult {
  for (const { re, label } of ADVICE_PATTERNS) {
    if (re.test(body)) return { ok: false, label };
  }
  return { ok: true };
}
