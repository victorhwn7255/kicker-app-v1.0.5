/**
 * Account kinds - every account is a company, a supply-chain chokepoint, or a theme.
 * Avatar fill is keyed by kind: company = white + ticker, chokepoint = black + code,
 * theme = cream + nodes glyph. Source: design/README.md "Avatar system".
 * The `Kind` type is defined by the zod schema in types.ts (single source of truth).
 */
import type { Kind } from './types';

export type { Kind };

export const KIND_LABEL: Record<Kind, string> = {
  company: 'Company',
  chokepoint: 'Chokepoint',
  theme: 'Theme',
};

export const AVATAR_STYLE: Record<Kind, { bg: string; color: string }> = {
  company: { bg: 'bg-card', color: 'text-ink' },
  chokepoint: { bg: 'bg-ink', color: 'text-white' },
  theme: { bg: 'bg-band', color: 'text-ink' },
};
