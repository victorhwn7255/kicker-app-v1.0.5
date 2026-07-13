import { z } from 'zod';

/**
 * The content contract for Ticker. Every fixture is parsed through these zod
 * schemas at the loader boundary, so every later phase gets typed data and a
 * single failure point. Field names follow plan/system-design.html "Data model".
 */

const handle = z.string().regex(/^@[A-Za-z0-9_-]+$/, 'handle must look like "@name"');
const nonEmpty = z.string().min(1);

/* ---- shared enums (source of truth; kinds.ts / tiers.ts re-export the types) ---- */

export const KindSchema = z.enum(['company', 'chokepoint', 'theme']);
export type Kind = z.infer<typeof KindSchema>;

export const TierSchema = z.enum(['solid', 'needs', 'disputed', 'open']);
export type Tier = z.infer<typeof TierSchema>;

export const KillVerdictSchema = z.enum(['killed', 'survived', 'partly']);
export type KillVerdict = z.infer<typeof KillVerdictSchema>;

/* ---- Account + persona card ---- */

export const PersonaCardSchema = z.object({
  // How the account speaks. A persona card shapes tone, never facts.
  voice: nonEmpty,
  // Guardrails the voice must obey (never adds a fact, describe-don't-recommend, keeps hedges).
  constraints: z.array(nonEmpty).min(1),
});
export type PersonaCard = z.infer<typeof PersonaCardSchema>;

export const AccountSchema = z.object({
  handle,
  kind: KindSchema,
  display_name: z.string().optional(),
  domain: z.string().optional(),
  // Monogram for company/chokepoint tiles; omit for theme (renders the nodes glyph).
  avatar: z.string().optional(),
  desc: nonEmpty, // one-line directory descriptor
  bio: nonEmpty, // first-person profile bio
  persona_card: PersonaCardSchema,
  freshness: z.string().optional(),
  research_slug: z.string().optional(),
  supply_chain: z.array(handle).optional(),
  // "What @X knows" - the account's key claims, each tier-chipped (profile header).
  knows: z.array(z.object({ claim: nonEmpty, tier: TierSchema })).optional(),
});
export type Account = z.infer<typeof AccountSchema>;

/* ---- Post (the design's data contract; consumed by PostCard) ---- */

const QuotedPostSchema = z.object({
  handle,
  kind: KindSchema,
  avatar: z.string().optional(),
  time: z.string().optional(),
  body: nonEmpty,
  tier: TierSchema,
});

export const PostSchema = z.object({
  id: z.string().optional(),
  handle,
  kind: KindSchema,
  time: nonEmpty,
  body: nonEmpty,
  tier: TierSchema,
  qualifier: z.string().optional(),
  source: nonEmpty,
  freshness: nonEmpty,
  avatar: z.string().optional(),
  // ISO publish time for engine-published posts; lets the feed order reverse-chron
  // and render a LIVE relative stamp (the loader recomputes `time` from this).
  // Absent on the human fixtures, which keep their static `time`.
  postedAt: z.string().optional(),
  variant: z.enum(['original', 'quote', 'reply', 'thread', 'high']).optional(),
  following: z.boolean().optional(),
  replyTo: z.string().optional(),
  thread: z.string().optional(),
  threadNext: z.string().optional(),
  highLabel: z.string().optional(),
  quoted: QuotedPostSchema.optional(),
});
export type Post = z.infer<typeof PostSchema>;

/* ---- SourceSection (the generation reservoir the engine may reword) ---- */

export const SourceSectionSchema = z.object({
  id: nonEmpty,
  account: handle,
  section_title: nonEmpty,
  body_text: nonEmpty,
  tier: TierSchema,
  qualifier: z.string().optional(),
  vault_ref: nonEmpty,
});
export type SourceSection = z.infer<typeof SourceSectionSchema>;

/* ---- KillListEntry ---- */

export const KillListEntrySchema = z.object({
  id: nonEmpty, // "claim #041"
  claim: nonEmpty,
  verdict: KillVerdictSchema,
  verdict_note: z.string().optional(),
  explanation: nonEmpty,
  receipts: nonEmpty,
  related_accounts: z.array(handle),
});
export type KillListEntry = z.infer<typeof KillListEntrySchema>;

/* ---- Tripwire ---- */

export const TripwireSchema = z.object({
  id: nonEmpty,
  account: handle,
  description: nonEmpty,
  status: z.enum(['armed', 'fired']),
  when: nonEmpty,
  post_id: z.string().optional(),
});
export type Tripwire = z.infer<typeof TripwireSchema>;

/* ---- ResearchPage ---- */

export const ResearchSectionSchema = z.object({
  slug: nonEmpty, // anchor id
  title: nonEmpty,
  tier: TierSchema.optional(),
  qualifier: z.string().optional(),
  locked: z.boolean(),
  body: z.string().optional(), // full text (free sections)
  descriptor: z.string().optional(), // one-line stub (locked sections)
  receipt: z.string().optional(),
});
export type ResearchSection = z.infer<typeof ResearchSectionSchema>;

export const ResearchPageSchema = z.object({
  slug: nonEmpty,
  account: handle,
  title: nonEmpty,
  kind: KindSchema,
  domain: z.string().optional(),
  freshness: nonEmpty,
  section_count: z.number().int().positive(),
  sections: z.array(ResearchSectionSchema).min(1),
});
export type ResearchPage = z.infer<typeof ResearchPageSchema>;
