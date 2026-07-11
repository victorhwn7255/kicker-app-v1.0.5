# Phase 8 - Email - build prompt

## Mission

Ship the two earned emails: the weekly digest and the tripwire alert.
Both are opt-in, on-brand, and never spammy.

## Before you start

- You are executing ONLY Phase 8.
  Confirm Phase 6's Definition of done passes first (Phase 7 is DEFERRED - free-first decision; the digest goes to ALL opted-in accounts, no tier gating).
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 8".
  3. `design/README.md` -> the design system (the email template must look like the app: bordered, flat, cream, mono labels).

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 8 - Email".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- The digest reports what moved this week: new posts by trigger type, kill-list additions, tripwire changes.
  A calm week is a valid digest - say "nothing fired" rather than manufacturing urgency.
  This mirrors the product's whole anti-doomscroll stance.
- The tripwire alert fires when a tripwire flips to fired, to the followers of that account.
  Get the cohort right and send once - test that it emails exactly the right people, exactly one time.
- Respect the settings toggles for opt-in, and include one-click unsubscribe headers.
- Render the template on-brand and test it in real clients (email HTML is not web HTML; borders and fonts degrade in ways a browser will not show you).

## `[HUMAN]` stops in this phase

- The Resend account and the domain DNS records (SPF/DKIM) are a `[HUMAN]` task.
  Ask the user to set up the domain before you move magic-link and digest sending onto it.

## Definition of done

Per `tasks/TODO.md` Phase 8: the digest renders correctly in major clients, a test tripwire fire emails exactly the right cohort once, and unsubscribe works.

## Report back, then stop

Report what shipped, the honest Definition-of-done result, the `[HUMAN]` Resend/DNS step if outstanding, and a suggested commit message.
Then STOP.
Do not begin Phase 9.
