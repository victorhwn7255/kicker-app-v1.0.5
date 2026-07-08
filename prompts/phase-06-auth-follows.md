# Phase 6 - Auth, follows & onboarding - build prompt

## Mission

Add users, watchlists, and the Following feed.
Passwordless sign-in, follow toggles everywhere, and an onboarding flow that seeds a new user's feed.

## Before you start

- You are executing ONLY Phase 6.
  Confirm Phase 5's Definition of done passes first (the engine can stay in dry-run; it does not block this phase).
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 6".
  3. `design/README.md` -> the Auth, Onboarding, and Settings screen specs.
  4. `design/wireframes/Auth.dc.html`, `Onboarding.dc.html`, `Settings.dc.html` and their screenshots.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 6 - Auth, follows & onboarding".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Use Supabase magic-link auth; no passwords anywhere.
  The reassurance copy matters and is in the design: "you only ever read", "we never post as you", 15-minute link expiry.
- Following mode on the feed toggle becomes a real server query filtered to the user's follows.
  Its empty state points to Explore.
- Follow/Following toggles live on cards, profiles, and tiles - all reuse the one Phase 1 button; do not fork it.
- Onboarding seeds follows: the one-tap supply-chain bundles and the pick-by-hand list both write into `follows` on continue.
- The settings toggle pill is the ONE rounded element allowed in the entire app.
  Everything else stays 0px radius.

## `[HUMAN]` stops in this phase

None new (Supabase is already provisioned from Phase 4).

## Definition of done

Per `tasks/TODO.md` Phase 6: a new user can sign up, pick a bundle, and land on a Following feed that ends at the terminator, and all Phase 3 E2E remain green.

## Report back, then stop

Report what shipped, the honest Definition-of-done result, and a suggested commit message.
Then STOP.
Do not begin Phase 7.
