import type { ReactNode } from 'react';
import { getPosts, getAccounts, getAccount, getKillList, getTripwires, getResearchPage } from '@/lib/content';
import { TIER } from '@/lib/tiers';
import { PostCard } from '@/components/feed/PostCard';
import { Terminator } from '@/components/feed/Terminator';
import { KillListCard } from '@/components/feed/KillListCard';
import { TripwireRow, TripwireGroupHeader } from '@/components/feed/TripwireRow';
import { AccountTile } from '@/components/ui/AccountTile';
import { TierChip } from '@/components/ui/TierChip';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { PaywallGate } from '@/components/wiki/PaywallGate';
import { LockIcon } from '@/components/ui/Icons';

/**
 * Phase 2 test page: fixtures loaded and zod-parsed by the loaders, rendered
 * through the Phase 1 components. Proves the content layer returns typed data
 * the app can consume end to end.
 */
function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-[48px]">
      <header className="mb-[18px] flex flex-wrap items-baseline gap-[12px] border-b pb-[8px]">
        <h2 className="text-[24px] font-bold tracking-[-0.01em]">{title}</h2>
        <span className="font-mono text-[12px] text-muted">{note}</span>
      </header>
      {children}
    </section>
  );
}

export default function ContentTestPage() {
  const posts = getPosts();
  const accounts = getAccounts();
  const killList = getKillList();
  const tripwires = getTripwires();
  const research = getResearchPage('crwv');

  // Group tripwires by account, preserving fixture order.
  const groups: { handle: string; rows: typeof tripwires }[] = [];
  for (const t of tripwires) {
    const g = groups.find((x) => x.handle === t.account);
    if (g) g.rows.push(t);
    else groups.push({ handle: t.account, rows: [t] });
  }

  const freeSection = research?.sections.find((s) => !s.locked);
  const lockedSections = research?.sections.filter((s) => s.locked) ?? [];

  return (
    <div className="pb-[80px] pt-[24px]">
      <p className="font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
        Dev · /dev/content
      </p>
      <h1 className="mt-[8px] text-[36px] font-bold tracking-[-0.02em]">Content layer</h1>
      <p className="post-body mt-[8px] max-w-[640px] text-muted">
        Every block below is a fixture, loaded and zod-parsed by src/lib/content.ts, rendered through the
        Phase 1 components.
      </p>

      <Section title="Feed" note={`${posts.length} posts · getPosts()`}>
        <div className="mx-auto flex max-w-[640px] flex-col gap-[16px]">
          {posts.map((post) => (
            <PostCard key={post.id ?? post.handle + post.time} post={post} interactive />
          ))}
          <Terminator />
        </div>
      </Section>

      <Section title="Accounts" note={`${accounts.length} accounts · getAccounts()`}>
        <div className="grid gap-[12px] md:grid-cols-2">
          {accounts.map((a) => (
            <AccountTile key={a.handle} account={{ handle: a.handle, kind: a.kind, avatar: a.avatar, desc: a.desc }} />
          ))}
        </div>
      </Section>

      <Section title="Kill list" note={`${killList.length} verdicts · getKillList()`}>
        <div className="grid items-start gap-[18px] lg:grid-cols-2">
          {killList.map((k) => (
            <KillListCard
              key={k.id}
              claimId={k.id}
              claim={k.claim}
              verdict={k.verdict}
              verdictNote={k.verdict_note}
              explanation={k.explanation}
              receipts={k.receipts}
              related={k.related_accounts}
            />
          ))}
        </div>
      </Section>

      <Section title="Tripwires" note={`${tripwires.length} tripwires · getTripwires()`}>
        <div className="max-w-[620px] border bg-card">
          {groups.map((g) => {
            const account = getAccount(g.handle);
            return (
              <div key={g.handle}>
                <TripwireGroupHeader
                  account={{ handle: g.handle, kind: account?.kind ?? 'company', avatar: account?.avatar }}
                />
                {g.rows.map((t, i) => (
                  <TripwireRow
                    key={t.id}
                    status={t.status}
                    statement={t.description}
                    when={t.when}
                    postHref={t.post_id ? `#${t.post_id}` : undefined}
                    showAccount={false}
                    divider={i < g.rows.length - 1}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </Section>

      {research && (
        <Section title="Research page" note={`${research.slug} · ${research.section_count} sections · getResearchPage()`}>
          <div className="max-w-[600px]">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Research page · {research.account}
            </p>
            <h3 className="mt-[8px] text-[28px] font-bold leading-[1.05] tracking-[-0.02em]">
              {research.title}
            </h3>

            {freeSection && (
              <div className="mt-[16px] border-t-2 border-ink pt-[16px]">
                <div className="flex flex-wrap items-center gap-[12px]">
                  <span className="font-mono text-[13px] text-muted">§1</span>
                  <h4 className="text-[22px] font-bold">{freeSection.title}</h4>
                  {freeSection.tier && <TierChip tier={freeSection.tier} qualifier={freeSection.qualifier} />}
                </div>
                <p className="post-body mt-[12px] whitespace-pre-line text-[17px] leading-[1.7]">
                  {freeSection.body}
                </p>
                {freeSection.receipt && (
                  <ReceiptLink size="md" className="mt-[16px]">
                    receipt: {freeSection.receipt}
                  </ReceiptLink>
                )}
              </div>
            )}

            <PaywallGate className="mt-[24px]" />

            <div className="mt-[20px] flex flex-col gap-[10px]">
              {lockedSections.map((s) => (
                <div key={s.slug} className="flex items-center gap-[12px] border bg-band px-[16px] py-[14px]">
                  <LockIcon size={16} className="text-muted" />
                  <div className="flex-1">
                    <div className="text-[16px] font-bold">{s.title}</div>
                    {s.descriptor && (
                      <div className="mt-[2px] font-mono text-[11px] text-muted">{s.descriptor}</div>
                    )}
                  </div>
                  {s.tier && (
                    <TierChip
                      tier={s.tier}
                      size="mini"
                      label={s.tier === 'open' ? 'Open' : TIER[s.tier].base}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
