import type { Metadata } from 'next';
import { getAccounts, getTripwires } from '@/lib/content';
import { TripwireGroupHeader, TripwireRow } from '@/components/feed/TripwireRow';
import type { Tripwire } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Tripwires · Ticker',
  description:
    'Every pre-registered thesis-breaker, grouped by account - a specific, checkable fact that would break the story. Calm until a light turns red.',
};

export const revalidate = 300;

export default async function TripwiresPage() {
  const [tripwires, accounts] = await Promise.all([getTripwires(), getAccounts()]);
  const fired = tripwires.filter((t) => t.status === 'fired').length;
  const armed = tripwires.filter((t) => t.status === 'armed').length;

  // Group by account, preserving first-appearance order from the loader.
  const order: string[] = [];
  const byAccount = new Map<string, Tripwire[]>();
  for (const t of tripwires) {
    if (!byAccount.has(t.account)) {
      byAccount.set(t.account, []);
      order.push(t.account);
    }
    byAccount.get(t.account)!.push(t);
  }
  const groups = order.map((handle) => ({
    handle,
    account: accounts.find((a) => a.handle === handle),
    rows: byAccount.get(handle)!,
  }));

  return (
    <section className="pt-[20px] md:pt-[28px]">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="mb-[20px] flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-sans text-[26px] font-bold tracking-[-0.02em] md:text-[30px]">
              Tripwires
            </h1>
            <p className="mt-[6px] max-w-[560px] text-[15px] leading-[1.5]">
              Every pre-registered thesis-breaker. We write the alarm before it can ring - a specific,
              checkable fact that would break the story. The board is calm on purpose. When a light
              turns red, that&rsquo;s the whole message. No advice follows.
            </p>
          </div>
          <div className="flex items-center gap-[16px]">
            <div className="flex items-center gap-[7px]">
              <div className="h-[16px] w-[16px] border bg-tier-disputed" />
              <span className="font-mono text-[11px] font-bold tracking-[0.05em]">FIRED · {fired}</span>
            </div>
            <div className="flex items-center gap-[7px]">
              <div className="h-[16px] w-[16px] border bg-card" />
              <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-muted">
                ARMED · {armed}
              </span>
            </div>
          </div>
        </div>

        <div className="border bg-card">
          {groups.map((g, gi) => (
            <div key={g.handle} className={gi < groups.length - 1 ? 'border-b' : undefined}>
              <TripwireGroupHeader
                account={{
                  handle: g.handle,
                  kind: g.account?.kind ?? 'company',
                  avatar: g.account?.avatar,
                }}
              />
              {g.rows.map((t, ti) => (
                <TripwireRow
                  key={t.id}
                  status={t.status}
                  statement={t.description}
                  when={t.when}
                  postHref={t.post_id ? `/p/${t.post_id}` : undefined}
                  showAccount={false}
                  divider={ti < g.rows.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
