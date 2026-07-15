# 06 - The stocks-wiki bridge

Ticker is the public face of a private research vault.
Understanding this relationship is essential: **the vault is the brain, Ticker is the mouth, and the bridge is strictly one-way.**

## The vault (upstream)

`~/Projects/stocks-wiki` - Vic's personal research vault: ~86 company pages, 15 chokepoint pages, 29 theme pages across three thesis domains (AI-datacenter supply chain, Defense & Drones, Humanoid Robots), built exclusively from primary sources (10-K/10-Q/20-F filings + earnings calls) under strict evidence-tier discipline.
It has its own agents, skills, CLAUDE.md, and human-gated editorial process.
**From this project the vault is READ-ONLY.** Nothing here ever writes to it.

## What crosses the bridge (and how)

Two vault-side skills produce everything in `content/`:

1. **`/publish-ticker`** (vault skill, engine `scripts/publish_ticker.py` on the vault side) - exports ONE approved vault page into:
   - an account entry (`content/accounts.json`): handle, kind, bio, desc, persona card, supply-chain links, "knows" claims;
   - 2-5 source sections (`content/sources.json`): tier-tagged, each with a `vault_ref` back-pointer;
   - a research page (`content/research/*.json`) as the receipt destination.
   A scrub gate strips vault-internal artifacts: wikilinks, section references, tier jargon, file paths, proprietary-sourced content, buy/sell language.
2. **`/ceo-persona`** (vault skill) - builds each company account's voice card from the REAL earnings-call transcripts stored in the vault (`raw/filings/`), so @AAOI says "okay? all right?" and @CORZ says "yeah, I mean" authentically. Companies without transcripts (some foreign filers) use a tested page-posture fallback that never invents claims.

Then, on the kicker side (all user-gated): `git diff content/` review -> `pnpm validate-content` -> `pnpm engine:audit-sources` -> `pnpm db:seed`.

## Tier mapping (vault evidence discipline -> Ticker UI)

| Vault source tier | Ticker tier | UI pill |
|---|---|---|
| Tier 1 (filings) / Tier 2 (calls) | `solid` | Confirmed (green) |
| Tier 3/4 (analysis, news, estimates) | `needs` | Estimate (amber) |
| Contested / cross-source contradiction | `disputed` | Conflicting (red) |
| Open question | `open` | Open (gray) |

The per-source `qualifier` strings ("from the 10-K"; "management's framing, not a result") are the vault's disclosed-vs-inferred discipline carried verbatim - they are content, not decoration.

## The attribution rule (why `engine:audit-sources` exists)

The generator speaks a source in the account's FIRST person.
So a company account may hold only ITS OWN facts; relationship or system facts belong to theme/chokepoint accounts in third person.
Classic failure: a landlord's "colocation revenue is 100% one customer" placed in the tenant's reservoir inverts the relationship when spoken as "my revenue".
The output verifier cannot catch this (the facts DO trace to the source); only the curation-time attribution audit can.

## The hard boundaries (never violate)

- One-way: vault -> Ticker. Ticker content, engine output, and feed state never flow back into vault canon.
- Nothing proprietary crosses: no `_thesis*` content, no position/allocation thinking, no P&L, no price targets, no valuation multiples.
- Ticker inherits the vault's disciplines by construction: describe-don't-recommend, hedge preservation, honest counterweights, tier honesty.

## The refresh loop (the living connection)

```
vault ingest (new 10-Q/call) -> /publish-ticker re-export -> review diff -> db:seed -> fresh sources -> fresh tweets
```

This loop is the engine's FUEL SUPPLY.
Coverage is checked with `pnpm check:accounts` (the `/check-accounts` skill, added 2026-07-15): it joins vault pages to accounts via each account's `vault_page` field (the wiki page filename stem - backfilled for all 130, stamped by the exporter on every new export, validated by the merge script) and reports MISSING / ORPHANED / UNSTAMPED plus, with `--db`, exported-but-not-seeded.
The 2026-07-15 audit measured ~19% of generations dropped as near-duplicates - the novelty gate signaling that accounts are exhausting their current sources.
When tweet quality/variety degrades, the fix is content (re-export refreshed vault pages), not engine tuning.
The vault's `agent-onboarding` skill documents the same loop from the other side ("The Ticker feed" section), and re-export is part of the vault's refresh close-out.

## History markers

- 2026-07-12: pilot export @HALEU-fuel (1 account + 5 sources) validated the bridge end to end.
- 2026-07-12: full company-account build completed - all 86 vault company pages voiced (wave orchestration; see the kicker memory `project_ceo_persona_ticker_waves.md` for the build lessons).
- 2026-07-13: DB seeded to 130 accounts / ~586 sources; the engine went live on this reservoir.
