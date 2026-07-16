export const meta = {
  name: 'inspect-tweet-pipeline',
  description: 'Multi-agent quality inspection of the Ticker tweet pipeline: judge sampled tweets against their sources, review account histories, synthesize a report',
  whenToUse: 'Invoked by the /inspect-tweet-pipeline skill with the sample pack from scripts/pipeline_health.ts --sample as args',
  phases: [
    { title: 'Judge', detail: 'tweet judges + account reviewers in parallel' },
    { title: 'Synthesize', detail: 'one agent writes the report' },
  ],
};

// args = { health, tweets: [...], accounts: [...] } from pipeline_health.ts --sample.
// Some harness paths deliver args as a JSON STRING - parse defensively (a string
// makes every property undefined and the judges silently receive nothing).
const input = typeof args === 'string' ? JSON.parse(args) : (args ?? {});

const RUBRIC = `
You are judging posts from Ticker, an anti-hype research feed. Its ethos INVERTS
normal social media: hedged-and-sourced beats bold-and-clean; "we don't know" is a
feature; every post may only reword the SOURCE text it was given. Calibration:
- grounding (0-5): every claim traceable to the source text. Any invented number,
  name, or strengthened claim caps this at 1.
- hedges (0-5): the source's uncertainty language survives ("estimate", "management's
  framing", "not yet filed"). Upgraded certainty = low score.
- insight (0-5): does it tell a reader something mechanism-revealing or
  decision-relevant (5), or is it a number-dump / generic filler a reader learns
  nothing from (0-1)? Punchy-but-empty scores LOW. Honest-but-revealing scores HIGH.
- voice (0-5): matches the account's persona card and reads distinct, human, unforced.
- compliance (pass/fail): FAIL on any buy/sell/hold language, price target, market
  cap, P&L, valuation multiple, or bullish/bearish advice framing.
- verdict: useful | neutral | useless, with a one-line why in plain language.
Do not reward hype. Do not punish hedging. Judge ONLY against the provided source
text and voice - use no outside knowledge about the companies.`;

const TWEET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          account: { type: 'string' },
          grounding: { type: 'number' },
          hedges: { type: 'number' },
          insight: { type: 'number' },
          voice: { type: 'number' },
          compliance: { type: 'string', enum: ['pass', 'fail'] },
          verdict: { type: 'string', enum: ['useful', 'neutral', 'useless'] },
          why: { type: 'string', description: 'one plain-language line' },
        },
        required: ['id', 'account', 'grounding', 'hedges', 'insight', 'voice', 'compliance', 'verdict', 'why'],
      },
    },
  },
  required: ['verdicts'],
};

const ACCOUNT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reviews: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          handle: { type: 'string' },
          grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
          repetition: { type: 'string', enum: ['none', 'some', 'heavy'], description: 'do its posts repeat the same take?' },
          voiceConsistent: { type: 'boolean' },
          weekReadsCoherent: { type: 'boolean', description: 'do the posts together form a sensible thread of thought?' },
          staleness: { type: 'string', enum: ['fresh', 'aging', 'stale'], description: 'is it visibly recycling the same source material?' },
          standout: { type: 'string', description: 'best post, quoted fragment + why, one line' },
          weakest: { type: 'string', description: 'weakest post, quoted fragment + why, one line' },
          notes: { type: 'string', description: '2-3 plain-language sentences' },
        },
        required: ['handle', 'grade', 'repetition', 'voiceConsistent', 'weekReadsCoherent', 'staleness', 'standout', 'weakest', 'notes'],
      },
    },
  },
  required: ['reviews'],
};

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const tweetPrompt = (group) => `${RUBRIC}

Judge each of these ${group.length} Ticker posts. For each you get the post body, the
SOURCE text it was allowed to reword, its tier, and the account's voice card.
Score strictly per the rubric. Return one verdict per post via StructuredOutput.

${JSON.stringify(group, null, 1)}`;

const acctPrompt = (group) => `${RUBRIC}

You are reviewing the last ~5 days of posting for ${group.length} Ticker account(s).
For each account you get its voice card, its posts (newest last), and the source
material those posts drew from. Assess: repetition across the posts, voice
consistency, whether the days read as a coherent thread, and staleness (recycling).
Quote fragments for standout/weakest. Grade A-F where C = readable but forgettable.
Return one review per account via StructuredOutput.

${JSON.stringify(group, null, 1)}`;

phase('Judge');
if (!(input.tweets ?? []).length) throw new Error('args.tweets is empty - pass the pipeline_health.ts --sample JSON as args');
const tweetGroups = chunk(input.tweets, Math.ceil(input.tweets.length / 2) || 1);
const acctGroups = chunk(input.accounts ?? [], 2);
const results = await parallel([
  ...tweetGroups.map((g, i) => () => agent(tweetPrompt(g), { label: `tweets:${i + 1}`, phase: 'Judge', schema: TWEET_SCHEMA })),
  ...acctGroups.map((g, i) => () => agent(acctPrompt(g), { label: `accounts:${i + 1}`, phase: 'Judge', schema: ACCOUNT_SCHEMA })),
]);
const verdicts = results.filter(Boolean).flatMap((r) => r.verdicts ?? []);
const reviews = results.filter(Boolean).flatMap((r) => r.reviews ?? []);
log(`judged ${verdicts.length} tweets, reviewed ${reviews.length} accounts`);

phase('Synthesize');
const report = await agent(
  `Write the /inspect-tweet-pipeline report for the user (Vic). Plain, simple language;
no em dashes; scannable; honest. He wants a BRIEF chat report. Use EXACTLY this shape:

## Tweet pipeline inspection - <use health.now date>

**Verdict: <🟢 healthy / 🟡 degraded / 🔴 broken> · quality grade <A-F>**
(one sentence justifying each)

### Pipeline health (deterministic)
(compact table from the health JSON: volume/day vs band, spacing, freshness, ship
rate + top drops, plan stability, dupes. Then the pre-computed flags verbatim as
bullets - do NOT soften them; if none, say "no flags".)

### Tweet quality (n=${verdicts.length} sampled)
(avg scores one line; verdict split useful/neutral/useless; then the single BEST
tweet - quote a fragment + why - and the single WORST - fragment + why. If any
compliance FAIL, put it first in bold.)

### Account histories (n=${reviews.length} reviewed)
(one line per account: handle, grade, the one thing to know. Call out any 'heavy'
repetition or 'stale' staleness explicitly.)

### Actions
(3-5 bullets max, concrete, ordered by value. Distinguish "engine/config" actions
from "content/vault re-export" actions.)

DATA:
health = ${JSON.stringify(input.health)}
tweetVerdicts = ${JSON.stringify(verdicts)}
accountReviews = ${JSON.stringify(reviews)}

Return ONLY the report markdown - it will be shown to the user verbatim.`,
  { label: 'synthesis', phase: 'Synthesize' },
);

return { report, verdicts, reviews };
