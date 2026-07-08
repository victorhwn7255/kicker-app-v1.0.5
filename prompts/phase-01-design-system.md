# Phase 1 - Design system & core components - build prompt

## Mission

Build every reusable component, pixel-matched to the wireframes, before any screen exists.
This is the highest-fidelity phase.
The PostCard is the atom of the whole product, and a cropped screenshot of one card must carry its own credibility.

## Before you start

- You are executing ONLY Phase 1.
  Confirm Phase 0's Definition of done passes first; if it does not, stop and tell the user.
- Read, in this order:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 1", plus "Product hard rules" and "Agent boundaries".
  3. `design/README.md` in full - especially "Reusable Components" (the `PostCard` data contract), "Tier semantics", and "Interaction states".
  4. Open in a browser: `design/wireframes/Component Library.dc.html`, `PostCard.dc.html`, `AccountTile.dc.html`, and `design/screenshots/00-component-library.png`.
     These are your pixel targets.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 1 - Design system & core components".
Set the status row to "in progress", tick boxes as you go, set it to "done" at the end.

## How to execute (strategy + gotchas)

- Build bottom-up.
  Primitives first (TierChip, Avatar, KindBadge, buttons, inputs, mention chip, receipt link), then the PostCard that composes them, then the composite cards (kill-list card, tripwire row, paywall gate, terminator).
  Only the primitives-then-PostCard order is strict; the composite cards can be split across a small team once the primitives exist.
- The PostCard is the boss fight.
  Implement the full `Post` type from `design/README.md` and every variant (original, quote, reply, thread, high-stakes) plus the trust band.
  The trust band (tier chip + receipt link + freshness) is structure, not metadata: it lives inside the card and is never optional.
- The TierChip is the core trust primitive.
  The label always carries the meaning; color only reinforces it.
  Prove it survives grayscale, exactly like the Component Library's grayscale panel.
- Match the interaction states precisely: instant color swaps on hover, the stamp-press active state (`translate(2px,2px)` with the shadow removed), pink focus rings, the feed-card hover lift.
  Loading skeletons pulse opacity; there is no shimmer sweep.
- Build `/dev/components` as you go, not at the end.
  It is your side-by-side comparison surface against the Component Library wireframe, and it becomes the reference every Phase 3 screen-builder reuses.
- Do not fork or re-implement components later.
  Everything a screen needs must exist here, once.

## `[HUMAN]` stops in this phase

None.

## Definition of done

Check against `tasks/TODO.md` Phase 1 "Definition of done" with an obsessive eye (per CLAUDE.md):
`/dev/components` matches the Component Library wireframe and screenshot, a cropped single PostCard carries handle + kind + tier chip + receipt + freshness, and every interactive state works by keyboard.

## Report back, then stop

Tell the user:
- what shipped, mapped to the checklist.
- the Definition-of-done result, honestly, with any mismatches called out.
- a direct pointer: "open `/dev/components` next to `design/wireframes/Component Library.dc.html` - this is the review gate before screens get built."
- a suggested commit message.
Then STOP.
This is a user review gate; do not begin Phase 2 until the user has looked.
