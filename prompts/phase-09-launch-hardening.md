# Phase 9 - Launch hardening - build prompt

## Mission

Take the app from "works on my machine" to production-ready and public.
This phase is about proof, safety, and the real launch corpus - not new features.

## Before you start

- You are executing ONLY Phase 9.
  Confirm Phase 8's Definition of done passes first.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 9", plus "Product hard rules" and "Agent boundaries".
  3. `design/README.md` -> "The one test that matters" and the accessibility notes.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 9 - Launch hardening".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Prove the five core flows end to end: first-visit hook, daily loop, hype-check, conversion, tripwire fire.
- Accessibility is WCAG 2.1 AA and keyboard-complete, and tier meaning must survive grayscale (produce the screenshot proof, like the Component Library's).
- Error monitoring must make engine failures loud.
  The engine failing silently is worse than it stopping - wire alerts so a broken generation run is seen, not swallowed.
- Do the security pass for real: secrets audit, webhook signature tests, rate limiting on auth and API routes, RLS re-verified.
- Add the legal pages and the footer disclosure: this is research, not investment advice.
  This is the same describe-don't-recommend boundary the whole product is built on, stated plainly to the user.
- The real launch corpus comes from the vault bridge, which is external to this repo.
  If the publish skill does not exist yet, that is a dependency to surface to the user, not something to invent content around.

## `[HUMAN]` stops in this phase

- Production domain and SSL, production Stripe keys, and the production model provider account are `[HUMAN]` tasks.
- Taking the engine out of dry-run for the launch accounts needs explicit user approval.
  Do not flip it live on your own judgment - present the reviewed dry-run results and let the user decide.

## Definition of done

Per `tasks/TODO.md` Phase 9: all E2E green against a production build, a stranger can sign up and subscribe and read on their phone, and the engine runs seven consecutive days in production with zero fabricated-fact escapes and no silent failures.

## Report back, then stop

Report what shipped, the honest Definition-of-done result, every outstanding `[HUMAN]` step, and a suggested commit message.
Then STOP.
Launch is the user's call.
