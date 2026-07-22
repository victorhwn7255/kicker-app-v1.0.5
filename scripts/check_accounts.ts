import fs from 'node:fs';
import path from 'node:path';

/**
 * Coverage checker for the vault -> Ticker bridge (the /check-accounts skill's
 * workhorse). Compares stocks-wiki wiki pages (companies/chokepoints/themes)
 * against content/accounts.json and reports, deterministically and read-only:
 *
 *   MISSING   - vault pages with no Ticker account yet (the roster gap to fill)
 *   ORPHANED  - accounts whose vault page no longer exists (renamed/retired)
 *   UNSTAMPED - accounts matched only heuristically; their data needs a
 *               `vault_page` stamp (the exporter adds it going forward)
 *
 * The authoritative join is the `vault_page` field on each account (backfilled
 * 2026-07-15; stamped by the vault-side publish-ticker exporter since). The
 * heuristics below are diagnostics for accounts that ever miss the stamp - fix
 * the DATA, not this script.
 *
 * Usage: pnpm check:accounts [--vault <path>] [--db]
 *   --vault  vault root (default /Users/victor_he/Projects/stocks-wiki)
 *   --db     also compare accounts.json vs the live Supabase accounts table
 *            (finds "exported but not yet seeded"; needs .env.local)
 * Always exits 0 (informational).
 */

type Kind = 'company' | 'chokepoint' | 'theme';
const DIRS: Record<Kind, string> = { company: 'companies', chokepoint: 'chokepoints', theme: 'themes' };
const KINDS = Object.keys(DIRS) as Kind[];

/**
 * Accounts that intentionally have NO vault page. @youtube-buzz reworks the
 * video-intel corpus (Tier-3/5 discovery notes, never canon), so it has no
 * wiki/themes/ page by design and must not surface as ORPHANED. Skipped from the
 * join entirely.
 */
const NO_VAULT_PAGE = new Set<string>(['@youtube-buzz']);

interface AccountRow {
  handle: string;
  kind: Kind;
  vault_page?: string;
  desc?: string;
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const VAULT = arg('--vault') ?? '/Users/victor_he/Projects/stocks-wiki';
const REPO = path.resolve(__dirname, '..');

/** Normalize a page stem / handle for the heuristic fallback match. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/-(chokepoint|oligopoly|workaround|supply-chain)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Token-subset heuristic: every token of the shorter name appears in the longer. */
function tokenSubset(a: string, b: string): boolean {
  const ta = new Set(norm(a).split('-').filter(Boolean));
  const tb = new Set(norm(b).split('-').filter(Boolean));
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  if (small.size === 0) return false;
  for (const t of small) if (!big.has(t)) return false;
  return true;
}

function main(): void {
  // 1) Vault pages per kind.
  const wiki = path.join(VAULT, 'wiki');
  if (!fs.existsSync(wiki)) {
    console.error(`FATAL: vault wiki dir not found at ${wiki} (use --vault <path>)`);
    process.exit(0); // informational tool: report and stop, never break a pipeline
  }
  const pages = new Map<Kind, string[]>();
  for (const kind of KINDS) {
    const dir = path.join(wiki, DIRS[kind]);
    const stems = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
      : [];
    pages.set(kind, stems.sort());
  }

  // 2) Kicker accounts.
  const accounts = JSON.parse(
    fs.readFileSync(path.join(REPO, 'content', 'accounts.json'), 'utf8'),
  ) as AccountRow[];

  // 3) Join.
  const matchedStems = new Set<string>(); // `${kind}/${stem}`
  const unstamped: { account: AccountRow; stem: string }[] = [];
  const orphaned: AccountRow[] = [];

  for (const a of accounts) {
    if (NO_VAULT_PAGE.has(a.handle)) continue; // intentionally page-less; not a coverage gap
    const stems = pages.get(a.kind) ?? [];
    let stem: string | undefined;
    let viaFallback = false;

    if (a.vault_page && stems.includes(a.vault_page)) {
      stem = a.vault_page; // authoritative
    } else if (a.kind === 'company') {
      stem = stems.find((s) => s.toLowerCase() === a.handle.replace(/^@/, '').toLowerCase());
      viaFallback = !!stem;
    }
    if (!stem) {
      // heuristic diagnostics (exact normalized, then token subset)
      stem =
        stems.find((s) => norm(s) === norm(a.handle)) ??
        stems.find((s) => tokenSubset(s, a.handle));
      viaFallback = !!stem;
    }

    if (stem) {
      matchedStems.add(`${a.kind}/${stem}`);
      if (viaFallback || a.vault_page !== stem) unstamped.push({ account: a, stem });
    } else {
      orphaned.push(a);
    }
  }

  const missing: { kind: Kind; stem: string; suggestedHandle: string }[] = [];
  for (const kind of KINDS) {
    for (const stem of pages.get(kind)!) {
      if (!matchedStems.has(`${kind}/${stem}`)) {
        missing.push({
          kind,
          stem,
          suggestedHandle: kind === 'company' ? `@${stem}` : `@${norm(stem)}`,
        });
      }
    }
  }

  // 4) Report.
  const vaultTotal = KINDS.reduce((n, k) => n + pages.get(k)!.length, 0);
  console.log(`vault pages: ${vaultTotal} (${KINDS.map((k) => `${pages.get(k)!.length} ${DIRS[k]}`).join(', ')})`);
  console.log(`kicker accounts: ${accounts.length}`);
  console.log(`matched: ${matchedStems.size}\n`);

  if (missing.length) {
    console.log(`MISSING - vault pages with NO Ticker account (${missing.length}):`);
    for (const kind of KINDS) {
      const rows = missing.filter((m) => m.kind === kind);
      if (!rows.length) continue;
      console.log(`  ${DIRS[kind]}:`);
      for (const m of rows) console.log(`    - ${m.stem}  (suggested handle: ${m.suggestedHandle})`);
    }
    console.log('  next step: in a stocks-wiki session run /publish-ticker <page> for each,');
    console.log('  then /ceo-persona <TICKER> for companies, review the diff, and seed.\n');
  } else {
    console.log('MISSING: none - every vault page has an account.\n');
  }

  if (orphaned.length) {
    console.log(`ORPHANED - accounts whose vault page was not found (${orphaned.length}):`);
    for (const a of orphaned) console.log(`  - ${a.handle} (${a.kind}, vault_page: ${a.vault_page ?? 'none'})`);
    console.log('  likely a renamed/retired vault page - update the account vault_page or retire the account.\n');
  } else {
    console.log('ORPHANED: none.\n');
  }

  if (unstamped.length) {
    console.log(`UNSTAMPED - matched by fallback only; stamp vault_page in accounts.json (${unstamped.length}):`);
    for (const u of unstamped) console.log(`  - ${u.account.handle} -> "${u.stem}"`);
    console.log('');
  } else {
    console.log('UNSTAMPED: none - every account carries its vault_page stamp.\n');
  }

  // Logo coverage: every COMPANY account should have public/avatars/<TICKER>.png
  // (chokepoints/themes use monogram/glyph tiles by design). Compare against the
  // actual directory listing, exact case: macOS is case-insensitive but the
  // deploy target is not, so fs.existsSync would hide a case-mismatch 404.
  const avatarsDir = path.join(REPO, 'public', 'avatars');
  const pngs = new Set(fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir) : []);
  const companies = accounts.filter((a) => a.kind === 'company');
  const noLogo = companies.filter((a) => !pngs.has(`${a.handle.replace(/^@/, '')}.png`));
  if (noLogo.length) {
    console.log(`LOGO MISSING - company accounts without public/avatars/<TICKER>.png (${noLogo.length}):`);
    for (const a of noLogo) console.log(`  - ${a.handle}  (expected: public/avatars/${a.handle.replace(/^@/, '')}.png)`);
    console.log('  monogram fallback shows until the square PNG is added + pushed.\n');
  } else {
    console.log(`LOGOS: all ${companies.length} company accounts have a logo PNG.\n`);
  }

  if (process.argv.includes('--db')) {
    void dbCheck(accounts);
  }
}

/** Optional: exported-but-not-seeded check against the live accounts table. */
async function dbCheck(accounts: AccountRow[]): Promise<void> {
  await import('./_env');
  const { supabaseAdmin } = await import('../src/lib/supabase/admin');
  const { data, error } = await supabaseAdmin().from('accounts').select('handle');
  if (error) {
    console.log(`DB check skipped (query failed: ${error.message})`);
    return;
  }
  const dbHandles = new Set((data ?? []).map((r) => String((r as { handle: unknown }).handle)));
  const unseeded = accounts.filter((a) => !dbHandles.has(a.handle));
  console.log(`DB: ${dbHandles.size} accounts seeded.`);
  if (unseeded.length) {
    console.log(`EXPORTED BUT NOT SEEDED (${unseeded.length}): ${unseeded.map((a) => a.handle).join(', ')}`);
    console.log('  next step: pnpm validate-content && pnpm engine:audit-sources && pnpm db:seed (user-gated).');
  } else {
    console.log('All exported accounts are seeded.');
  }
}

main();
