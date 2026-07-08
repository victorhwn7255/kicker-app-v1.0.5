# Phase 4 - Database & live content - build prompt

## Mission

Swap fixtures for Supabase so content can grow without a redeploy.
The invariant: the app renders identically before and after.

## Before you start

- You are executing ONLY Phase 4.
  Confirm Phase 3's Definition of done passes first - its E2E suite is your regression oracle for this phase.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 4", plus "Agent boundaries" (secrets handling).
  3. `plan/system-design.html` -> the data model and the "one-way bridge" content flow.

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 4 - Database & live content".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- The whole phase is judged by one thing: the Phase 3 E2E suite stays green after the data moves to Supabase.
  Treat any visual or behavioral difference as a bug.
- Write the schema as SQL migrations committed to the repo, not clicked into a dashboard.
  Create all tables now, including `users`, `follows`, and `subscriptions` (used in Phases 6-7), so the schema is stable early.
- Turn RLS on from day one: public read on published content tables, no public writes, service-role for the engine and import scripts.
  Do not defer RLS - retrofitting it is where security holes appear.
- The seed script must be idempotent.
  Re-running it must not duplicate rows.
- Keep `content/` plus the validator as the ingestion path.
  Bridge files land in `content/`, get validated, then get imported.
  The vault-side publish skill that will eventually produce those files is external to this repo; fixtures stand in until it exists.

## `[HUMAN]` stops in this phase

- Creating the Supabase project is a `[HUMAN]` task (the user's account).
  Stop and ask the user to create it and provide the URL and keys via `.env.local` and Vercel env before you wire anything to it.

## Definition of done

Per `tasks/TODO.md` Phase 4: the app renders identically to Phase 3 with data from Supabase (E2E still green), the seed does not duplicate on re-run, and RLS is verified (the anonymous key cannot write).

## Report back, then stop

Report what shipped, the honest Definition-of-done result, the `[HUMAN]` Supabase step if still outstanding, and a suggested commit message.
Then STOP.
Do not begin Phase 5.
