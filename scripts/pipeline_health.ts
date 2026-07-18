import './_env';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { DAILY, NOVELTY_MAX_SIMILARITY } from '../src/lib/engine/config';

/**
 * Deterministic health + sampling layer for the /inspect-tweet-pipeline skill.
 * Facts come from here (exact, reproducible); judgment comes from the skill's
 * evaluator agents. Read-only.
 *
 * Usage:
 *   pnpm pipeline:health            human-readable health summary (the quick check)
 *   pnpm pipeline:health --json     health as JSON
 *   pnpm pipeline:health --sample   health + stratified samples as JSON (the
 *                                   input pack for the inspection workflow)
 */

type Row = Record<string, any>;

function utcDay(iso: string): string {
  return iso.slice(0, 10);
}

function gapsMinutes(times: number[]): number[] {
  const t = [...times].sort((a, b) => a - b);
  return t.slice(1).map((x, i) => (x - t[i]) / 60000);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const admin = supabaseAdmin();
  const now = Date.now();
  const asJson = process.argv.includes('--json') || process.argv.includes('--sample');
  const withSample = process.argv.includes('--sample');

  // ---- posts, last 3 UTC days ----
  const since3d = new Date(now - 3 * 86400_000).toISOString();
  const { data: postsData, error: pErr } = await admin
    .from('posts')
    .select('published_at,account,kind,tier,trigger,source_id,data')
    .not('published_at', 'is', null)
    .gte('published_at', since3d)
    .order('published_at', { ascending: true })
    .limit(4000);
  if (pErr) throw new Error(pErr.message);
  const posts = (postsData ?? []) as Row[];

  const today = new Date(now).toISOString().slice(0, 10);
  const yesterday = new Date(now - 86400_000).toISOString().slice(0, 10);

  const perDay: Record<string, number> = {};
  for (const p of posts) perDay[utcDay(p.published_at)] = (perDay[utcDay(p.published_at)] ?? 0) + 1;

  const dayRows = (d: string) => posts.filter((p) => utcDay(p.published_at) === d);
  const spacing = (d: string) => {
    const g = gapsMinutes(dayRows(d).map((p) => Date.parse(p.published_at)));
    return {
      posts: dayRows(d).length,
      medianGapMin: Number(median(g).toFixed(1)),
      under2min: g.filter((x) => x < 2).length,
      gaps: g.length,
    };
  };
  const maxPerAccount = (d: string) => {
    const m: Record<string, number> = {};
    dayRows(d).forEach((p) => (m[p.account] = (m[p.account] ?? 0) + 1));
    const counts = Object.values(m);
    return counts.length ? Math.max(...counts) : 0;
  };

  const newest = posts.length ? posts[posts.length - 1].published_at : null;
  const freshnessMin = newest ? Math.round((now - Date.parse(newest)) / 60000) : null;

  const last24 = posts.filter((p) => Date.parse(p.published_at) > now - 86400_000);
  const bodies24 = last24.map((p) => p.data?.body ?? '');
  const dupes24 = bodies24.length - new Set(bodies24).size;

  // ---- candidates, last 24h + today's plan stability ----
  const { data: candData, error: cErr } = await admin
    .from('engine_candidates')
    .select('status,dropped_reason,model,engine_run_id,scheduled_at,created_at')
    .gte('created_at', new Date(now - 86400_000).toISOString())
    .limit(4000);
  if (cErr) throw new Error(cErr.message);
  const cands = (candData ?? []) as Row[];
  const verified = cands.filter((c) => c.status === 'verified').length;
  const drops: Record<string, number> = {};
  for (const c of cands)
    if (c.status !== 'verified' && c.dropped_reason) {
      const r = String(c.dropped_reason).split(/[:0-9]/)[0].trim().slice(0, 26);
      drops[r] = (drops[r] ?? 0) + 1;
    }

  const runId = `day_${today.replaceAll('-', '')}`;
  const { data: planData } = await admin
    .from('engine_candidates')
    .select('scheduled_at')
    .eq('engine_run_id', runId)
    .limit(3000);
  const planRows = (planData ?? []) as Row[];
  const distinctSlots = new Set(planRows.map((r) => r.scheduled_at)).size;

  // ---- deterministic red flags (pre-verdicts for the synthesis agent) ----
  // PUBLISHED volume floor: Vic's accepted healthy range is ~40-60/day (decision
  // 2026-07-18). The DAILY 60-90 band is a SLOT target - the novelty/length gates
  // eat ~1/3 of candidates (by design, quality over quantity), so published lands
  // below it. Flag only genuine anomalies: under 40 or above the slot-band max.
  const PUBLISHED_MIN_HEALTHY = 40;
  const flags: string[] = [];
  const yCount = perDay[yesterday] ?? 0;
  if (yCount && (yCount < PUBLISHED_MIN_HEALTHY || yCount > DAILY.targetMax * 1.3))
    flags.push(
      `yesterday's volume ${yCount} is outside the accepted ${PUBLISHED_MIN_HEALTHY}-${DAILY.targetMax} published range`,
    );
  const ySpacing = spacing(yesterday);
  if (ySpacing.gaps && ySpacing.under2min / ySpacing.gaps > 0.3)
    flags.push(`bursty publishing yesterday: ${ySpacing.under2min}/${ySpacing.gaps} gaps under 2 min`);
  if (maxPerAccount(yesterday) > DAILY.maxPerAccount)
    flags.push(`per-account cap exceeded yesterday: ${maxPerAccount(yesterday)} > ${DAILY.maxPerAccount}`);
  if (freshnessMin !== null && freshnessMin > 120) flags.push(`newest post is ${freshnessMin} min old (engine stalled?)`);
  // Ship-rate floor 30%: with cadence buckets concentrating slots on deep accounts,
  // novelty/length drops eating ~half of rotation-heavy days is by-design (same
  // 2026-07-18 decision). Below 30% suggests a real problem (model/infra), not gates.
  if (cands.length && verified / cands.length < 0.3)
    flags.push(`ship rate ${Math.round((100 * verified) / cands.length)}% is low`);
  if ((drops['generation error'] ?? 0) > 20) flags.push(`generation errors elevated: ${drops['generation error']}/24h`);
  if (distinctSlots > DAILY.targetMax * 1.3) flags.push(`today's plan has ${distinctSlots} slots (> band max ${DAILY.targetMax}) - plan instability?`);
  if (dupes24 > 0) flags.push(`${dupes24} exact-duplicate bodies in 24h`);

  const health = {
    now: new Date(now).toISOString(),
    band: { min: DAILY.targetMin, max: DAILY.targetMax, maxPerAccount: DAILY.maxPerAccount },
    publishedPerDay: perDay,
    spacingYesterday: ySpacing,
    spacingToday: spacing(today),
    maxPerAccountYesterday: maxPerAccount(yesterday),
    freshnessMin,
    candidates24h: { total: cands.length, verified, shipRatePct: cands.length ? Math.round((100 * verified) / cands.length) : null, drops },
    planToday: { runId, candidates: planRows.length, distinctSlots },
    dupes24h: dupes24,
    noveltyCeiling: NOVELTY_MAX_SIMILARITY,
    flags,
  };

  if (!withSample) {
    if (asJson) {
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.log(`Ticker pipeline health @ ${health.now}`);
      console.log(`  published/day: ${Object.entries(perDay).sort().map(([d, n]) => `${d}:${n}`).join('  ')}  (band ${DAILY.targetMin}-${DAILY.targetMax})`);
      console.log(`  spacing yday : median ${ySpacing.medianGapMin}m gap · ${ySpacing.under2min}/${ySpacing.gaps} under 2m · max/acct ${maxPerAccount(yesterday)} (cap ${DAILY.maxPerAccount})`);
      console.log(`  freshness    : newest post ${freshnessMin} min ago`);
      console.log(`  ship rate 24h: ${health.candidates24h.shipRatePct}% (${verified}/${cands.length}) · drops: ${Object.entries(drops).map(([k, v]) => `${k}:${v}`).join(' ') || 'none'}`);
      console.log(`  plan today   : ${planRows.length} candidates / ${distinctSlots} slots (${runId})`);
      console.log(flags.length ? `  FLAGS:\n    - ${flags.join('\n    - ')}` : '  FLAGS: none - healthy');
    }
    return;
  }

  // ---- sampling for the inspection workflow ----
  const { data: srcData } = await admin.from('sources').select('id,section_title,body_text,tier,qualifier').limit(2000);
  const srcBy = new Map(((srcData ?? []) as Row[]).map((s) => [s.id, s]));
  const { data: acctData } = await admin.from('accounts').select('handle,kind,data').limit(300);
  const acctBy = new Map(((acctData ?? []) as Row[]).map((a) => [a.handle, a]));

  const last48 = posts.filter((p) => Date.parse(p.published_at) > now - 2 * 86400_000);
  const pick = (kind: string, n: number) => shuffle(last48.filter((p) => p.kind === kind)).slice(0, n);
  const sampled = [...pick('company', 7), ...pick('chokepoint', 2), ...pick('theme', 3)];
  const tweets = sampled.map((p, i) => {
    const src = p.source_id ? srcBy.get(p.source_id) : undefined;
    const acct = acctBy.get(p.account);
    return {
      id: `T${i + 1}`,
      account: p.account,
      kind: p.kind,
      tier: p.tier,
      trigger: p.trigger,
      publishedAt: p.published_at,
      body: p.data?.body ?? '',
      sourceTitle: src?.section_title ?? '(source missing)',
      sourceText: (src?.body_text ?? '').slice(0, 1300),
      sourceTier: src?.tier,
      voice: (acct?.data?.persona_card?.voice ?? '').slice(0, 400),
    };
  });

  // accounts with >= 2 posts in the last 5 days, stratified 2 company / 1 chokepoint / 1 theme
  const last5d = posts.filter((p) => Date.parse(p.published_at) > now - 5 * 86400_000);
  const byAcct = new Map<string, Row[]>();
  for (const p of last5d) {
    if (!byAcct.has(p.account)) byAcct.set(p.account, []);
    byAcct.get(p.account)!.push(p);
  }
  const eligible = [...byAcct.entries()].filter(([, v]) => v.length >= 2);
  const pickAcct = (kind: string, n: number) =>
    shuffle(eligible.filter(([h]) => acctBy.get(h)?.kind === kind)).slice(0, n);
  const chosen = [...pickAcct('company', 2), ...pickAcct('chokepoint', 1), ...pickAcct('theme', 1)];
  const accounts = chosen.map(([handle, rows]) => {
    const acct = acctBy.get(handle);
    const srcIds = [...new Set(rows.map((r) => r.source_id).filter(Boolean))];
    return {
      handle,
      kind: acct?.kind,
      voice: (acct?.data?.persona_card?.voice ?? '').slice(0, 400),
      posts: rows.slice(0, 10).map((r) => ({
        publishedAt: r.published_at,
        tier: r.tier,
        trigger: r.trigger,
        body: r.data?.body ?? '',
      })),
      sources: srcIds.slice(0, 6).map((id) => {
        const s = srcBy.get(id);
        return { title: s?.section_title ?? id, text: (s?.body_text ?? '').slice(0, 1300) };
      }),
    };
  });

  console.log(JSON.stringify({ health, tweets, accounts }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
