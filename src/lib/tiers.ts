/**
 * Tier semantics - the core trust primitive.
 * The LABEL always carries the meaning; color only reinforces it (colorblind-safe,
 * survives grayscale). Glyphs: ✓ solid · ~ needs checking · ✕ disputed · ? open.
 * Source: design/README.md "Tier semantics" + Component Library.
 * The `Tier` type is defined by the zod schema in types.ts (single source of truth).
 */
import type { Tier } from './types';

export type { Tier };

type TierDef = {
  glyph: string;
  base: string;
  glyphBg: string;
  glyphColor: string;
  labelBg: string;
  labelColor: string;
};

export const TIER: Record<Tier, TierDef> = {
  solid: {
    glyph: '✓',
    base: 'Solid',
    glyphBg: 'bg-tier-solid',
    glyphColor: 'text-ink',
    labelBg: 'bg-tier-solid',
    labelColor: 'text-ink',
  },
  needs: {
    glyph: '~',
    base: 'Needs checking',
    glyphBg: 'bg-tier-needs',
    glyphColor: 'text-ink',
    labelBg: 'bg-tier-needs',
    labelColor: 'text-ink',
  },
  disputed: {
    glyph: '✕',
    base: 'Disputed',
    glyphBg: 'bg-tier-disputed',
    glyphColor: 'text-ink',
    labelBg: 'bg-tier-disputed',
    labelColor: 'text-ink',
  },
  open: {
    // Open question: ink glyph cell + white label cell.
    glyph: '?',
    base: 'Open question',
    glyphBg: 'bg-ink',
    glyphColor: 'text-white',
    labelBg: 'bg-white',
    labelColor: 'text-ink',
  },
};

/**
 * Full trust-band label. Open questions always read "Open question - unresolved";
 * others append the per-post qualifier after an em dash ("Solid — from the 10-Q").
 * The em dash here is design content (matches the Component Library verbatim), not prose.
 */
export function tierLabel(tier: Tier, qualifier?: string): string {
  if (tier === 'open') return 'Open question — unresolved';
  return qualifier ? `${TIER[tier].base} — ${qualifier}` : TIER[tier].base;
}
