# Phase 2 - Content layer & fixtures - build prompt

## Mission

Give the app typed, validated content: the schemas, the sample research fixtures, the loaders, and a CI validator that fails the build on bad content.
After this phase the components from Phase 1 have real data to render.

## Before you start

- You are executing ONLY Phase 2.
  Confirm Phase 1's Definition of done passes first.
- Read, in this order:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 2", plus "Product hard rules".
  3. `design/README.md` -> the "Content" section (the sample research) and the `Post` data contract.
  4. `plan/system-design.html` -> the data model (field names for `Account`, `Post`, `SourceSection`, `KillListEntry`, `Tripwire`, `ResearchPage`).

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 2 - Content layer & fixtures".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Order: zod schemas and types first, then fixtures, then loaders, then the validator.
- Use the sample content from `design/README.md` verbatim.
  Never invent a ticker, a number, or a claim.
  This is a product hard rule, not a preference: no fact originates in this app.
- The validator must actually fail the build.
  Prove it: add a deliberately broken fixture, watch CI go red, then remove it.
  A validator that silently passes bad content is worse than none.
- Persona cards derive their voice from the bios already written in the design files (for example, @CRWV's first-person bio is in `Account Profile.dc.html`).
  A persona card is a voice description plus constraints; it never adds facts.
- Keep zod parsing at the boundary so every later phase gets typed data and a single failure point.

## `[HUMAN]` stops in this phase

None.

## Definition of done

Per `tasks/TODO.md` Phase 2: `pnpm validate-content` passes, a deliberately broken fixture fails CI, and the loaders return typed data that a test page renders through the Phase 1 components.

## Report back, then stop

Tell the user what shipped, the honest Definition-of-done result, and a suggested commit message.
Then STOP.
Do not begin Phase 3.
