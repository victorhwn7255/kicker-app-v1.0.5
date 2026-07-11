import { getKillList, getTripwires } from '@/lib/content';
import { RailCard } from '@/components/ui/RailCard';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { KillVerdict } from '@/lib/types';

/** Verdict stamp colors for the kill-list highlight (mirrors KillListCard). */
const VERDICT: Record<KillVerdict, { label: string; bg: string }> = {
  killed: { label: 'KILLED', bg: 'bg-tier-disputed' },
  survived: { label: 'SURVIVED', bg: 'bg-tier-solid' },
  partly: { label: 'PARTLY TRUE', bg: 'bg-tier-needs' },
};

/**
 * The home-feed right rail (desktop only): kill-list highlight, tripwires, and a
 * reader upsell. Pulls the latest kill-list entry and the first few tripwires so
 * the rail always reflects real content.
 */
export async function RightRail({ signedIn = false }: { signedIn?: boolean }) {
  const latest = (await getKillList())[0];
  const verdict = VERDICT[latest.verdict];
  const tripwires = (await getTripwires()).slice(0, 3);

  return (
    <aside className="hidden w-[300px] flex-none flex-col gap-[16px] md:flex">
      {/* Kill List highlight */}
      <RailCard
        headerBg="yellow"
        header={
          <>
            <span className="font-bold text-[12px]">KILL LIST</span>
            <span className="font-mono font-bold text-[9px] uppercase tracking-[0.08em]">latest</span>
          </>
        }
      >
        <div className="border-l-4 border-l-ink pl-[9px] font-bold text-[13px] leading-[1.35]">
          {latest.claim}
        </div>
        <div className="mt-[10px]">
          <span
            className={cn(
              'inline-block border font-sans font-bold text-[15px] px-[11px] py-[3px] shadow text-ink',
              verdict.bg,
            )}
          >
            {verdict.label}
          </span>
        </div>
        <ReceiptLink href="/kill-list" size="sm" className="mt-[12px]">
          the receipts
        </ReceiptLink>
      </RailCard>

      {/* Tripwires */}
      <RailCard
        headerBg="yellow"
        header={<span className="font-bold text-[12px]">TRIPWIRES</span>}
        bodyClassName="px-[12px] py-[4px]"
      >
        {tripwires.map((tw, i) => {
          const fired = tw.status === 'fired';
          return (
            <a
              key={tw.id}
              href="/tripwires"
              className={cn(
                'flex items-center gap-[9px] py-[8px] no-underline text-ink hover:bg-surface-alt',
                i < tripwires.length - 1 && 'border-b-2 border-b-[#eee]',
              )}
            >
              <span className={cn('h-[14px] w-[14px] flex-none border', fired ? 'bg-tier-disputed' : 'bg-card')} />
              <span className="flex-1 text-[12px] leading-[1.3]">
                {tw.description}{' '}
                <span className="font-mono text-[10px] text-muted">{tw.account}</span>
              </span>
              <span
                className={cn('font-mono font-bold text-[9px]', fired ? 'text-ink' : 'text-muted')}
              >
                {fired ? 'FIRED' : 'ARMED'}
              </span>
            </a>
          );
        })}
      </RailCard>

      {/* Free-account card (free-first). Hidden once signed in. */}
      {!signedIn && (
        <div className="border bg-band p-[14px]">
          <div className="font-bold text-[15px]">Read the receipts in full.</div>
          <p className="mt-[6px] mb-[12px] font-mono text-[11px] leading-[1.5] text-muted">
            Create a free account to follow accounts, unlock every research page, and get a calm digest. No card.
          </p>
          <Button variant="subscribe" href="/auth" className="w-full">
            Create a free account
          </Button>
        </div>
      )}
    </aside>
  );
}
