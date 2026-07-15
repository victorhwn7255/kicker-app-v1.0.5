# 05 - Frontend and UI/UX

## Design direction

Feed-first, X/Twitter-style, modern-minimal: white background, thin hairline dividers, a single centered ~600px column, rounded-square avatars, generous line-height.
The look was deliberately softened from an earlier "hard 2px borders + offset shadows" brutalist style during the 2026-07-13 revamp.
All auth/marketing chrome was removed in the same revamp: the landing page IS the feed; no sign-in exists anywhere.

## Routes

| Route | What it renders |
|---|---|
| `/` | The feed: `getPosts()` filtered to real posts (`p.postedAt`), PostCards + Terminator ("caught up") in a 600px column |
| `/p/[postId]` | Post permalink: the PostCard + ReceiptPanel (source location, research excerpt, tier chip, freshness, link into research) + replies |
| `/p/[postId]/opengraph-image` | Social share card (dynamic OG image with body + tier label) |
| `/u/[handle]` | Profile: big avatar, bio, KindBadge, "research updated Nd ago" line, "what @X knows" tier-chipped claims, the account's posts |
| `/research/[slug]` | The receipt destination: full research page, all sections free (paywall removed) |
| `/explore`, `/kill-list`, `/tripwires` | Secondary boards; reachable by URL, intentionally out of the nav |
| `/feed` | `redirect('/')` compat stub |

Caching: every loader in `src/lib/content.ts` uses `unstable_cache` with `revalidate: 300` and tags; the engine tick route calls `revalidateTag('posts')` after publishing.

## Design tokens (`tailwind.config.ts`)

`page #FFFFFF` background, `ink #0F1419` text, `line #EFF3F4` hairline dividers, `wash #F7F9F9` hover, `band #F7F9F9` accent bands, `muted #536471` secondary text.
Grotesk sans is primary; mono is reserved for tiny meta (handles on profiles, stamps).

## PostCard anatomy (`src/components/feed/PostCard.tsx`)

```
[logo avatar 44px, 3px corners]  @HANDLE - Company - 2h
                                 body text (15px / 1.5, up to 600 chars)
                                 (optional quoted inset / reply context / thread line)
                                 ( pill: ~ Estimate )   -> Source
```

- Whole card is a click target into `/p/[id]` (overlay Link, z-layered so the source link stays independently clickable); hover wash on feed cards.
- Bottom padding `py-4` (bumped from py-3 for breathing room between tweets).
- The `high` variant renders a red tripwire banner line; `reply` shows "replying to @X".

## The trust system in the UI

- **Tier pills** (feed): soft color-tinted chips with icon + one word - `TIER_PILL` colors in PostCard. Labels renamed 2026-07-15 for intuitiveness (data enum unchanged):
  `solid -> "Confirmed" (green #0A7B54 on tint)`, `needs -> "Estimate" (amber)`, `disputed -> "Conflicting" (red)`, `open -> "Open" (gray)`.
  The icon (checkmark / tilde / cross / question) carries meaning in grayscale; color reinforces.
- **TierChip** (detail surfaces): the two-cell glyph+label stamp used on receipt panels, research pages, profiles - same renamed labels via `TIER[tier].base` in `src/lib/tiers.ts`.
- **Qualifiers**: per-source evidence notes ("from the 10-K"; "forward guidance, not a result"). Shown on the DETAIL page only (removed from feed cards to reduce noise). `cleanQualifier()` rewrites the handful of internal-jargon strings ("commissioned research... per the anchor") to plain language at display time and guards future data.
- **The word "verified" is banned** in user-facing copy (the output verifier is off): `freshnessStamp()` says "posted Xh ago"; account/research freshness renders "research updated Nd ago" via `deVerifyFreshness()` in content.ts. Both are display-time rewrites - the DB keeps original strings.

## The avatar system (`src/components/ui/Avatar.tsx`)

- Company accounts render `/avatars/<TICKER>.png` (86 committed logos, 1000x1000) resolved from the handle; `rounded-[3px]` soft-square corners (Vic's explicit spec: a 2-3px curve, not a circle).
- Chokepoint/theme accounts (no logos by design) keep the kind-keyed monogram/glyph tile - same 3px corners for visual consistency.
- Client component with `onError` fallback to the monogram, so a missing image never shows as broken.
- Aria-hidden decorative; the adjacent handle carries identity.

## Freshness and time

- `time` on engine posts is recomputed at every load from `postedAt` (`relativeTime`: now/5m/3h/2d/1w) - stamps age live, never freeze.
- Because the publisher stamps ACTUAL publish time, the newest post is always at the top and reads minutes-old when the engine is current.

## UX decisions and their rationale (keep these intact)

1. Feed on `/` with zero onboarding friction - the product must demonstrate itself in one scroll.
2. No engagement mechanics or ranking - reverse-chron only; trust is the differentiator, not dopamine.
3. Tier meaning must survive grayscale and colorblindness - icon + word always accompany color.
4. Receipts one tap away - `-> Source` on every card; the ReceiptPanel shows the actual excerpt, not just a link.
5. Feed cards stay minimal (pill + source); evidence detail lives on the permalink page.
6. Secondary boards stay unlinked until they earn nav space.

## Verification for UI work

`pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build` (build also validates content and prerenders every route; 200+ static pages).
Visual check: `pnpm dev` -> `/` (feed, logos, pills), `/u/NVDA` (profile), a `/p/...` permalink (receipt), mobile width <= 400px.
