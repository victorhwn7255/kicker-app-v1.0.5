# Phase 11 - Mobile & push (post-launch) - build prompt

## Mission

Ship a native app and the push notification that makes the product sticky: a tripwire firing on an account you follow.
This is post-launch and comes only after the web feed has proven daily use.

## Before you start

- You are executing ONLY Phase 11.
  Confirm the web app is launched and being used before restructuring anything for mobile.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 11".
  3. `design/README.md` -> the screens the mobile app will carry (feed, permalink, profile, research reading) and the responsive notes.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 11 - Mobile & push".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Restructure to a Turborepo monorepo (`apps/web`, `apps/mobile`, `packages/shared`) only when this phase actually starts.
  Do not pre-build the monorepo earlier - it adds friction for no benefit until mobile is real.
- Share what should be shared: types, content schemas, and the trust primitives (tier logic, the receipt/freshness contract) move to `packages/shared` so the app and web cannot drift on the thing that matters most.
- The tripwire push is the retention feature, available to all logged-in users (free-first: no tier gating).
  It fires to followers of an account when that account's tripwire flips to fired - the same cohort logic as the Phase 8 email, on a different channel.
- Keep the design system intact on native: 0px radius, 2px borders, the mono/grotesk split.
  A rounded native re-skin would break the brand.

## `[HUMAN]` stops in this phase

- Apple and Google developer accounts and the app store listings are `[HUMAN]` tasks.

## Definition of done

Per `tasks/TODO.md` Phase 11: the native app carries the core reading screens, and a tripwire fire delivers a push to exactly the right followers.

## Report back, then stop

Report what shipped, the honest Definition-of-done result, the outstanding `[HUMAN]` store steps, and a suggested commit message.
Then STOP.
