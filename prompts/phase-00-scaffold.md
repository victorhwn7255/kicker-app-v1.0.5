# Phase 0 - Scaffold & foundations - build prompt

## Mission

Stand up a deployable Next.js skeleton with the design tokens installed, so every later phase builds on rails.
No product screens yet - just the frame, the tokens, the fonts, and the chrome.

## Before you start

- This is a fresh-context work order.
  You are executing ONLY Phase 0.
- Read, in this order:
  1. `CLAUDE.md` (engineering law for this repo).
  2. `tasks/TODO.md` - the whole file once, then focus on "Phase 0".
     Pay attention to "Product hard rules" and "Agent boundaries".
  3. `design/README.md` - the "Design System" and "Design Tokens (quick reference)" sections.
  4. `plan/system-design.html` - the folder structure and stack.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 0 - Scaffold & foundations".
Work those items top to bottom.
Set the Phase 0 row in the status tracker to "in progress" now, tick each box as you finish it, and set it to "done" at the end.
Do not restate or edit the task list itself.

## How to execute (strategy + gotchas)

- Get the Tailwind token config exactly right first.
  Everything downstream inherits it, so a wrong hex or a stray border radius here becomes a bug in every later phase.
  Cross-check the values against `references/slock-theme.json`, but where it disagrees with `design/README.md`, the README wins.
- The defining trait is 0px border radius everywhere and a single hard shadow `2px 2px 0 0 #000`.
  Configure Tailwind so the DEFAULT is zero radius and there is no blurred shadow in the theme at all.
  Make the wrong thing hard to do by accident.
- Load the fonts with `next/font` (self-hosted), not a runtime Google Fonts link.
  The mono/grotesk split is a brand signal, so wire both families in now.
- The chrome (desktop yellow top bar, mobile yellow bottom nav with the 5 tabs) is static in this phase.
  Real navigation state comes later.
  Build it as a layout component so later phases light it up rather than rebuild it.
- `.env.example` lists every variable name the project will ever use (Supabase, Stripe, Resend, model API) with placeholder values.
  No real secret goes in any committed file, ever.

## `[HUMAN]` stops in this phase

- Creating the Vercel project and connecting the repo is a `[HUMAN]` task (the user's account).
  Prepare the repo so it is deploy-ready, then stop and ask the user to create the project and confirm the hello-world deploy.
  Do not create accounts on their behalf.

## Definition of done

Verify honestly against `tasks/TODO.md` Phase 0 "Definition of done" before reporting:
`pnpm build` passes, the chrome shows on both mobile and desktop, and a token-swatch test page matches the Component Library values.

## Report back, then stop

Tell the user:
- what shipped, mapped to the checklist.
- the Definition-of-done result, honestly, including anything not yet passing and why.
- the `[HUMAN]` Vercel step they need to do to finish the phase.
- a suggested commit message (they run git, not you).
Then STOP.
Do not begin Phase 1.
