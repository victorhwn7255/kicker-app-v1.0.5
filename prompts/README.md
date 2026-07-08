# Ticker build prompts

This folder holds one execution prompt per build phase.
Each prompt is a self-contained work order you can hand to a fresh Claude Code agent (no prior conversation context needed).

## How these relate to the other docs

- `tasks/TODO.md` is the source of truth for WHAT to build: the task checklist, the definitions of done, and the live status tracker.
- `prompts/phase-NN-*.md` (this folder) is HOW to run each phase: preconditions, execution strategy, gotchas, and the stop/report protocol.
- `design/README.md` is HOW it looks: tokens, components, screens, states, content.
- `CLAUDE.md` is the engineering law for the repo.

The prompts deliberately do NOT copy the task list.
They point at `tasks/TODO.md` Phase N so the two never drift.
The agent opens the TODO anyway, because that is where it ticks boxes and updates the status tracker.

## The operating model

- Run ONE phase at a time, in order (0 through 9 to launch; 10 and 11 are post-launch).
- Do not start a phase until the previous phase's Definition of done fully passes.
- A phase can be one agent or a small team.
  Most phases are a single agent.
  Phase 3 (nine largely independent screens) is the natural place to fan out to a team, once the shared components from Phase 1 exist.
- At the end of every phase the agent reports back and STOPS.
  It does not roll into the next phase on its own.

## How to launch a phase

Open a fresh Claude Code agent in the `kicker-app` repo root and give it one line:

> Read `prompts/phase-00-scaffold.md` and execute it. Stop and report back when done.

The prompt tells the agent what to read, what to build (via the TODO), where the traps are, and how to hand back.

## The two review gates that matter most

Everything has a Definition of done, but two moments deserve your own eyes:

1. After Phase 1: open `/dev/components` next to `design/wireframes/Component Library.dc.html`.
   If the PostCard is right, every screen built on it inherits that.
   If it is wrong, fixing it now is far cheaper than after nine screens exist.
2. During Phase 5: the tweet engine runs a dry-run week before anything auto-publishes.
   Read the generated candidates yourself.
   Nothing publishes live without your explicit approval.

## Standing boundaries (apply to every phase)

- Git is yours.
  Agents implement only; they never commit, push, or open PRs.
  They recommend a commit at each phase boundary, then stop.
- `design/`, `plan/`, and `references/` are read-only.
- `[HUMAN]` tasks need your accounts, payments, or DNS.
  The agent stops and asks; it never fakes a key or silently stubs around one.
- The product hard rules in `tasks/TODO.md` apply in every phase.
  A violation is rejected work, no matter how well built.
