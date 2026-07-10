import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { MentionChip } from '@/components/ui/MentionChip';

/**
 * Kill-list card - a viral claim checked against primary sources, built to be
 * screenshotted with the brand visible. Ported from the Component Library.
 */
export type KillVerdict = 'killed' | 'survived' | 'partly';

const VERDICT: Record<KillVerdict, { label: string; bg: string }> = {
  killed: { label: 'KILLED', bg: 'bg-tier-disputed' },
  survived: { label: 'SURVIVED', bg: 'bg-tier-solid' },
  partly: { label: 'PARTLY TRUE', bg: 'bg-tier-needs' },
};

export function KillListCard({
  claimId,
  claim,
  verdict,
  verdictNote,
  explanation,
  receipts,
  receiptHref = '#',
  related,
  className,
}: {
  claimId: string;
  claim: string;
  verdict: KillVerdict;
  verdictNote?: ReactNode;
  explanation: string;
  receipts: string;
  receiptHref?: string;
  related?: string[];
  className?: string;
}) {
  const v = VERDICT[verdict];
  return (
    <div className={cn('max-w-[560px] border bg-card shadow', className)}>
      <div className="flex items-center justify-between border-b bg-yellow px-[16px] py-[8px]">
        <span className="font-bold text-[14px] tracking-[-0.01em]">TICKER · KILL LIST</span>
        <span className="font-mono font-bold text-[10px] uppercase tracking-[0.08em]">{claimId}</span>
      </div>

      <div className="px-[16px] py-[18px]">
        <div className="mb-[8px] font-mono font-bold text-[11px] uppercase tracking-[0.1em] text-muted">
          The claim, as circulated
        </div>
        <blockquote className="border-l-4 border-l-ink pl-[12px] font-bold text-[17px] leading-[1.4]">
          {claim}
        </blockquote>

        <div className="mt-[18px] flex items-center gap-[12px]">
          <span
            className={cn(
              'border font-sans font-bold text-[26px] tracking-[0.02em] px-[18px] py-[6px] shadow',
              v.bg,
              'text-ink',
            )}
          >
            {v.label}
          </span>
          {verdictNote && (
            <span className="font-mono text-[11px] leading-[1.4] text-muted">{verdictNote}</span>
          )}
        </div>

        <p className="mt-[18px] text-[15px] leading-[1.55]">{explanation}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[12px] border-t bg-band px-[16px] py-[11px]">
        <ReceiptLink href={receiptHref}>receipts: {receipts}</ReceiptLink>
        {related && related.length > 0 && (
          <div className="flex items-center gap-[6px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">related</span>
            {related.map((handle) => (
              <MentionChip key={handle} size="sm">
                {handle}
              </MentionChip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
