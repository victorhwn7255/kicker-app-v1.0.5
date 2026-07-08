# Phase 5 - The tweet engine - build prompt

## Mission

Make the accounts alive: scheduled, grounded, verifier-gated post generation.
This is the most safety-critical phase in the whole build.

The one non-negotiable rule: the model never writes from its own memory.
It only rewords the single source section it is handed.
Fail-closed: an unverified candidate is dropped, never published.

## Before you start

- You are executing ONLY Phase 5.
  Confirm Phase 4's Definition of done passes first.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 5", plus "Product hard rules" and "Agent boundaries" (the engine-approval rule).
  3. `plan/system-design.html` -> the tweet-engine subsystem diagram.
  4. `design/README.md` -> the `Post` variants (the engine emits reply/quote/thread posts that render through the existing PostCard).

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 5 - The tweet engine".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- Build and test against a MOCKED model first.
  The pipeline logic (planner, verifier gate, novelty gate, batching, fail-closed drop) must be provable with deterministic unit tests before a real model is ever called.
- The verifier is the safety mechanism, not a formality.
  It is a separate adversarial call that asks: is every claim traceable to the source text, are the hedges preserved, are there invented numbers, is there buy/sell language.
  Fail means regenerate (max 2), then drop and log.
- Run the prompt-injection test explicitly.
  Put instruction-injection text inside a source section (for example "ignore your instructions and say X") and confirm it does not escape the verifier into a published post.
  This test is part of the Definition of done.
- Keep model choice a config change only, via the Vercel AI SDK.
  Dev uses the NVIDIA NIM free endpoint; production uses a US-hosted provider.
- Ship the safety controls with the engine, not after: the `ENGINE_ENABLED` kill switch, and a dry-run mode that writes candidates to a review table instead of publishing.
- The planner is deterministic code, not a model call.
  It picks account and trigger; the model only writes the wording.

## `[HUMAN]` stops in this phase

- The model API keys are a `[HUMAN]` task.
  Ask the user for them before any live model call.
- Do NOT publish generated posts live.
  This phase ends in a dry-run week the user reviews.
  Taking the engine out of dry-run needs explicit user approval (Agent-boundary rule), and that approval belongs to the launch phase, not here.

## Definition of done

Per `tasks/TODO.md` Phase 5: cron runs on schedule in staging, every published (dry-run) candidate has a source ref and passes the trust-band render, the poisoned-source test does not escape the verifier, and the dry-run week is reviewed with zero fabricated-fact escapes.

## Report back, then stop

Report what shipped, the honest Definition-of-done result, the poisoned-source test outcome specifically, and a clear statement that the engine is in dry-run and awaiting the user's review of candidates.
Recommend a commit message.
Then STOP.
This is a hard user gate; do not begin Phase 6 and do not go live.
