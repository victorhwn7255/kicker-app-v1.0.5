---
name: check-accounts
description: Compare stocks-wiki vault pages (wiki/companies + chokepoints + themes) against Ticker's accounts and report vault pages that have no account yet, orphaned accounts, and missing vault_page stamps. Read-only coverage check for the vault -> Ticker bridge; run it after vault sessions add pages, or whenever planning roster growth.
---

# check-accounts - vault -> Ticker coverage check

The vault grows every research session; the Ticker feed only grows when pages are exported.
This skill detects the drift: which vault pages have no Ticker account yet.
It is the coverage instrument for the bridge described in `context/06-stocks-wiki-bridge.md`.

## When to invoke

- The user asks "are there new vault pages without accounts?", "what accounts are we missing?", "check accounts", or wants to grow the roster.
- After stocks-wiki sessions that created new company/chokepoint/theme pages.
- As a pre-flight before a batch of `/publish-ticker` exports.

## How it works (one command)

```bash
pnpm check:accounts              # filesystem compare: vault wiki/ vs content/accounts.json
pnpm check:accounts --db         # also compare vs the live Supabase accounts table
pnpm check:accounts --vault <p>  # override the vault root (default ~/Projects/stocks-wiki)
```

The workhorse is `scripts/check_accounts.ts` - deterministic, read-only, no model calls.
The join key is each account's `vault_page` field (the originating wiki page filename stem), stamped by the vault-side `/publish-ticker` exporter and backfilled for all 130 pre-2026-07-15 accounts.
A small heuristic fallback (company ticker match, suffix-stripping, token subset) exists ONLY to diagnose accounts that are missing their stamp - when it fires, fix the DATA (stamp `vault_page` in `content/accounts.json`), never the script.

## Reading the report

| Bucket | Meaning | Next step |
|---|---|---|
| MISSING | Vault page with no account - the roster gap | In a **stocks-wiki** session: `/publish-ticker <page>`, then `/ceo-persona <TICKER>` for companies; user reviews the diff and seeds |
| ORPHANED | Account whose vault page was not found | Vault page renamed or retired - update that account's `vault_page`, or retire the account (user decision) |
| UNSTAMPED | Matched only by fallback heuristics | Stamp/update `vault_page` on that account in `content/accounts.json` |
| LOGO MISSING | Company account without `public/avatars/<TICKER>.png` (exact case) | User adds a square PNG (>= 400x400) at that path + pushes; monogram fallback shows until then |
| EXPORTED BUT NOT SEEDED (`--db`) | In accounts.json but not in Supabase | `pnpm validate-content && pnpm engine:audit-sources && pnpm db:seed` (user-gated) |

Present the report in chat grouped exactly like the script output, lead with the MISSING list (that is the user's question), and keep the next-step commands visible.
A healthy steady state is `MISSING: none / ORPHANED: none / UNSTAMPED: none`.

## Contract (binding)

- **Discovery-only.** This skill lists gaps; it NEVER creates accounts, edits `content/`, or writes to the vault. Account creation stays on the human-gated path (vault-side `/publish-ticker` -> user review -> seed).
- The vault (`~/Projects/stocks-wiki`) is read-only from this project, always.
- Exit code is always 0; the report is informational.

## Maintenance

- Nothing to maintain for new exports: the vault-side `/publish-ticker` stamps `vault_page` on every account it writes (enforced by its validator since 2026-07-15).
- If a vault page is RENAMED, the report shows the old stamp as UNSTAMPED with the new stem suggested - update the account's `vault_page` accordingly.
- If a new page KIND ever appears in the vault (beyond companies/chokepoints/themes), extend `DIRS` in `scripts/check_accounts.ts`.
