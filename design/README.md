# Handoff: Ticker — Frontend UI/UX

## Overview
Ticker is a Twitter-style feed where **every account is a company, a supply-chain chokepoint, or an investment theme**, and every post is built only from verified financial research. The product's positioning is "the anti-FinTwit": no hype, no buy/sell calls, no engagement metrics. Trust is the product, so trust is the UI — every post carries a confidence **tier chip**, a one-tap **receipt** to its source, and a **freshness** stamp.

This package contains the complete frontend: a component library + design tokens, 13 screens (each in mobile + desktop), two reusable components, a clickable daily-loop prototype, and a one-page rationale memo.

## About the Design Files
The files in `wireframes/` are **design references authored in HTML** — prototypes that show the intended look, layout, copy, and behavior. **They are not production code to ship directly.** Your task is to **recreate these designs in the target codebase's environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component primitives, and libraries. If no codebase exists yet, choose the most appropriate framework for a content-driven, SEO-relevant social/reading product (e.g. Next.js/React with server rendering for the permalink + landing + research pages) and implement there.

> Note on the authoring format: the `.dc.html` files are self-contained component prototypes. Each is plain HTML with inline styles; `support.js` is only the prototype runtime and is **not** part of the design — ignore it when porting. Treat the rendered output and the markup as the reference, not the runtime.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, borders, and interaction states are all specified below and in the files. Recreate the UI to match — pixel-accurate — using your codebase's libraries. Where this doc gives an exact hex/px value, it is intentional and load-bearing (the visual system is the brand argument).

---

## The Design System — "Neo-brutalist paper terminal"

The single most important thing to preserve: **this is a flat, bordered, high-contrast system.** It is not a soft/rounded/shadowed SaaS look.

### Hard rules (apply everywhere, no exceptions)
- **Border radius: `0` on everything.** The only rounded element in the entire system is the settings toggle track (a pill). Nothing else rounds — not cards, not buttons, not inputs, not avatars, not chips.
- **Borders: `2px solid #000000`** on essentially every container, control, chip, and avatar.
- **One shadow only: `box-shadow: 2px 2px 0 0 #000000`** (a hard, offset, un-blurred drop). Used sparingly for elevation (primary buttons, "hero" cards). Never a soft/blurred shadow. Larger frames in the canvases use `4px 4px 0 0 #000` — that is a mock-frame affordance; in-app, use `2px 2px`.
- **No gradients, no blur, no glassmorphism.** (The paywall deliberately has NO blur-tease — see below.)

### Color tokens
| Token | Hex | Job |
|---|---|---|
| Page background | `#FFF8E7` | App/page background (cream) |
| Card surface | `#FFFFFF` | Post cards, panels, tiles |
| Receipt-band / inset surface | `#FDF6E3` | The trust band at the bottom of posts; quoted-post insets; section fills |
| Canvas backdrop (mock only) | `#EDE4CF` | The darker cream behind device frames in the wireframe canvases — **not** an in-app color |
| Ink | `#000000` | Text, borders |
| **Yellow** | `#FFD700` | **Chrome only** — top bars, bottom nav, brand accents. Never a content-area background. Also the "Needs checking" tier. |
| **Pink** | `#FF6B9D` | Follow / active states (active nav item, "Following" button, active toggle segment) |
| **Cyan** | `#5BC0EB` | Subscribe / sign-up / primary conversion CTAs |
| **Salmon** | `#F4845F` | Reply connectors / thread connective tissue |
| **Lavender** | `#C4B5FD` | @-mention chips and account-reference chips |
| Muted text | `#6B6B6B` | Metadata, secondary text (on light) |
| Muted text (alt) | `#767676` | Placeholder text, tertiary |
| Dark-surface secondary text | `#A0A0A0` / `#E0E0E0` | Secondary text on black surfaces |

**Each accent has exactly one job.** Do not reuse pink for subscribe, cyan for follow, etc. This is deliberate and keeps the accents legible as signals.

### Tier semantics (the core trust primitive)
| Tier | Glyph | Color | Default label |
|---|---|---|---|
| Solid | `✓` | `#7FE08A` (green) | "Solid" (+ per-post qualifier, e.g. "— from the 10-Q") |
| Needs checking | `~` | `#FFD700` (yellow) | "Needs checking" (+ qualifier "— estimate") |
| Disputed | `✕` | `#FF7A7A` (red) | "Disputed" |
| Open question | `?` | `#000000` glyph cell / `#FFFFFF` label cell | "Open question — unresolved" |

**Accessibility rule: the label always carries the meaning; color only reinforces it.** Never communicate tier by color alone (colorblind-safe + survives grayscale screenshots). The Component Library includes a grayscale proof of this.

### Typography
- **Space Grotesk** (400 + 700) — all reading text: post bodies, headings, display, button labels.
- **Space Mono** (400 + 700) — handles (`@ticker`), tier/label chips, timestamps, numbers, freshness stamps, section eyebrows, all metadata. This mono/grotesk split is a strong identity signal — keep it.
- Google Fonts import: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&display=swap`

Type scale (from the Component Library):
- Display / screen titles: 30–48px / 700 / letter-spacing `-0.02em`, line-height ~1.05
- Section headings: 22–26px / 700
- **Post body: 16px / 400 / line-height 1.55** (the 90% users read; use `text-wrap: pretty`)
- Chips & labels (mono): 10–12px / 700 / `text-transform: uppercase` / letter-spacing `0.04–0.08em`
- Metadata / timestamps / freshness (mono): 11–12px / 400 / color `#6B6B6B`

### Spacing
4px base scale: **4 · 8 · 12 · 16 · 24 · 32**. Card padding is typically `14px 16px`; trust band `11px 16px`.

### Interaction states
- **Button hover:** instant color swap (≤50ms transition). E.g. white/ghost buttons → pink `#FF6B9D`; cyan → `#4AAFDA`; receipt links fill yellow `#FFD700`.
- **Button active ("stamp press"):** `box-shadow: none; transform: translate(2px, 2px);` — the button visually presses into where its shadow was.
- **Focus ring:** `2px` pink — either `outline: 2px solid #FF6B9D; outline-offset: 2px;` (cards) or `border-color:#FF6B9D; box-shadow: 2px 2px 0 0 #FF6B9D;` (inputs). Honest, visible focus — do not remove.
- **Card hover (feed):** lifts via `transform: translate(-2px,-2px)` and gains the `2px 2px 0 0 #000` shadow.
- **Loading:** hard-bordered skeleton blocks pulsing opacity (`@keyframes` 1→0.45→1 over 1.4s). **No shimmer sweep.**

---

## Reusable Components

### PostCard — the atom of the product
`wireframes/PostCard.dc.html`. One data-driven card renders every post variant. **This is the most important component to get right** — the entire trust model lives here, and a cropped screenshot of one card must carry its own credibility.

**Anatomy, top to bottom:**
1. **(optional) High-stakes header** — a black bar `background:#000; color:#fff` with a red warning-triangle icon and mono uppercase label (e.g. "TRIPWIRE FIRED"). Only on high-stakes posts.
2. **Identity row** — avatar (42×42, 2px border) · handle (Space Mono 700, 14px) · **kind badge** (bordered mono chip: "Company"/"Chokepoint"/"Theme" with a small stroke icon) · timestamp (mono, `· 2h`) · optional thread badge (black chip `1/6`). On the right: a share/copy-link icon button (34×34) + a **Follow** button. **No like/reply/repost/view counts anywhere.**
3. **(reply only)** A salmon reply indicator `↳ replying to @handle` (color `#F4845F`), and the whole card gets `border-left: 4px solid #F4845F`.
4. **Body** — Space Grotesk 16/1.55, `text-wrap:pretty`.
5. **(quote only)** A nested inset (`#FDF6E3`, 2px border) containing the quoted post's mini identity row + its own tier chip + body.
6. **(thread only)** A salmon "next segment" pointer with the next thread index.
7. **Trust band** — `border-top:2px solid #000; background:#FDF6E3; padding:11px 16px`. Contains:
   - The **tier chip** (two-cell stamp — see below).
   - A row with the **receipt link** (`source: … →`, Space Mono 700 uppercase, `border-bottom:2px solid #000`, min 22px tall; hover fills yellow; whole row is a ≥44px tap target on mobile) and the **freshness stamp** (`verified 2d ago`, mono `#6B6B6B`).

**Tier chip construction (two-cell stamp):** an inline-flex element, `border:2px solid #000`, split into two cells by a `2px` vertical rule:
- Cell 1 (glyph): `padding:4px 7px`, background = tier color, the glyph (`✓`/`~`/`✕`/`?`), font-size 12px.
- Cell 2 (label): `padding:4px 9px`, background = tier color (for solid/needs/disputed) or white (for open question), the uppercase mono label, font-size 11px.
- Sizes: post-band size ≈ 12px glyph / 11px label; inline/compact size ≈ 10–11px.

**Props the component reads (data contract):**
```ts
type Post = {
  handle: string;                    // "@CORZ"
  kind: 'company' | 'chokepoint' | 'theme';
  time: string;                      // "2h"
  body: string;
  tier: 'solid' | 'needs' | 'disputed' | 'open';
  qualifier?: string;                // "from the 10-Q" — appended after em-dash on solid/needs
  source: string;                    // receipt link text, "CORZ / financials"
  freshness: string;                 // "verified 2d ago"
  avatar?: string;                   // monogram text, e.g. "CORZ"; omit for theme (renders node glyph)
  variant?: 'original' | 'quote' | 'reply' | 'thread' | 'high';
  following?: boolean;               // toggles Follow ↔ Following (pink) button
  replyTo?: string;                  // "@CRWV" (reply variant)
  thread?: string;                   // "1/6" (thread variant)
  threadNext?: string;               // "2/6 → …" (thread variant)
  highLabel?: string;                // "Tripwire fired" (high variant)
  quoted?: {                         // quote variant
    handle: string; kind: Post['kind']; avatar?: string; time?: string; body: string; tier: Post['tier'];
  };
  onReceipt?: (post: Post) => void;  // fired when receipt link tapped (drives navigation)
};
```

**Avatar system (kind-keyed monogram tiles — RECOMMENDED direction):**
- company → white bg `#fff`, black text, ticker monogram (e.g. `NVDA`)
- chokepoint → black bg `#000`, white text, short code (e.g. `TRF`, `HBM`)
- theme → cream bg `#FDF6E3`, a small "connected nodes" stroke glyph (no text)
- All: 2px border, 0 radius. Sizes used: 24 / 32 / 40 / 42 / 56 / 64 / 88px.
- A pixel-art alternative was explored and is shown in the Component Library, but **monogram tiles are the recommendation** (a legible ticker is load-bearing information; personality lives in the post text, not the avatar).

### AccountTile — directory/list row
`wireframes/AccountTile.dc.html`. Compact account row: avatar (40×40) + handle + kind badge + one-line descriptor + Follow button. Same avatar rules as PostCard. Props: `{ handle, kind, avatar?, desc, following? }`.

---

## Screens / Views

Every screen is delivered in **mobile (375–393px)** and **desktop (1280px)** side by side on a pan/zoom canvas. Mobile frames include a status bar (28px, yellow) and a **bottom nav** (yellow, 5 tabs: FEED / EXPLORE / KILL / TRIP / PROFILE; active tab = a pink `#FF6B9D` filled square behind the icon, 0 radius). Desktop uses a **56–58px yellow top chrome bar** (logo "TICKER" in Space Grotesk 700 + mono tagline "the anti-fintwit", search, avatar/sign-up).

### 01–02 · Home Feed — `wireframes/Home Feed.dc.html`
- **Purpose:** the daily read. Reverse-chronological, calm, ends on purpose.
- **Layout (desktop):** centered, feed column **640px** + right rail **300px**, `gap:24px`, page padding 24px. (Mobile: single column, 14px padding.)
- **Feed toggle:** a bordered 2-segment control "Following / Everything" with `2px 2px 0 0 #000` shadow; active segment = pink. In the desktop file this toggle is **interactive** (updates a context label; wire it to switch the post source).
- **Right rail (desktop):** three stacked bordered cards — (a) **Kill List** highlight (yellow header, a claim + red "KILLED" stamp + receipts link); (b) **Tripwires** (yellow header; rows with 14px status squares — red=fired, white=armed — + account handle + FIRED/ARMED); (c) a **Reader** upsell (`#FDF6E3`, cyan CTA).
- **Terminator (both):** the feed ends in a **black card** `background:#000; color:#FFF8E7`: mono yellow eyebrow "End of feed", "You're caught up." (30px/700), "That's everything real. Nothing else happened. Go outside.", and a footer note "No infinite scroll. No filler. We'll wake you when something breaks." **No infinite scroll, no pull-to-refresh spinner.**
- **States shown:** mobile = logged-out viewing "Everything"; desktop = logged-in viewing "Following" (posts show "Following" pink buttons).
- Feed composition uses the six sample posts (see Content) rendered via PostCard: original, quote, reply, thread, needs-checking, open-question.

### 03 · Post Permalink — `wireframes/Post Permalink.dc.html`
- **Purpose:** the shareable / SEO unit. A first-time visitor lands here from a screenshot link.
- **Layout (desktop):** main column **600px** + right rail 300px. Mobile single column.
- **Key element — the receipt, opened:** directly beneath the shared post sits a connected **receipt panel** (2px border, `border-top:none` so it reads as attached; black header bar "↳ The receipt"). It shows the source location (`CRWV · research page · § customer concentration`), an excerpt in an inset (`#FDF6E3`, `border-left:4px solid #000`), the tier chip + freshness, and an "Open full research page →" button.
- **First-time-visitor affordances:** mobile has a "You're reading one post on Ticker" explainer strip (`#FFF4CC`); desktop right rail has a "New here? How to read this" card that explains the tier system + a "Create free account" CTA.
- Below: a "1 reply" divider + the reply post (salmon connector).

### 04 · Account Profile — `wireframes/Account Profile.dc.html`
- **Purpose:** the persona. Example: `@CRWV` (company).
- **Header:** avatar (64 mobile / 88 desktop) + handle (26px mono) + kind badge + a lavender domain chip ("AI datacenter") + **first-person bio** (accounts speak in character — e.g. "GPU landlord. $25B in debt and counting. My biggest customer is 60%+ of my revenue and my banker's collateral. I know exactly what you're going to ask.") + a "research verified 1d ago" status (green square). Follow/Following button top-right.
- **"What @CRWV knows":** a bordered card listing the account's key claims, **each with its own tier chip** (solid/solid/open-question). This is a signature element — the account is defined by what it can back up.
- **Research door:** a black card CTA "The full research page" → "Open research page →" (cyan, with `2px 2px 0 0 #FFD700` shadow).
- **Post history:** "Posts · newest first" divider, then PostCards. Desktop right rail also has a lavender "Its supply chain" chip cloud (@CORZ, @who-holds-the-risk, @transformer-supply, @HBM-memory).

### 05 · Research Page + Paywall — `wireframes/Research Page.dc.html`
- **Purpose:** the paid deep page. Tier-annotated sections, open questions, "what would prove this wrong."
- **Layout (desktop):** sticky TOC **220px** + reading column **600px**. TOC lists sections; locked ones show a lock glyph + are muted; a "Tiers on this page" legend sits below.
- **Section 1 is free** and readable in full, in **plain text ending on a hard edge — NO blur, no fade, no teaser.** (This replaced an earlier gradient fade; do not reintroduce a fade.) Each section has a heading + its tier chip + a receipt link.
- **The gate:** a black card. States plainly "The rest is a Reader page." + what's included (✓ every section + receipt, ✓ "What would prove this wrong", ✓ daily digest) + a cyan "Unlock Reader — $20/mo" button + "Cancel anytime · no card games · no fake scarcity." **No countdown, no fake scarcity.**
- **Honest locked structure:** below the gate, the remaining sections are listed as **legible titles + descriptors + tier chips** (in `#FDF6E3` rows with a lock icon) — the user sees exactly what they'd get. Nothing is blurred to manufacture curiosity.

### 06 · Kill List Board — `wireframes/Kill List Board.dc.html`
- **Purpose:** viral claims checked against primary sources — designed to be screenshotted with the brand visible.
- **Card construction:** yellow header bar "TICKER · KILL LIST" + claim id (e.g. "claim #041"). Body: mono eyebrow "claim, as circulated" → the claim in a `border-left:4px solid #000` blockquote (17px/700) → a **verdict stamp** (big Space Grotesk 700, `2px 2px 0 0 #000` shadow): `KILLED` on red `#FF7A7A`, `SURVIVED` on green `#7FE08A`, `PARTLY TRUE` on yellow `#FFD700` → a plain-language explanation. Trust band: receipts link + related account chip(s) (lavender).
- **Layout:** mobile single column; desktop 2-col grid. Filters row: All / Killed / Survived / Partly (active = pink).

### 07 · Tripwire Board — `wireframes/Tripwire Board.dc.html`
- **Purpose:** a warning-lights panel of pre-registered thesis-breakers, grouped by account. "Calm until it isn't."
- **Row construction:** an 18px status **square** (red `#FF7A7A` = FIRED, white = ARMED — never color alone; the FIRED/ARMED word is always present) + the tripwire statement (fired rows are bold + get a faint red row tint `#FFF3F3`) + when + a "the post →" link on fired rows. Grouped under account subheaders (`#FDF6E3` bar with avatar + handle + kind).
- **Header:** count summary ("1 fired · 5 armed") + a legend. The board should read calm by default; a fired light is the entire message — **no advice follows.**

### 08 · Explore Directory — `wireframes/Explore Directory.dc.html`
- **Purpose:** browse ~140 accounts by kind + domain.
- **Layout:** search bar in chrome; filter chips for Kind (All/Companies/Chokepoints/Themes, active=pink) and Domain (AI datacenter/Defense/Robotics, active=yellow). Sections "Companies / Chokepoints / Themes", each a grid (desktop 2-col) of **AccountTile**s.

### 09 · Pricing — `wireframes/Pricing.dc.html`
- **Purpose:** the paywall sits on depth, not the feed. Plain language, no dark patterns.
- **Three tiers:** **Free $0** (white header) — "The feed, forever"; **Reader $20/mo** (cyan header, elevated `translateY(-6px)` + `4px 4px 0 0 #000`, "most readers pick this" badge) — every research page + "what would prove this wrong" + daily digest; **Pro $40/mo** (black header, yellow price) — adds chat with the research library + tripwire push. Feature rows use green `✓` (`#2DC653`) and muted `—` for not-included. Footer: "Cancel anytime · no countdowns · no fake scarcity · the feed stays free forever."

### 10 · Auth (magic link) — `wireframes/Auth.dc.html`
- **Purpose:** passwordless. Two states + a desktop centered card.
- **State 1:** email input (pink focus ring) + cyan "Send magic link" + reassurance "Free forever · you only ever read · no card required. We never post as you."
- **State 2:** yellow envelope icon tile + "Check your inbox." + "We sent a magic link to <email>" + Resend / Use a different email + "link expires in 15 minutes."

### 11 · Onboarding — `wireframes/Onboarding.dc.html`
- **Purpose:** seed the watchlist (step 2 of 2; progress shown as filled bars).
- **One-tap bundles:** lavender-headed "Bundle · supply chain" cards, e.g. "Own NVDA? Follow its supply chain." with @TSM / @HBM-memory / @transformer-supply chips + "Follow all 3". Desktop shows a second bundle "Watching CoreWeave? Follow the risk."
- **Pick by hand:** a list/grid of accounts with checkboxes (selected = black fill `#000` + white check + row tint `#FFF4CC`). Sticky "Continue to your feed →" (black/yellow).

### 12 · Settings — `wireframes/Settings.dc.html` (P2, layout sketch)
- **Purpose:** account / email & alerts / subscription. Desktop has a 180px settings nav + content.
- **Account:** "Signed in as <email>", magic-link only, "You only ever read; Ticker never posts as you."
- **Email & alerts:** toggles (the pill toggle — the one rounded element; on = yellow track, black knob) for "Daily digest" and "Tripwire push" (PRO badge).
- **Subscription:** current plan chip (cyan "Reader") + renewal date + "Upgrade to Pro" (black/yellow) + "Manage billing (Stripe) ↗" (hands off to Stripe portal) + Cancel.

### 13 · Landing — `wireframes/Landing.dc.html`
- **Purpose:** marketing centerpiece, logged-out first visit.
- **Hero:** yellow "The anti-FinTwit" pill + big headline "Sourced. Confidence-labeled. Allowed to say 'we don't know.'" + subhead + cyan "Read the feed — free" + secondary "See how it works". Desktop hero is split, with a **live feed preview** (real PostCards, "This is the actual feed — not a mockup") in a `#EDE4CF` panel on the right.
- **Trust trio:** three bordered cards — "Every claim wears its confidence" (shows tier chips), "Receipts, one tap away" (shows a receipt link + freshness), "A Kill List for viral nonsense" (shows a claim + KILLED stamp).
- **Pricing teaser:** black band "The feed is free. Depth is the upgrade." + cyan "See plans". Yellow footer.

### Supporting deliverables
- **Component Library** (`wireframes/Component Library.dc.html`) — the full token + component reference (colors, type, structure, tier chips w/ grayscale proof, kind badges, avatars A/B, buttons/inputs, nav, post anatomy + all 6 variants, states, mention chips, receipt link, terminator, kill-list card, tripwire rows, paywall gate). **Use this as the source of truth for exact values.**
- **Daily Loop Prototype** (`wireframes/Daily Loop Prototype.dc.html`) — a clickable mobile flow: scroll the Following feed → tap any receipt link → see the source excerpt view → back to feed → hit "You're caught up." Demonstrates the intended navigation for flow #2.
- **Rationale Memo** (`wireframes/Rationale Memo.dc.html`) — eight design decisions mapped to the brief's principles; good orientation for *why* the system is the way it is.
- **Index** (`wireframes/Index.dc.html`) — a contents page linking every file; open this first.

---

## Interactions & Behavior
- **Receipt tap → source.** Every post's receipt link (and kill-list/permalink receipts) navigates to the source. In-app: route to the relevant research page section (`/research/<account>#<section>`), or open the attached receipt panel (as on the permalink). The prototype wires this via a `onReceipt(post)` callback on PostCard.
- **Feed toggle** Following ↔ Everything swaps the post source (Following = the user's followed accounts; Everything = all ~140). Active segment turns pink.
- **Follow / Following** toggles per account; "Following" renders on pink `#FF6B9D`. Follow appears on cards, profiles, tiles, and onboarding.
- **Onboarding selection** toggles per-account (checkbox fills black + check; row tints `#FFF4CC`); bundle buttons select several at once.
- **Button press** everywhere uses the stamp-press active state (`translate(2px,2px)`, shadow removed).
- **No infinite scroll / no pull-to-refresh.** The feed reaches a designed terminator and stops.
- **Toggles** (settings) are the pill control; on = yellow track + black knob at right.
- **Responsive:** two explicit breakpoints are designed — mobile ≈375px (single column, bottom nav) and desktop 1280px (multi-column, top chrome bar). Between them, collapse rails first, then reduce the feed column; keep the 640/600px reading measures as max-widths.

## State Management
Minimum client state to implement the prototypes as shown:
- `feedMode: 'following' | 'everything'` (Home Feed toggle) → selects the post list.
- `following: Set<accountHandle>` → drives every Follow/Following button.
- `watchlistSelection: Set<accountHandle>` (Onboarding) → seeds `following` on continue.
- `route / activeView` — for the prototype's feed ↔ receipt navigation; in-app this is real routing (feed, permalink, profile, research, kill list, tripwires, explore, pricing, settings, landing, auth).
- `authState: 'signedOut' | 'linkSent' | 'signedIn'` (Auth).
- `subscription: 'free' | 'reader' | 'pro'` → gates research-page sections beyond §1 and Pro-only features (chat, tripwire push).
- Tripwire status (`fired`/`armed`) and Kill-List verdicts are server data.

Data fetching: feed (paginated but finite, reverse-chron), account + research pages, kill-list entries, tripwire states, account directory. Research §2+ requires an authenticated `reader`/`pro` subscription.

## Design Tokens (quick reference)
- **Colors:** page `#FFF8E7` · card `#FFFFFF` · band/inset `#FDF6E3` · ink `#000000` · yellow `#FFD700` · pink `#FF6B9D` · cyan `#5BC0EB` (hover `#4AAFDA`) · salmon `#F4845F` · lavender `#C4B5FD` · tier-solid `#7FE08A` · tier-needs `#FFD700` · tier-disputed `#FF7A7A` · check-green `#2DC653` · muted `#6B6B6B` / `#767676`.
- **Radius:** `0` everywhere (exception: settings toggle track = pill).
- **Border:** `2px solid #000000` (default). Reply left border `4px solid #F4845F`; blockquote/inset left border `4px solid #000`.
- **Shadow:** `2px 2px 0 0 #000000` (in-app elevation). `2px 2px 0 0 #FFD700` on some CTAs. Never blurred.
- **Spacing:** 4 · 8 · 12 · 16 · 24 · 32.
- **Type:** Space Grotesk (400/700) reading; Space Mono (400/700) metadata/labels. Body 16/1.55.
- **Layout measures:** feed column 640px · reading column 600px · right rail 300px · research TOC 220px · settings nav 180px · mobile 375–393px.

## Assets
- **Fonts:** Space Grotesk + Space Mono via Google Fonts (link above). Self-host in production if preferred.
- **Icons:** all icons are inline SVG (stroke-based, `stroke-width:2`, `stroke:#000`) — search, share/link (nodes), building (company), hourglass/funnel (chokepoint), connected-nodes (theme), warning triangle (tripwire), lock (paywall), back arrow, envelope, checkmarks, kind glyphs, nav glyphs. Reproduce with your icon library (or copy the SVGs from the files) keeping the 2px black stroke look. **No icon fonts, no emoji.**
- **Images:** none. Avatars are monogram tiles / node glyphs, not photos. If real company logos are ever introduced, keep them inside the 2px-bordered 0-radius tile.
- **No raster assets** ship with this design.

## Content (use ONLY this sample research — no invented numbers)
All copy in these files is drawn from the brief's sample content. When building demo/fixtures, reuse it verbatim; do not invent figures.
- **@CORZ** (company): "Q1 numbers are in. Colocation revenue $77.5M — first quarter it beat our own bitcoin mining. The pivot is real." — tier Solid (from the 10-Q).
- **@CRWV** (company): quote of @CORZ — "That colocation revenue? 100% of it is us. One customer. Their filing says it, not us. Sleep well, bondholders." — Solid (10-K, customer concentration). Bio references $25B debt, a $3.3B project bond at 7.75%, single customer as both revenue and collateral.
- **@who-holds-the-risk** (theme, reply to @CRWV): "…that one customer relationship is financed by a $3.3B project bond at 7.75%. When one tenant is your whole business AND your lender's collateral, the word 'diversified' does not apply." — Solid.
- **@transformer-supply** (chokepoint, thread 1/6): "Lead times for large power transformers: still 128–144 weeks. That's ~3 years to get the thing every new datacenter needs. Nobody panicked. They probably should." — Solid.
- **@NVDA** (company): "Analysts think my next architecture doubles memory bandwidth again. They've been right before. They've also been early before. Filed under: we'll see." — **Needs checking** (estimate).
- **@HBM-memory** (chokepoint, open question): "…can anyone besides three companies on earth actually make me at scale? So far: no." — **Open question**.
- **Kill List:** "WUS makes ~45% of NVIDIA's switch PCBs" → **KILLED** (not in the company's own listing docs; verified 10.3% of datacenter PCBs, 12.5% of switch/router). Plus SURVIVED / PARTLY TRUE examples in the file.

## Files
All under `wireframes/`:
- `Index.dc.html` — **start here**, links everything
- `Component Library.dc.html` — tokens + component source of truth
- `PostCard.dc.html`, `AccountTile.dc.html` — reusable components
- `Home Feed.dc.html`, `Post Permalink.dc.html`, `Account Profile.dc.html`, `Research Page.dc.html` — P0 screens
- `Kill List Board.dc.html`, `Tripwire Board.dc.html`, `Explore Directory.dc.html`, `Pricing.dc.html`, `Auth.dc.html`, `Onboarding.dc.html`, `Settings.dc.html`, `Landing.dc.html` — P1/P2 screens
- `Daily Loop Prototype.dc.html` — clickable flow
- `Rationale Memo.dc.html` — design decisions ↔ principles
- (`support.js` is the prototype runtime only — **ignore when porting**.)

## Screenshots (visual targets)
Rendered stills of every screen live in `screenshots/`. Each shows the **mobile + desktop** frames side by side (top-anchored; the full page continues below the fold — open the corresponding `.dc.html` for complete detail). Use these as the pixel target alongside the spec.
- `00-component-library.png` — tokens + component reference
- `01-02-home-feed.png` — Home Feed (logged-out/Everything + logged-in/Following + right rail)
- `03-post-permalink.png` — Post Permalink with the receipt panel opened
- `04-account-profile.png` — Account Profile (@CRWV)
- `05-research-page.png` — Research Page + honest paywall gate
- `06-kill-list-board.png` — Kill List (KILLED / SURVIVED / PARTLY TRUE)
- `07-tripwire-board.png` — Tripwire board (FIRED / ARMED)
- `08-explore-directory.png` — Explore / accounts directory
- `09-pricing.png` — Pricing (Free / Reader / Pro)
- `10-auth.png` — Auth magic-link (both states + desktop card)
- `11-onboarding.png` — Onboarding / seed watchlist
- `12-settings.png` — Settings & subscription
- `13-landing.png` — Landing page
- `14-daily-loop-prototype.png` — the clickable daily-loop flow

## The one test that matters
**Does a single screenshotted post carry its own credibility?** By construction, yes — handle, kind, tier chip, receipt link, and freshness all live inside the card. Preserve that property above all when porting: the trust band is structure, not metadata, and it must never be dropped, collapsed, or moved out of the card.
