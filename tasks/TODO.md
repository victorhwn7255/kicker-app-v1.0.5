# TICKER - Build Plan (TODO)

> **What this file is.**
> The master build guide for the Ticker web app (repo folder: `kicker-app`).
> It breaks the entire build into 10 phases (0-9) from empty repo to public launch, plus 2 post-launch phases.
> Claude Code agents: work ONE phase at a time, in order, top to bottom.
> Check off tasks as you complete them and update the status table below.
> Do not start a phase before the previous phase's "Definition of done" fully passes.
> Do not commit or push; the user handles all git operations (see CLAUDE.md).

## Read these before writing any code

1. `CLAUDE.md` - engineering rules for this repo. They override your defaults.
2. `design/README.md` - the design handoff. The single source of truth for all UI: tokens, components, screens, states, content. Pixel-accurate porting is required.
3. `design/wireframes/Index.dc.html` - open in a browser; links every wireframe. `Component Library.dc.html` holds exact values.
4. `plan/project-overview.html` - what the product is and why.
5. `plan/system-design.html` - the architecture: zones, data model, flows, stack.
6. `references/slock-theme.json` - raw design token values (the design README's token table is the curated subset; prefer the README where they differ).

## Product hard rules (violations = rejected work, any phase)

- **No engagement metrics anywhere.** No like/reply/repost/view counts. Not in UI, not in the database schema.
- **Describe, don't recommend.** No buy/sell language, no price targets, no bullish/bearish meters, no price charts. This is a legal boundary.
- **The trust band is structure, not metadata.** Every rendered post always shows tier chip + receipt link + freshness. Never dropped, collapsed, or moved out of the card.
- **No fact ever originates in this app.** Content comes from fixtures or the content bridge; the tweet engine may only reword source text it is given (Phase 5).
- **Design system is law.** 0px border radius (one exception: settings toggle pill). 2px solid black borders. One hard shadow `2px 2px 0 0 #000`. No gradients, no blur, no glassmorphism, no blur-tease paywalls, no fake scarcity.
- **Sample content only.** Use the fixtures from `design/README.md` "Content" section verbatim. Never lorem ipsum, never invented tickers or numbers.

## Agent boundaries (read before executing anything)

- **`design/`, `plan/`, and `references/` are READ-ONLY.** They are the source of truth for what to build. Never edit, move, or delete anything in them.
- **This file:** update ONLY the status tracker and task checkboxes (plus short notes on skipped/changed tasks). Do not rewrite the plan itself; plan changes are a user decision.
- **Secrets:** never write a real key into any committed file. Real values go in `.env.local` (gitignored) and the Vercel dashboard only. `.env.example` holds names and placeholders.
- **`[HUMAN]` tasks** need the user's accounts, payments, or DNS. When you reach one, stop and ask the user to do it (or to provide the resulting keys); do not fake, stub around silently, or create accounts yourself.
- **Never enable the tweet engine outside dry-run without explicit user approval.** Publishing AI-generated posts is a user decision, twice: once for staging, once for production.
- **Git is the user's.** No commits, no pushes, no PRs (see CLAUDE.md). Recommend a commit to the user at each phase boundary, then stop.

## Status tracker

| Phase | Name | Status |
|---|---|---|
| 0 | Scaffold & foundations | awaiting [HUMAN] Vercel deploy |
| 1 | Design system & core components | not started |
| 2 | Content layer & fixtures | not started |
| 3 | Static screens (read-only product) | not started |
| 4 | Database & live content | not started |
| 5 | The tweet engine | not started |
| 6 | Auth, follows & onboarding | not started |
| 7 | Payments & paywall | not started |
| 8 | Email | not started |
| 9 | Launch hardening | not started |
| 10 | Ask-the-Vault chat (post-launch) | not started |
| 11 | Mobile & push (post-launch) | not started |

---

## Phase 0 - Scaffold & foundations

**Goal:** a deployable skeleton with the design tokens installed, so every later phase builds on rails.

- [x] Initialize Next.js 15 (App Router) + TypeScript + Tailwind CSS in the repo root. Package manager: pnpm.
- [x] Translate the design tokens into the Tailwind config: colors, spacing scale (4/8/12/16/24/32), shadow (`2px 2px 0 0 #000`), border defaults, zero radius. Source: `design/README.md` "Design Tokens (quick reference)".
- [x] Load Space Grotesk (400/700) + Space Mono (400/700) via `next/font` (self-hosted, not runtime Google Fonts).
- [x] Global CSS: cream page background `#FFF8E7`, base type 16px/1.55, `text-wrap: pretty` for post bodies.
- [x] Folder structure per `plan/system-design.html`: `src/app`, `src/components/{feed,wiki,ui}`, `src/lib`, `content/`, `e2e/`, `scripts/`.
- [x] App shell layout: desktop yellow top chrome bar (56-58px, logo "TICKER" + mono tagline) and mobile yellow bottom nav (5 tabs: FEED / EXPLORE / KILL / TRIP / PROFILE, active tab = pink square). Static links only for now.
- [x] `.env.example` documenting every env var the project will use (Supabase, Stripe, Resend, model API); nothing secret committed.
- [x] Playwright installed with one smoke test: home page renders, chrome visible, fonts loaded.
- [ ] `[HUMAN]` Create the Vercel project (separate from any other project, user's account) and confirm a hello-world deploy. Agent prepares the repo; user connects it to Vercel.
  - Note: repo is deploy-ready (`pnpm build` passes clean). Awaiting user to connect the repo to Vercel and confirm the hello-world deploy.

**Definition of done:** `pnpm build` passes; the deployed skeleton shows the chrome on mobile and desktop; tokens verifiably present (a test page rendering token swatches matches the Component Library).

---

## Phase 1 - Design system & core components

**Goal:** every reusable component, pixel-matched to the wireframes, before any screen exists.

- [ ] `TierChip` - the two-cell stamp (glyph cell + label cell, 2px divider), all four tiers (solid `✓` green, needs `~` yellow, disputed `✕` red, open `?` black/white), both sizes. Label always carries meaning; color only reinforces.
- [ ] Avatar system - kind-keyed monogram tiles: company (white bg, ticker text), chokepoint (black bg, code), theme (cream bg, nodes glyph). Sizes 24-88px, 2px border, 0 radius.
- [ ] Kind badges (Company / Chokepoint / Theme) with stroke icons.
- [ ] `PostCard` - the atom of the product. Implement the full data contract from `design/README.md` (the `Post` type) and ALL variants: original, quote (nested inset), reply (salmon left border + `↳ replying to`), thread (`1/6` badge + next-segment pointer), high-stakes (black header bar), plus the trust band (tier chip, receipt link with yellow hover fill and 44px tap target, freshness stamp). `onReceipt` callback drives navigation.
- [ ] `AccountTile` - directory row per `AccountTile.dc.html`.
- [ ] Buttons and inputs - default/hover/active/focus states exactly as specified: instant color swaps, stamp-press active (`translate(2px,2px)`, shadow removed), pink focus rings.
- [ ] Follow / Following button (pink when following).
- [ ] Feed toggle (Following / Everything segmented control).
- [ ] The "You're caught up" terminator (black card, yellow mono eyebrow).
- [ ] Kill-list card (yellow header, claim blockquote, verdict stamps KILLED / SURVIVED / PARTLY TRUE, trust band).
- [ ] Tripwire row (status square + always-present FIRED/ARMED word, fired-row red tint) and account group header.
- [ ] Paywall gate card (black card, plain-language contents list, cyan CTA, no blur, no countdown).
- [ ] Mention chips (lavender) and receipt link as standalone primitives.
- [ ] Loading skeletons: hard-bordered blocks with opacity pulse. No shimmer sweep.
- [ ] Build `/dev/components` - a preview page rendering every component and state, side-by-side comparable with `Component Library.dc.html`.

**Definition of done:** `/dev/components` visually matches the Component Library wireframe and `screenshots/00-component-library.png` (open both, compare with an obsessive eye per CLAUDE.md); a cropped screenshot of a single PostCard carries handle, kind, tier chip, receipt, freshness; all interactive states work by keyboard.

---

## Phase 2 - Content layer & fixtures

**Goal:** typed content, validated in CI, seeding the app with the sample research.

- [ ] Define zod schemas + TS types in `src/lib/types.ts`: `Account`, `Post`, `SourceSection`, `KillListEntry`, `Tripwire`, `ResearchPage` (fields per `plan/system-design.html` data model).
- [ ] Create `content/` fixtures from the design README "Content" section: 6+ accounts (@CORZ, @CRWV, @NVDA, @transformer-supply, @HBM-memory, @who-holds-the-risk), the 6 sample posts (one per variant), 3 kill-list entries (one per verdict), tripwires (1 fired, 5 armed), 1 research page (CRWV: free section 1 + locked section stubs with titles/descriptors/tiers).
- [ ] Content loaders in `src/lib/content.ts` (read + zod-parse + typed access).
- [ ] `scripts/validate-content.ts` - fails the build on any schema violation; wire into `pnpm build` / CI.
- [ ] Persona-card format defined (`Account.persona_card`): voice description + constraints. Write persona cards for the 6 fixture accounts (bios exist in the design files; e.g. @CRWV's bio is in `Account Profile.dc.html`).

**Definition of done:** `pnpm validate-content` passes; a deliberately broken fixture fails CI; loaders return typed data consumed by a test page.

---

## Phase 3 - Static screens (the read-only product)

**Goal:** the complete product experience on fixture content. After this phase the app is demoable end to end without a database.

Build each screen against its wireframe + screenshot. Mobile (375px) and desktop (1280px); collapse rails first between breakpoints; reading measures 640px (feed) / 600px (permalink, research) as max-widths.

- [ ] `/` Landing - hero, live feed preview panel, trust trio cards, pricing teaser. (`Landing.dc.html`)
- [ ] `/feed` Home feed - Everything mode from fixtures, right rail (kill-list highlight, tripwires, Reader upsell), terminator at the end. Toggle renders but Following mode can stub to Everything until Phase 6. (`Home Feed.dc.html`)
- [ ] `/p/[postId]` Permalink - post + attached receipt panel (opened state), reply below with salmon connector, first-time-visitor explainer strip + "how to read this" rail card. (`Post Permalink.dc.html`)
- [ ] `/u/[handle]` Profile - persona header, "What @X knows" tier-chipped claims card, research-door black card, post history, supply-chain chip cloud (desktop rail). (`Account Profile.dc.html`)
- [ ] `/research/[slug]` Research page - sticky TOC with lock states + tier legend, free section 1 ending on a hard edge, the honest gate, legible locked-section list. All sections render locked for now (real gating in Phase 7). Receipt links from posts deep-link to `#section` anchors. (`Research Page.dc.html`)
- [ ] `/kill-list` - filter chips (All/Killed/Survived/Partly, active = pink), 2-col desktop grid. (`Kill List Board.dc.html`)
- [ ] `/tripwires` - count summary + legend, account-grouped rows, fired rows link to their post. (`Tripwire Board.dc.html`)
- [ ] `/explore` - search bar (client-side filter over fixtures), kind + domain filter chips, AccountTile sections. (`Explore Directory.dc.html`)
- [ ] `/pricing` - Free / Reader / Pro columns, Reader elevated with badge, honest footer. CTAs link to auth (stub). (`Pricing.dc.html`)
- [ ] SEO: metadata per route; OpenGraph tags; permalinks get OG images that render the PostCard (the shareable unit; use `@vercel/og` or `next/og`).
- [ ] Wire the daily loop: feed → receipt tap → research section → back → terminator. Must match `Daily Loop Prototype.dc.html`.
- [ ] Playwright: one E2E per screen (renders, no console errors) + the daily-loop flow test.

**Definition of done:** every screen matches its screenshot in `design/screenshots/` on both breakpoints; the daily loop completes by tap/click only; Lighthouse accessibility ≥ 95 on feed, permalink, research; all E2E green.

---

## Phase 4 - Database & live content

**Goal:** swap fixtures for Supabase so content can grow without deploys. The app renders identically before/after.

- [ ] `[HUMAN]` Create the Supabase project (user's account) and provide the URL + keys via `.env.local` / Vercel env.
- [ ] Define the schema via SQL migrations (committed to the repo): `accounts`, `sources`, `posts`, `post_history`, `kill_list`, `tripwires`, `wiki_pages` (+ `users`, `follows`, `subscriptions` created now, used in Phases 6-7).
- [ ] RLS enabled from day one: public read on published content tables; no public writes; service-role for the engine and import scripts.
- [ ] `scripts/seed.ts` - imports the `content/` fixtures into Supabase. Idempotent (safe to re-run).
- [ ] Repoint loaders: pages read from Supabase (server-side) with ISR/revalidation; feed revalidates on new posts. Keep zod parsing at the boundary.
- [ ] `content/` + the validator remain the ingestion path: bridge files land in `content/`, validated, then imported by the seed/import script. (The vault-side publish skill that produces these files is EXTERNAL to this repo; fixtures stand in until it exists.)

**Definition of done:** app renders identically to Phase 3 (E2E suite still green) with data served from Supabase; re-running the seed does not duplicate rows; RLS verified (anonymous key cannot write).

---

## Phase 5 - The tweet engine

**Goal:** living accounts. Scheduled, grounded, verifier-gated post generation.

The one non-negotiable rule: **the model never writes from its own memory. It only rewords the source section it is handed.** Fail-closed: unverified posts are dropped, never published.

- [ ] Install the Vercel AI SDK; provider config via env (`MODEL_PROVIDER`, `MODEL_BASE_URL`, `MODEL_API_KEY`). Dev: NVIDIA NIM free endpoint. Prod: a US-hosted provider (Fireworks / Together / OpenRouter). Model choice must be a config change only. `[HUMAN]` provides the API keys.
- [ ] Planner (`src/lib/engine/planner.ts`, deterministic code): picks account + trigger in priority order: (a) new content in `sources`, (b) event peg, (c) conversation (reply/quote to a recent sibling post), (d) rotation of least-recently-used section. Frequency caps scale with account reservoir size.
- [ ] Generator: prompt = persona card + ONE source section + the account's last 20 posts. Instruction: re-express THIS in YOUR voice, nothing not in the text, 400-600 chars, no buy/sell language. Produces 2-3 candidates.
- [ ] Verifier (separate call, adversarial): every claim traceable to the source text? hedges preserved? invented numbers? buy/sell language? Structured JSON verdict. Fail → regenerate (max 2), else drop and log.
- [ ] Novelty gate: embedding similarity vs `post_history`; too-similar candidates discarded.
- [ ] Publish: insert into `posts` with tier, source ref, trigger type; trigger feed revalidation.
- [ ] Vercel Cron route (`/api/engine/tick`, protected by `CRON_SECRET`): processes accounts in batches sized to stay inside function limits.
- [ ] Kill switch: `ENGINE_ENABLED` env flag; plus a dry-run mode that writes candidates to a review table instead of publishing.
- [ ] Conversation mechanic: planner can emit reply/quote posts referencing a recent post (renders via the existing PostCard variants).
- [ ] Engine unit tests with a mocked model: verifier rejection path, novelty rejection path, batching, fail-closed behavior.
- [ ] Run 1 week in dry-run on the 6 fixture accounts; read every candidate; tune persona cards and prompts.

**Definition of done:** cron runs on schedule in staging; every published post has `verified: true`, a source ref, and passes the trust-band render; a poisoned source test (instruction-injection text inside a source section) does not escape the verifier; dry-run week reviewed with zero fabricated-fact escapes.

---

## Phase 6 - Auth, follows & onboarding

**Goal:** users, watchlists, and the Following feed.

- [ ] Supabase magic-link auth; `/auth` per `Auth.dc.html` (email state + check-inbox state; 15-minute expiry copy; "we never post as you" reassurance).
- [ ] Session handling in Next.js middleware; signed-in chrome states (avatar in top bar, PROFILE tab).
- [ ] `follows` writes; Follow/Following toggles live on cards, profiles, tiles.
- [ ] `/onboarding` per `Onboarding.dc.html`: one-tap supply-chain bundles + pick-by-hand list; selection seeds `follows` on continue.
- [ ] Following mode on the feed toggle: server query filtered to followed accounts; empty state points to Explore.
- [ ] `/settings` (account section + email prefs UI; subscription section lands in Phase 7). Toggle pill is the ONLY rounded element in the app.
- [ ] E2E: magic-link flow (Supabase test helpers), follow → Following feed shows only followed accounts, onboarding seeds follows.

**Definition of done:** a new user can sign up, pick a bundle, and land on a Following feed that ends at the terminator; all Phase 3 E2E still green.

---

## Phase 7 - Payments & paywall

**Goal:** the Reader tier earns money; the paywall is honest and enforced server-side.

- [ ] `[HUMAN]` Stripe account + API keys (test mode first). Then agent creates products/prices: Reader ($20/mo) + Pro ($40/mo).
- [ ] Checkout: pricing CTAs → Stripe Checkout (hosted) → success/cancel returns.
- [ ] `/api/stripe/webhook`: signature-verified; upserts `subscriptions` on checkout complete, renewal, cancellation. This webhook is the ONLY writer of subscription state.
- [ ] Server-side gating: research sections beyond section 1 render only for active reader/pro. Enforced in the server query/RLS, not just the UI.
- [ ] Research page unlocked state (full TOC, all sections + receipts + "what would prove this wrong").
- [ ] Settings subscription section: plan chip, renewal date, upgrade CTA, "Manage billing (Stripe) ↗" to the hosted customer portal, cancel.
- [ ] E2E with Stripe test clocks: subscribe → unlock; cancel → re-lock at period end.

**Definition of done:** test-mode purchase unlocks a research page within seconds via the webhook; direct URL access to locked content while signed out or free returns the gate; no card data ever touches the app.

---

## Phase 8 - Email

**Goal:** the two earned emails: weekly digest + tripwire alerts.

- [ ] `[HUMAN]` Resend account + domain DNS records (SPF/DKIM). Then agent moves magic-link emails to the branded domain.
- [ ] Digest generator: what moved this week (new posts by trigger type, kill-list additions, tripwire changes), rendered in a bordered, on-brand HTML template. "Calm week" is a valid digest.
- [ ] Weekly cron sends the digest to Reader+ subscribers who opted in.
- [ ] Tripwire alert: when a tripwire flips to fired, email followers of that account (Pro push comes in Phase 11).
- [ ] Preference enforcement from settings toggles + one-click unsubscribe headers.

**Definition of done:** digest renders correctly in major clients (litmus-style manual check); a test tripwire fire emails exactly the right cohort once; unsubscribe works.

---

## Phase 9 - Launch hardening

**Goal:** production-ready and public.

- [ ] Full E2E pass across the 5 core flows (brief Section 7): first-visit hook, daily loop, hype-check, conversion, tripwire fire.
- [ ] Accessibility audit: WCAG 2.1 AA; keyboard-complete; tier meaning survives grayscale (screenshot proof like the Component Library's).
- [ ] Performance: static/ISR verified on all public pages; images/OG budget; no layout shift from font loading.
- [ ] Analytics: Plausible (or PostHog) wired to page views + the events that matter: receipt taps, follows, gate views, checkouts, caught-up reached.
- [ ] Error monitoring (e.g. Sentry) on app + engine; engine failures alert, never silently stop.
- [ ] Security pass: env secrets audit, webhook signature tests, rate limiting on auth + API routes, RLS re-verified.
- [ ] Legal pages: terms, privacy, and the "this is research, not investment advice" disclosure in the footer.
- [ ] `[HUMAN]` Production domain + SSL on the Vercel project; production Stripe keys; production model provider account.
- [ ] `[HUMAN]` Approve taking the engine out of dry-run for launch accounts.
- [ ] Content: import the real launch corpus from the vault bridge (external dependency: the vault-side publish skill); backfill historical posts; enable the engine out of dry-run for launch accounts.
- [ ] Soft launch: share permalinks, watch analytics + error rates for a week, then open up.

**Definition of done:** all E2E green in CI against a production build; a stranger can sign up, subscribe, and read on their phone; the engine has run 7 consecutive days in production without a fabricated-fact escape or a silent failure.

---

## Phase 10 - Ask-the-Vault chat (post-launch, Pro tier)

- [ ] `/api/ask`: agent loop (Anthropic API) with tools `search_corpus`, `read_page`, `follow_links` over the published corpus only.
- [ ] Grounding rules: cite or refuse; every answer carries tier chips + freshness; out-of-corpus questions refused plainly; no buy/sell language.
- [ ] Persona mode: ask an account directly; persona shapes tone, never facts.
- [ ] Chat UI in the design system; Pro-gated; streamed answers.
- [ ] Cost controls: prompt caching, per-user daily caps, cheap model for retrieval steps.
- [ ] Eval set before launch: ~30 questions the corpus answers + ~10 it must refuse.

## Phase 11 - Mobile & push (post-launch)

- [ ] Restructure to a Turborepo monorepo (`apps/web`, `apps/mobile`, `packages/shared`) only when this phase starts.
- [ ] Expo app: feed, permalink, profile, research reading.
- [ ] Push notifications: tripwire fires for followed accounts (the Pro retention feature).
- [ ] App store listings.

---

## Working notes for agents

- Verify every UI task against the corresponding `design/wireframes/*.dc.html` AND `design/screenshots/*.png`. The wireframes are reference designs, not production code; recreate them in React with the project's components.
- When the design README and `references/slock-theme.json` disagree, the design README wins.
- When anything here conflicts with `CLAUDE.md`, `CLAUDE.md` wins for engineering practice; this file wins for product scope and sequencing.
- Update the status tracker table and check off tasks in this file as part of finishing any work session.
- If a task turns out to be wrong or unnecessary, do not silently skip it: mark it, note why, and surface it to the user.
