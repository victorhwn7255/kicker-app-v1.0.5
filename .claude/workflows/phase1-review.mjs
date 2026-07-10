export const meta = {
  name: 'phase1-review',
  description: 'Adversarial multi-dimension review of the Ticker Phase 1 design-system components',
  phases: [
    { title: 'Review', detail: 'one agent per dimension finds issues' },
    { title: 'Verify', detail: 'adversarially confirm each finding against the source' },
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
          component: { type: 'string' },
          file: { type: 'string', description: 'repo-relative path' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string', description: 'one sentence: what is wrong' },
          evidence: { type: 'string', description: 'exact wireframe value vs implemented value, or the rule violated' },
          fix: { type: 'string', description: 'the concrete change to make' },
        },
        required: ['component', 'file', 'severity', 'issue', 'evidence', 'fix'],
      },
    },
  },
  required: ['findings'],
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    real: { type: 'boolean', description: 'true only if this is a genuine defect worth fixing' },
    reason: { type: 'string' },
    corrected_fix: { type: 'string', description: 'the precise fix if real; empty otherwise' },
  },
  required: ['real', 'reason', 'corrected_fix'],
};

const SOURCES = `
Authoritative sources (READ them, do not guess):
- ${REPO}/design/wireframes/Component Library.dc.html  (exact px/hex values, sections 01-16)
- ${REPO}/design/wireframes/PostCard.dc.html            (the PostCard data contract + exact rendering)
- ${REPO}/design/wireframes/AccountTile.dc.html
- ${REPO}/design/README.md                              (design law; wins over slock-theme.json on conflict)
Implementation to review:
- ${REPO}/src/lib/tiers.ts, ${REPO}/src/lib/kinds.ts, ${REPO}/src/lib/cn.ts
- ${REPO}/src/components/ui/*.tsx   (TierChip, Avatar, KindBadge, Button, FollowButton, IconButton, Input, Checkbox, Toggle, MentionChip, ReceiptLink, FreshnessStamp, FeedToggle, Skeleton, AccountTile, Icons)
- ${REPO}/src/components/feed/*.tsx (PostCard, KillListCard, TripwireRow, Terminator)
- ${REPO}/src/components/wiki/PaywallGate.tsx
- ${REPO}/tailwind.config.ts        (design tokens: colors, 0 radius, one hard shadow)
Tailwind token map: bg-page #FFF8E7, bg-card #FFFFFF, bg-band #FDF6E3, bg-surface-alt #FFF4CC, bg-yellow #FFD700,
bg-pink #FF6B9D, bg-cyan #5BC0EB, bg-salmon #F4845F, bg-lavender #C4B5FD, text-muted #6B6B6B, text-muted-alt #767676,
bg-tier-solid #7FE08A, bg-tier-needs #FFD700, bg-tier-disputed #FF7A7A, shadow = 2px 2px 0 0 #000, border = 2px solid #000.
Report ONLY concrete, verifiable defects. Do not invent issues; an empty findings array is a valid, good answer.
`;

const DIMENSIONS = [
  {
    key: 'pixel-fidelity',
    prompt: `You are a pixel-perfection reviewer for the Ticker design system (neo-brutalist paper terminal).
Compare every implemented component to its EXACT values in the wireframes. Check: font sizes, paddings, gaps,
borders (2px), border-radius (0 except the settings Toggle pill), colors/hex, avatar sizes, tier-chip cell paddings,
trust-band padding (11px 16px), kind-badge sizes, the salmon reply border (4px), the high-stakes black header,
quote inset, thread pointer, kill-list verdict stamp (26px + hard shadow), tripwire status square (18px),
paywall lock tile (yellow border). Flag any value that differs from the wireframe.
${SOURCES}`,
  },
  {
    key: 'hard-rules',
    prompt: `You are a product hard-rules auditor for Ticker. Read ${REPO}/tasks/TODO.md "Product hard rules" and
${REPO}/design/README.md. Verify the components NEVER violate them: (1) NO engagement metrics anywhere - no like/reply/
repost/view counts in any component or its props/types; (2) the PostCard trust band (tier chip + receipt + freshness)
is ALWAYS rendered, never optional/collapsible; (3) describe-don't-recommend - no buy/sell language, price targets,
bullish/bearish, price charts; (4) design system is law - 0px radius everywhere except the Toggle pill, 2px black
borders, one hard shadow 2px 2px 0 0 #000, NO gradients/blur/glassmorphism, the paywall has NO blur-tease/countdown/
fake-scarcity. Grep the component files and read them. Report concrete violations only.
${SOURCES}`,
  },
  {
    key: 'accessibility',
    prompt: `You are an accessibility & keyboard reviewer for Ticker. Verify: every interactive element (Button,
FollowButton, IconButton, Checkbox, Toggle, FeedToggle, ReceiptLink, MentionChip links) is keyboard-operable and has a
visible pink focus ring; tier meaning is carried by the LABEL not color alone (glyph is aria-hidden, survives grayscale);
IconButton has an accessible label; the toggle uses role=switch/aria-checked; the checkbox is a real input; decorative
avatars/glyphs are aria-hidden; no focus traps or removed outlines without replacement. Report concrete a11y defects only
(missing focus ring, missing aria-label, color-only signal, non-operable control).
${SOURCES}`,
  },
  {
    key: 'reuse-consistency',
    prompt: `You are a code-quality reviewer for the Ticker design system. The rule: "everything a screen needs exists
here once; do not fork or re-implement components later." Check: PostCard composes the primitives (Avatar, KindBadge,
TierChip, FollowButton, IconButton, ReceiptLink, FreshnessStamp) rather than re-inlining them; tier/kind config lives in
src/lib and is not duplicated; colors come from Tailwind tokens, NOT hardcoded hex in className (a hardcoded hex like
bg-[#FF6B9D] where a token exists is a defect); no dead/unused exports; consistent prop APIs; RSC boundaries correct
('use client' only where needed). Report concrete duplication/hardcoding/consistency defects only.
${SOURCES}`,
  },
];

function verifyPrompt(f) {
  return `Adversarially verify this Phase 1 review finding. Default to real=false unless you can CONFIRM a genuine
defect by reading the actual source. Read ${REPO}/${f.file} and the relevant wireframe under ${REPO}/design/wireframes/.
A finding is NOT real if: the implementation already matches the wireframe, the difference is imperceptible/subjective,
the "fix" would break something else, or it contradicts design/README.md. If real, give the precise corrected fix.

FINDING:
- component: ${f.component}
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
        agent(verifyPrompt(f), { label: `verify:${d.key}:${f.component}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' })
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
      component: f.component,
      file: f.file,
      issue: f.issue,
      evidence: f.evidence,
      fix: f.verdict.corrected_fix || f.fix,
      reason: f.verdict.reason,
    })),
};
