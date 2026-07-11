export const meta = {
  name: 'phase4-review',
  description: 'Adversarial review of Phase 4 (Supabase DB, RLS, seed, async loader refactor)',
  phases: [
    { title: 'Review', detail: 'parallel dimension reviewers read the Phase 4 code' },
    { title: 'Verify', detail: 'adversarially verify each finding' },
  ],
};

const ROOT = '/Users/victor_he/Projects/kicker-app';

const CONTEXT = `
Project "Ticker": Next.js 15 App Router + Supabase. Phase 4 swapped JSON fixtures for
Supabase while the app must render IDENTICALLY to before (Phase 3 E2E is the oracle).

Key design:
- New Supabase API keys: publishable (RLS-respecting reads) + secret (bypasses RLS, seed/engine).
- Each content table has typed/queryable columns PLUS a \`data\` jsonb holding the full validated
  object; loaders read \`data\` and zod-parse it. \`seq\` preserves fixture order.
- RLS on for all tables. Public read policy on accounts/posts/kill_list/tripwires/wiki_pages.
  sources/post_history/users/follows/subscriptions have RLS on with NO policy (private).
- content.ts loaders are async, wrapped in unstable_cache (revalidate 300, tagged).
- Ingestion path: src/lib/fixtures.ts reads /content files -> validator + seed use it.
- Already verified live: E2E 13/13 green on prod build, seed idempotent (exact row counts),
  RLS live check passes (anon read ok, anon write blocked 42501, sources not anon-readable).

Files to review (read them with absolute paths under ${ROOT}):
- supabase/migrations/0001_init.sql
- src/lib/supabase/{env.ts,read.ts,admin.ts,database.types.ts}
- src/lib/content.ts
- src/lib/fixtures.ts
- scripts/{db-migrate.ts,seed.ts,verify-rls.ts,validate-content.ts}
- src/app/feed/page.tsx, src/app/page.tsx, src/app/u/[handle]/page.tsx,
  src/app/p/[postId]/{page.tsx,ReceiptPanel.tsx}, src/app/research/[slug]/page.tsx,
  src/app/tripwires/page.tsx, src/app/feed/RightRail.tsx

Report ONLY real defects: security holes, data-loss/round-trip mismatches, idempotency bugs,
missed sync->async conversions, N+1s, cache/ISR footguns, "renders differently than Phase 3"
risks. Do NOT report style nits or speculative hardening. Every finding must name a concrete
failure: inputs/state -> wrong outcome.
`;

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'file', 'severity', 'failure'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          failure: { type: 'string', description: 'concrete inputs/state -> wrong outcome' },
          fix: { type: 'string' },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['real', 'reason'],
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
  },
};

const DIMENSIONS = [
  { key: 'rls-security', prompt: 'Focus: RLS & secret handling. Is any private table (sources, post_history, users, follows, subscriptions) reachable by the publishable/anon key? Does any PUBLIC content loader accidentally use the admin/secret client, or vice-versa? Could the secret key reach the browser bundle? Are the grants and policies in 0001_init.sql actually sufficient AND not over-permissive (e.g. an unintended write path)? Check read.ts/admin.ts/content.ts/0001_init.sql.' },
  { key: 'seed-idempotency', prompt: 'Focus: seed + migration correctness. FK insert order, upsert onConflict targets match each PK, every column mapped matches the table definition in 0001_init.sql (wrong/missing column, NOT NULL violations, check-constraint violations for kind/tier/verdict/status/variant). Does the full validated object survive round-trip in \`data\`? Any way a re-run duplicates or corrupts rows? Check scripts/seed.ts vs supabase/migrations/0001_init.sql.' },
  { key: 'async-refactor', prompt: 'Focus: the sync->async loader conversion. Any consumer still using a loader result as a sync array/object (would be a bug even if tsc passed via inference)? Is receipt resolution (resolvePostResearchSection / resolveReceiptHref / attachReceipts) behaviorally identical to Phase 3? Any N+1 DB access in a map? Are generateStaticParams / notFound paths correct? Check content.ts and the consumer pages.' },
  { key: 'render-fidelity', prompt: 'Focus: "renders identically to Phase 3". Does ordering (seq) reproduce fixture order everywhere the app depends on it (feed, explore, tripwire grouping, kill-list)? Could the DB path drop or reshape any field the components read (compare zod schemas in types.ts usage)? Any place the DB returns null/undefined where the fixture path returned a value? Check content.ts, seed.ts, feed/page.tsx, tripwires/page.tsx.' },
  { key: 'cache-isr', prompt: 'Focus: unstable_cache + ISR. Are cache keyParts/args/tags correct (no cross-key collisions, args included in key for getAccount/getResearchPage/getResearchPage)? Any stale-data or cache-poisoning footgun? Is caching the admin (sources) read acceptable? Do revalidate values + tags give a correct Phase-5 revalidateTag hook? Any error-caching bug (throwing inside unstable_cache)? Check content.ts.' },
];

phase('Review');
const results = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(`${CONTEXT}\n\nYour review dimension: ${d.key}.\n${d.prompt}\n\nRead the files, then return findings.`, {
      label: `review:${d.key}`,
      phase: 'Review',
      schema: FINDINGS_SCHEMA,
    }),
  (review, d) =>
    parallel(
      (review?.findings ?? []).map((f) => () =>
        agent(
          `${CONTEXT}\n\nAdversarially verify this claimed defect. Read the cited file(s) and try to REFUTE it. Default real=false unless you can name the concrete failing input/state and confirm the code actually does the wrong thing.\n\nClaim: ${f.title}\nFile: ${f.file}${f.line ? ':' + f.line : ''}\nStated failure: ${f.failure}`,
          { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICT_SCHEMA },
        ).then((v) => ({ ...f, verdict: v })),
      ),
    ),
);

const confirmed = results
  .flat()
  .filter(Boolean)
  .filter((f) => f.verdict?.real)
  .sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.verdict.severity ?? a.severity] ?? 4) - (order[b.verdict.severity ?? b.severity] ?? 4);
  });

log(`Confirmed ${confirmed.length} finding(s) after adversarial verification.`);
return { confirmed };
