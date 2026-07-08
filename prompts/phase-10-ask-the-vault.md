# Phase 10 - Ask-the-Vault chat (post-launch, Pro tier) - build prompt

## Mission

Add a grounded chat that answers questions from the published corpus only - cited, tier-labeled, and willing to refuse.
This is a post-launch, Pro-tier feature.
Do not start it until the launch (Phases 0-9) is live and stable.

## Before you start

- You are executing ONLY Phase 10.
  Confirm the app is launched and Phase 9's Definition of done holds.
- Read:
  1. `CLAUDE.md`.
  2. `tasks/TODO.md` -> "Phase 10", plus "Product hard rules".
  3. `plan/system-design.html` -> the Ask-the-Vault flow (the three-tool agent loop over the published corpus).

## Your task list (authoritative)

Your checklist is `tasks/TODO.md` -> "Phase 10 - Ask-the-Vault chat".
Set the status row to "in progress", tick boxes, set it "done" at the end.

## How to execute (strategy + gotchas)

- The answer discipline is the product: cite or refuse.
  Every answer carries tier chips and freshness; an out-of-corpus question gets a plain refusal, never a guess.
  No buy/sell language, ever.
- Grounding uses agentic retrieval over the PUBLISHED corpus (`search_corpus`, `read_page`, `follow_links`) - the same never-from-memory principle as the tweet engine, applied to Q&A.
- Persona mode shapes tone only.
  Asking @NVDA a question changes the voice, never the facts.
- Build the eval set before shipping: about 30 questions the corpus answers and about 10 it must refuse.
  The refusal set is the important half - it is what proves the thing will not hallucinate under a paying user.
- Control cost with prompt caching, per-user daily caps, and a cheap model for retrieval steps.

## `[HUMAN]` stops in this phase

- The Anthropic API key for the chat is a `[HUMAN]` task if a new one is needed.

## Definition of done

Per `tasks/TODO.md` Phase 10, plus: the eval set passes, including the refusal cases, before the feature is exposed to Pro users.

## Report back, then stop

Report what shipped, the honest Definition-of-done result (the refusal-eval outcome specifically), and a suggested commit message.
Then STOP.
