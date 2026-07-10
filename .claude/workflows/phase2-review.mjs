export const meta = {
  name: 'phase2-review',
  description: 'Adversarial review of the Ticker Phase 2 content layer (fidelity + schema/validator)',
  phases: [
    { title: 'Review', detail: 'content-fidelity and schema/validator dimensions' },
    { title: 'Verify', detail: 'confirm each finding against the source' },
  ],
};

const REPO = '/Users/victor_he/Projects/kicker-app';

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          area: { type: 'string' },
          file: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['area', 'file', 'severity', 'issue', 'evidence', 'fix'],
      },
    },
  },
  required: ['findings'],
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
    corrected_fix: { type: 'string' },
  },
  required: ['real', 'reason', 'corrected_fix'],
};

const DIMENSIONS = [
  {
    key: 'content-fidelity',
    prompt: `You audit the Ticker Phase 2 fixtures for content fidelity against a HARD product rule:
"No fact originates in this app - never invent a ticker, a number, or a claim." Sample content must be verbatim
from the design files.

Read the fixtures:
- ${REPO}/content/accounts.json, posts.json, kill-list.json, tripwires.json, sources.json
- ${REPO}/content/research/crwv.json
Compare against the design sources (the ONLY legitimate origin of facts):
- ${REPO}/design/README.md (the "Content" section)
- ${REPO}/design/wireframes/Component Library.dc.html (post bodies, kill-list, tripwire rows)
- ${REPO}/design/wireframes/Account Profile.dc.html (@CRWV bio + "what it knows")
- ${REPO}/design/wireframes/Research Page.dc.html (CRWV research sections)
- ${REPO}/design/wireframes/Kill List Board.dc.html (the 4 verdicts)
- ${REPO}/design/wireframes/Tripwire Board.dc.html (1 fired + 5 armed)
- ${REPO}/design/wireframes/Explore Directory.dc.html (account descriptors)

Flag ONLY: (a) any number, ticker, dollar amount, percentage, or factual claim in a fixture that does NOT appear
in the design sources (an invented fact - HIGH severity); (b) any post body / claim / tripwire / research text
that deviates from the design's verbatim wording; (c) buy/sell or recommend language.

KNOWN AUTHORED fields (the design does not provide these, so they were written for this phase - judge them ONLY on
whether they introduce a NEW fact/number/ticker beyond the given content, NOT on being absent from the design):
the bios for every account except @CRWV; every persona_card; and the @NVDA post's source label "NVDA / analyst
estimates" + freshness. If one of these introduces a fact not present in that account's given posts/descriptor, flag it.
An empty findings array is a valid answer if the fixtures are faithful.`,
  },
  {
    key: 'schema-validator',
    prompt: `You review the Ticker Phase 2 schema + validation plumbing for correctness.
Read:
- ${REPO}/src/lib/types.ts (zod schemas), ${REPO}/src/lib/content.ts (loaders), ${REPO}/scripts/validate-content.ts
- ${REPO}/plan/system-design.html (the "Data model" - field names for accounts, sources, posts, kill_list, tripwires, wiki_pages)
- ${REPO}/tasks/TODO.md (Phase 2 checklist)

Check: (1) schemas exist for Account, Post, SourceSection, KillListEntry, Tripwire, ResearchPage and their fields
track the system-design data model; (2) zod parsing happens at the loader boundary (single failure point);
(3) the validator would actually FAIL the build on a schema violation AND on a referential violation (unknown
account/post references), and is wired into pnpm build; (4) no loader returns unvalidated data; (5) enums are the
single source of truth (kinds.ts/tiers.ts re-export from types.ts). Flag concrete correctness gaps only - a schema
field that silently accepts bad data, an unchecked reference, a loader that bypasses zod, or a validator blind spot.
An empty findings array is valid if the plumbing is sound.`,
  },
];

function verifyPrompt(f) {
  return `Adversarially verify this Phase 2 finding. Default real=false unless you CONFIRM a genuine defect by reading
the actual source. Read ${REPO}/${f.file} and the relevant design/source file. A finding is NOT real if the fixture
value actually appears in a design source, the field was legitimately authored without adding a new fact, the schema
already guards the case, or the concern is subjective. If real, give the precise corrected fix.

FINDING:
- area: ${f.area}
- file: ${f.file}
- severity: ${f.severity}
- issue: ${f.issue}
- evidence: ${f.evidence}
- proposed fix: ${f.fix}`;
}

phase('Review');
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA, effort: 'high' }),
  (review, d) =>
    parallel(
      (review?.findings || []).map((f) => () =>
        agent(verifyPrompt(f), { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' })
          .then((v) => ({ ...f, verdict: v })),
      ),
    ),
);

const all = results.flat().filter(Boolean);
const confirmed = all.filter((f) => f.verdict && f.verdict.real);
log(`review complete: ${confirmed.length} confirmed of ${all.length} raw findings`);

return {
  confirmedCount: confirmed.length,
  rawCount: all.length,
  confirmed: confirmed
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))
    .map((f) => ({
      severity: f.severity,
      area: f.area,
      file: f.file,
      issue: f.issue,
      fix: f.verdict.corrected_fix || f.fix,
      reason: f.verdict.reason,
    })),
};
