# Phase 3 - Static screens (the read-only product) - build prompt

## Mission

Build the complete product experience on fixture content.
After this phase the app is demoable end to end, on mobile and desktop, without a database.
This is the first time Ticker feels real.

## Before you start

- You are executing ONLY Phase 3.
  Confirm Phase 1 (components) and Phase 2 (content) both pass first.
- Read, in this order:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 3", plus "Product hard rules".
  3. `design/README.md` -> the per-screen "Screens / Views" section.
  4. Open each screen's wireframe in `design/wireframes/` and its still in `design/screenshots/` before building it.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 3 - Static screens".
Set the status row to "in progress", tick each screen as you finish it, set it "done" at the end.

## How to execute (strategy + gotchas)

- This is the natural place for a team.
  Once the Phase 1 components and Phase 2 fixtures exist, the nine screens are largely independent.
  A sensible split: one agent per screen, or group them (landing + pricing; feed + permalink; profile + research; kill-list + tripwires + explore).
- If you fan out, give every sub-agent the same rule: reuse the Phase 1 components from `/dev/components`; never re-implement a PostCard, TierChip, or gate.
  Component drift across screens is the main risk of parallelizing - close it by importing, not copying.
- Do the P0 screens first and best: landing, feed, permalink, profile, research.
  They are the ones a stranger and a paying reader actually hit.
- Match both breakpoints: mobile 375px and desktop 1280px.
  Between them, collapse rails first, then reduce the feed column; keep 640px (feed) and 600px (permalink, research) as reading max-widths.
- The permalink is the shareable, SEO unit.
  Give it real metadata and an OG image that renders the PostCard, because that image is the product's advertising when a post is shared.
- The feed ends at the terminator.
  No infinite scroll, no pull-to-refresh spinner.
- The research page's free section ends on a hard edge with the honest gate.
  No blur-tease, no fade, no fake scarcity.
  All sections render locked for now; real payment gating is Phase 7.
- Wire the daily loop last, since it crosses screens: feed -> receipt tap -> research section anchor -> back -> terminator.
  It must match `Daily Loop Prototype.dc.html`.

## `[HUMAN]` stops in this phase

None.

## Definition of done

Per `tasks/TODO.md` Phase 3: every screen matches its screenshot on both breakpoints, the daily loop completes by tap/click only, Lighthouse accessibility is at least 95 on feed / permalink / research, and all Playwright E2E are green.

## Report back, then stop

Tell the user what shipped screen by screen, the honest Definition-of-done result (name any screen not yet matching), and a suggested commit message.
Then STOP.
Do not begin Phase 4.
