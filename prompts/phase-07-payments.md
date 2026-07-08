# Phase 7 - Payments & paywall - build prompt

## Mission

Make the Reader tier earn money, with a paywall that is honest to the user and enforced on the server.

## Before you start

- You are executing ONLY Phase 7.
  Confirm Phase 6's Definition of done passes first.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 7", plus "Agent boundaries" (secrets).
  3. `design/README.md` -> the Research Page + paywall gate spec and the Pricing spec.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 7 - Payments & paywall".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Use Stripe Checkout (hosted) and the hosted Customer Portal.
  No card data ever touches the app, and there is no billing UI to build.
- The webhook is the single source of truth for subscription state.
  `/api/stripe/webhook` is signature-verified and is the ONLY writer of the `subscriptions` table.
  Nothing else may set a user's plan.
- Enforce gating on the server, not in the UI.
  Research sections beyond section 1 must be withheld by the server query / RLS.
  Test the real attack: direct-URL access to locked content while signed out or on the free tier must return the gate, not the content.
- The gate stays honest: plain-language contents list, cyan CTA, cancel-anytime copy.
  No blur-tease, no countdown, no fake scarcity - this is a product hard rule.
- Use Stripe test clocks to prove the full lifecycle: subscribe unlocks, cancel re-locks at period end.

## `[HUMAN]` stops in this phase

- The Stripe account and API keys (test mode first) are a `[HUMAN]` task.
  Ask the user for them before wiring checkout.
  You create the products and prices once the keys exist.

## Definition of done

Per `tasks/TODO.md` Phase 7: a test-mode purchase unlocks a research page within seconds via the webhook, direct-URL access to locked content is denied, and no card data touches the app.

## Report back, then stop

Report what shipped, the honest Definition-of-done result (call out the direct-URL denial test specifically), the `[HUMAN]` Stripe step if outstanding, and a suggested commit message.
Then STOP.
Do not begin Phase 8.
