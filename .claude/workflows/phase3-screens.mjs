export const meta = {
  name: 'phase3-screens',
  description: 'Build the 9 Phase 3 static screens for Ticker (4 parallel group-agents)',
  phases: [{ title: 'Build screens', detail: 'marketing · feed-unit · account · boards' }],
};

const REPO = '/Users/victor_he/Projects/kicker-app';

const CHEAT_SHEET = `
You are building ONE group of static screens for Ticker, a neo-brutalist "paper terminal" finance-research app.
Phases 0-2 are done: the design system components, the content fixtures, and the loaders all exist. Your job is to
compose them into pages. DO NOT re-implement any existing component - import it. DO NOT modify anything under
src/components/, src/lib/, or src/app/layout.tsx. Create ONLY your route files (and co-located sub-components inside
your own route folder, e.g. src/app/feed/RightRail.tsx - non-page files in a route dir are not routes).

== GLOBAL CHROME (already rendered by the root layout - DO NOT add your own) ==
The root layout renders a desktop yellow TopBar (TICKER + tagline + search + Sign up) and a mobile yellow BottomNav
(FEED/EXPLORE/KILL/TRIP/PROFILE). Your page renders ONLY the content inside <main>, which is:
  <main class="mx-auto w-full max-w-[1280px] px-4 pb-24 md:px-6 md:pb-10">
So build page content only. Per-screen chrome bits in the wireframes (feed toggle, back button, page label) go in your
content area, NOT a new top bar. The mobile wireframes show a status bar + top bar + bottom nav as part of the device
frame - ignore those; the layout provides the real chrome.

== DESIGN TOKENS (Tailwind; use these, never hardcoded hex in className) ==
bg-page #FFF8E7 · bg-card #FFFFFF · bg-band #FDF6E3 · bg-surface-alt #FFF4CC · bg-yellow #FFD700 · bg-pink #FF6B9D
· bg-cyan (hover bg-cyan-hover) · bg-salmon · bg-lavender · bg-ink #000 · text-muted #6B6B6B · text-muted-alt #767676
· text-on-dark-alt #E0E0E0 · bg-tier-solid #7FE08A · bg-tier-needs #FFD700 · bg-tier-disputed #FF7A7A
Border = 2px solid black is the default \`border\` (also border-t/b/l/r, border-4 for 4px). shadow = 2px 2px 0 0 #000
(also shadow-hard-yellow, shadow-hard-pink). radius 0 everywhere. Fonts: font-sans (Space Grotesk, reading/headings),
font-mono (Space Mono, labels/handles/metadata). Use ARBITRARY px for exact sizes: text-[16px], px-[14px], gap-[12px],
leading-[1.55], tracking-[0.08em]. Match the wireframe's exact px/hex values.

== COMPONENTS (import from these exact paths) ==
'@/components/feed/PostCard'        <PostCard post={Post} receiptHref?={string} interactive?={bool} className? />
'@/components/feed/Terminator'      <Terminator className? />
'@/components/feed/KillListCard'    <KillListCard claimId claim verdict={'killed'|'survived'|'partly'} verdictNote? explanation receipts receiptHref? related?={string[]} className? />
'@/components/feed/TripwireRow'     <TripwireRow status={'fired'|'armed'} statement account?={{handle,kind}} when postHref? showAccount?=true divider?=true /> ; <TripwireGroupHeader account={{handle,kind,avatar?}} />
'@/components/wiki/PaywallGate'     <PaywallGate title? subtitle? includes?={string[]} ctaLabel? ctaHref? reassurance? className? />
'@/components/ui/AccountTile'       <AccountTile account={{handle,kind,avatar?,desc,following?}} href?={profileHref} className? />
'@/components/ui/TierChip'          <TierChip tier={Tier} qualifier? size?={'hero'|'post'|'inline'|'mini'} label? className? />
'@/components/ui/Avatar'            <Avatar kind={Kind} text? size?=42 className? />
'@/components/ui/KindBadge'         <KindBadge kind size?={'default'|'sm'|'xs'} showIcon?=true className? />
'@/components/ui/Button'            <Button variant?={'primary'|'subscribe'|'secondary'|'follow'|'ghost'} size?={'lg'|'md'|'sm'|'xs'} href? className?>label</Button>  (renders <a> when href given)
'@/components/ui/FollowButton'      <FollowButton following? size? /> (client)
'@/components/ui/IconButton'        <IconButton label size?=34>icon</IconButton> (client)
'@/components/ui/Input'             <Input placeholder .../>
'@/components/ui/Checkbox'|'Toggle' (client)
'@/components/ui/FeedToggle'        <FeedToggle value?={'following'|'everything'} onChange? /> (client) + type FeedMode
'@/components/ui/MentionChip'       <MentionChip href? size?={'md'|'sm'}>@handle</MentionChip>
'@/components/ui/ReceiptLink'       <ReceiptLink href? size?={'post'|'md'|'sm'}>label</ReceiptLink>  (renders "label →")
'@/components/ui/FreshnessStamp'    <FreshnessStamp>verified 2d ago</FreshnessStamp>
'@/components/ui/SectionDivider'    <SectionDivider>Posts · newest first</SectionDivider>  (label + 2px rule)
'@/components/ui/FilterChips'       <FilterChips options={[{value,label}]} value onChange active?={'pink'|'yellow'} label? /> (client)
'@/components/ui/RailCard'          <RailCard header?={node} headerBg?={'cream'|'yellow'} shadow? bodyClassName?>body</RailCard>
'@/components/ui/Skeleton'          <Skeleton/> , <PostCardSkeleton/>
'@/components/ui/Icons'             SearchIcon ShareIcon CompanyIcon ChokepointIcon ThemeIcon WarningIcon LockIcon CheckIcon (all <Icon size? className? />, currentColor stroke)

== DATA (server-side loaders - your pages are SERVER components; only mark 'use client' for small interactive islands) ==
'@/lib/content':  getPosts() getAccounts() getAccount(handle) getKillList() getTripwires() getSources()
                  getResearchPage(slug) getResearchPages() receiptHref(post) postResearchSection(post)
'@/lib/links':    profileHref(handle) permalinkHref(post) researchHref(slug, section?) slugify(s)
'@/lib/types':    types Post, Account, Kind, Tier, KillListEntry, Tripwire, ResearchPage
NEVER hardcode content facts - pull from the loaders. (UI labels like "Posts · newest first" are fine.)
Account fields: handle, kind, display_name?, domain?, avatar?, desc, bio, persona_card, freshness?, research_slug?,
supply_chain?[], knows?[{claim,tier}]. Post fields: id?, handle, kind, time, body, tier, qualifier?, source, freshness,
avatar?, variant?, following?, replyTo?, thread?, threadNext?, quoted?.

== HARD RULES (violations rejected) ==
- NO engagement metrics anywhere (no like/reply/repost/view counts). - Trust band (tier+receipt+freshness) is always
  present on PostCard (it handles this). - Describe, don't recommend: no buy/sell, price targets, bullish/bearish.
- 0 radius everywhere. No blur/gradient/glassmorphism. The paywall gate has NO blur-tease/countdown/fake-scarcity.
- Use ONLY the fixture content (verbatim). Never invent a ticker/number/claim.

== RESPONSIVE ==
Mobile-first: default styles = mobile (single column, stacked). Add md: for desktop (>=768px). Collapse right rails on
mobile (hidden md:block), then the reading column. Reading max-widths: feed column max-w-[640px]; permalink & research
reading column max-w-[600px]; right rail w-[300px]; research TOC w-[220px]. Center the content column(s).

== SEO ==
Each page exports \`metadata\` (title + description). Dynamic routes export generateMetadata.

== BEFORE YOU CODE ==
Read your wireframe .dc.html AND its screenshot .png (both listed in your task) to get exact layout, copy, and px/hex
values. Match both breakpoints. Do NOT run pnpm build/dev/lint (parallel runs collide) - just write correct code.
Report back: the files you created and any assumption or deviation from the wireframe.
`;

const GROUPS = [
  {
    key: 'marketing',
    prompt: `${CHEAT_SHEET}

== YOUR GROUP: marketing (Landing + Pricing) ==
1. \`/\` Landing -> OVERWRITE ${REPO}/src/app/page.tsx (replace the Phase 0 placeholder).
   Wireframe: ${REPO}/design/wireframes/Landing.dc.html ; screenshot: ${REPO}/design/screenshots/13-landing.png
   Hero (yellow "The anti-FinTwit" pill + big headline + subhead + cyan "Read the feed - free" -> /feed + secondary
   "See how it works"); desktop hero is split with a LIVE feed preview panel (real PostCards from getPosts(), in a
   #EDE4CF panel) captioned "This is the actual feed - not a mockup". Trust-trio cards (tier chips / receipt+freshness
   / a KILLED kill-list snippet from getKillList()). Pricing teaser black band -> /pricing. Reuse PostCard, TierChip,
   ReceiptLink, Button, KillListCard (or a compact snippet). The primary CTA links to /feed.
2. \`/pricing\` Pricing -> ${REPO}/src/app/pricing/page.tsx
   Wireframe: ${REPO}/design/wireframes/Pricing.dc.html ; screenshot: ${REPO}/design/screenshots/09-pricing.png
   Three tiers: Free $0 (white header) / Reader $20/mo (cyan header, elevated -translate-y + 4px... use shadow, "most
   readers pick this" badge) / Pro $40/mo (black header, yellow price). Feature rows: green check (text-[#2DC653] or
   tier-solid) vs muted "-". Honest footer "Cancel anytime · no countdowns · no fake scarcity · the feed stays free
   forever." CTAs link to /pricing or a sign-up stub (use href="/pricing" placeholders; auth is Phase 6).`,
  },
  {
    key: 'feed-unit',
    prompt: `${CHEAT_SHEET}

== YOUR GROUP: feed-unit (Home Feed + Permalink + OG image) ==
1. \`/feed\` Home feed -> ${REPO}/src/app/feed/page.tsx
   Wireframe: ${REPO}/design/wireframes/Home Feed.dc.html ; screenshot: ${REPO}/design/screenshots/01-02-home-feed.png
   Desktop: centered row, feed column w-[640px] + right rail w-[300px], gap-[24px]. Mobile: single column, rail hidden.
   At the TOP of the feed column render a <FeedToggle/> row (a small client island - Following/Everything; both modes
   show all getPosts() for now, Phase 6 wires real filtering) with a mono context label. Then map getPosts() to
   <PostCard post={p} receiptHref={receiptHref(p)} interactive/> (gap-[14px] between). End with <Terminator/>.
   Right rail (hidden md:block): three RailCards - (a) Kill List highlight (yellow header "KILL LIST"/"latest": the
   first getKillList() entry's claim + its verdict stamp + a receipts ReceiptLink -> /kill-list); (b) Tripwires (yellow
   header: first ~3 getTripwires() as compact rows - 14px status square + statement + @handle + FIRED/ARMED, linking
   to /tripwires); (c) Reader upsell (cream, "Read the receipts in full." + cyan Button -> /pricing). The feed toggle
   island can live in src/app/feed/FeedControls.tsx.
2. \`/p/[postId]\` Permalink -> ${REPO}/src/app/p/[postId]/page.tsx  (+ generateMetadata for SEO/OG)
   Wireframe: ${REPO}/design/wireframes/Post Permalink.dc.html ; screenshot: ${REPO}/design/screenshots/03-post-permalink.png
   getPosts().find(p => p.id === params.postId); 404 (notFound()) if missing. Reading column max-w-[600px] centered +
   right rail w-[300px] (desktop). Show: a mono eyebrow "▸ the shared post"; the <PostCard post={post}/> (wrap in a
   div with shadow); DIRECTLY below, an ATTACHED "receipt panel" (border, border-t-0, black header bar "↳ The receipt"):
   source location line ("<TICKER> · research page · § <section>"), an excerpt inset (bg-band, border-left-4 border-ink)
   using the research section body if postResearchSection(post) resolves (getResearchPage(slug).sections.find section
   body) else the post.source text, the tier chip + freshness, and an "Open full research page →" Button linking to
   researchHref(...). Then a <SectionDivider>1 reply</SectionDivider> and any reply PostCards (posts where
   replyTo === post.handle). Mobile: a "You're reading one post on Ticker" explainer strip (bg-surface-alt) at top.
   Desktop right rail: a "New here? How to read this" RailCard (yellow header) with the 3 tier chips + a "Create free
   account" cyan Button -> /pricing. Build a co-located ReceiptPanel.tsx if helpful.
   generateMetadata: title = "<handle> on Ticker", description = post.body (truncated); openGraph with the og image.
3. OG image -> ${REPO}/src/app/p/[postId]/opengraph-image.tsx  using next/og ImageResponse (size 1200x630). Render the
   post as a brand-styled card with INLINE styles (next/og supports flexbox + inline styles only, NOT Tailwind):
   cream #FFF8E7 background, a white card with 2px black border, the handle (mono), the body (Space Grotesk-ish), a
   tier chip (two cells, tier color + label), and "source: <post.source>" + freshness in the trust band. Custom fonts
   are optional (a system fallback is acceptable) - focus on a legible, on-brand card. export const runtime = 'edge'
   is optional; export const alt, size, contentType per next/og docs. Look up post via getPosts().find.`,
  },
  {
    key: 'account',
    prompt: `${CHEAT_SHEET}

== YOUR GROUP: account (Profile + Research) ==
1. \`/u/[handle]\` Profile -> ${REPO}/src/app/u/[handle]/page.tsx  (+ generateMetadata)
   Wireframe: ${REPO}/design/wireframes/Account Profile.dc.html ; screenshot: ${REPO}/design/screenshots/04-account-profile.png
   const account = getAccount('@' + params.handle); notFound() if missing. Header (border-b card): Avatar (size 64
   mobile / 88 desktop), handle (mono, 26px desktop), <KindBadge kind/>, a lavender domain MentionChip-style chip
   (account.domain), the first-person bio (account.bio), and a "research verified" freshness with a green square
   (account.freshness). A Follow/Following button top-right (<FollowButton/>). Desktop: main column w-[600px] + right
   rail w-[300px].
   Main column: "What @<handle> knows" RailCard (cream header) listing account.knows[] - each claim + its <TierChip
   size="inline"/> (render only if account.knows exists). Then a "research door" black card (bg-ink text-page) ->
   "Open research page →" Button (cyan, shadow-hard-yellow) to researchHref(account.research_slug) - only if
   research_slug exists. Then a <SectionDivider>Posts · newest first</SectionDivider> and the account's posts:
   getPosts().filter(p => p.handle === account.handle) as <PostCard/>s (may be just one - that's fine).
   Desktop right rail: the "What knows" card can live here on desktop (per wireframe) + a "Its supply chain" cream
   RailCard of lavender MentionChips from account.supply_chain[] (each links profileHref). Choose a layout that matches
   the screenshot at both breakpoints.
   generateMetadata: title "<handle> on Ticker", description account.bio.
2. \`/research/[slug]\` Research page -> ${REPO}/src/app/research/[slug]/page.tsx  (+ generateMetadata)
   Wireframe: ${REPO}/design/wireframes/Research Page.dc.html ; screenshot: ${REPO}/design/screenshots/05-research-page.png
   const page = getResearchPage(params.slug); notFound() if missing. Desktop: sticky TOC w-[220px] (position sticky
   top-[...]) + reading column w-[600px]. TOC lists page.sections (active = first/free with a green square + border-left;
   locked = lock icon + muted), plus a "Tiers on this page" legend (TierChips). Reading column: eyebrow "Research page ·
   <account> · <kind> · <domain>", title (page.title, big Grotesk), a freshness line ("<page.freshness> · <section_count>
   sections · every claim sourced" with green square). Then the FREE section (the one with locked===false): §1 heading +
   its <TierChip qualifier/> + full body (whitespace-pre-line, 17px/1.7) ending on a HARD EDGE (no blur/fade) + a
   ReceiptLink ("receipt: <section.receipt>"). Then the honest gate: use <PaywallGate/> (it already has the lock,
   contents list, cyan "Unlock Reader — $20/mo", "Cancel anytime" line - NO blur/countdown). Then the honest locked
   list: each locked section as a bg-band row (LockIcon + title + descriptor + its TierChip size="mini"). ALL sections
   render locked for now (real gating is Phase 7). Mobile: single column (TOC omitted or collapsed).
   generateMetadata: title page.title, description the free section body (truncated).`,
  },
  {
    key: 'boards',
    prompt: `${CHEAT_SHEET}

== YOUR GROUP: boards (Kill List + Tripwires + Explore) ==
1. \`/kill-list\` -> ${REPO}/src/app/kill-list/page.tsx
   Wireframe: ${REPO}/design/wireframes/Kill List Board.dc.html ; screenshot: ${REPO}/design/screenshots/06-kill-list-board.png
   Heading "The Kill List" + intro + a <FilterChips active="pink"/> row (All/Killed/Survived/Partly) as a small client
   island that filters getKillList(). Desktop: 2-col grid of <KillListCard/> (map getKillList(): claimId=id, claim,
   verdict, verdictNote=verdict_note, explanation, receipts, related=related_accounts). Mobile: single column. Since
   filtering is client, pass the loaded entries into a client component that holds the active filter + renders the grid.
2. \`/tripwires\` -> ${REPO}/src/app/tripwires/page.tsx
   Wireframe: ${REPO}/design/wireframes/Tripwire Board.dc.html ; screenshot: ${REPO}/design/screenshots/07-tripwire-board.png
   Header: count summary ("1 fired · 5 armed" - compute from getTripwires()) + a legend. Group getTripwires() by
   account (preserve order); for each group render <TripwireGroupHeader account={{handle,kind,avatar}}/> (look up kind
   /avatar via getAccount) then its <TripwireRow status statement={description} when postHref={t.post_id ? '/p/'+t.post_id
   : undefined} showAccount={false} divider={notLast}/> rows, inside a bordered container. Read calm by default.
3. \`/explore\` -> ${REPO}/src/app/explore/page.tsx
   Wireframe: ${REPO}/design/wireframes/Explore Directory.dc.html ; screenshot: ${REPO}/design/screenshots/08-explore-directory.png
   A search bar (client Input filtering by handle/desc), Kind FilterChips (All/Companies/Chokepoints/Themes, active
   pink) + Domain FilterChips (AI datacenter active yellow, others muted). Sections "Companies / Chokepoints / Themes",
   each a <SectionDivider> + a desktop 2-col grid of <AccountTile account={a} href={profileHref(a.handle)}/> from
   getAccounts() grouped by kind. Search + filters are client state, so pass getAccounts() into a client component that
   holds query+filters and renders the filtered, grouped tiles.`,
  },
];

phase('Build screens');
const summaries = await parallel(
  GROUPS.map((g) => () => agent(g.prompt, { label: `build:${g.key}`, phase: 'Build screens', effort: 'high' })),
);

return {
  groups: GROUPS.map((g, i) => ({ key: g.key, summary: summaries[i] })),
};
