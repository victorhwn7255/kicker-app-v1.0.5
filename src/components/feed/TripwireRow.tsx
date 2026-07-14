import { cn } from '@/lib/cn';
import type { Kind } from '@/lib/kinds';
import { KIND_LABEL } from '@/lib/kinds';
import { Avatar } from '@/components/ui/Avatar';
import { ReceiptLink } from '@/components/ui/ReceiptLink';

/**
 * Tripwire row - a warning-lights panel. Status is a square, never color alone:
 * the FIRED/ARMED word is always present. Fired rows are bold with a faint red tint.
 * Ported from the Component Library + Tripwire Board wireframe.
 */
export type TripwireStatus = 'fired' | 'armed';

export function TripwireRow({
  status,
  statement,
  account,
  when,
  postHref,
  showAccount = true,
  divider = true,
  className,
}: {
  status: TripwireStatus;
  statement: string;
  account?: { handle: string; kind: Kind };
  when: string;
  postHref?: string;
  /** Hide the inline account chip when rows are already grouped under a header. */
  showAccount?: boolean;
  divider?: boolean;
  className?: string;
}) {
  const fired = status === 'fired';
  return (
    <div
      className={cn(
        'flex items-start gap-[14px] p-[16px]',
        divider && 'border-b',
        fired && 'bg-[#FFF3F3]',
        className,
      )}
    >
      <div className="flex w-[64px] flex-none flex-col items-center gap-[5px]">
        <div className={cn('h-[18px] w-[18px] border', fired ? 'bg-tier-disputed' : 'bg-card')} />
        <span
          className={cn(
            'font-mono font-bold text-[10px] tracking-[0.06em]',
            fired ? 'text-ink' : 'text-muted',
          )}
        >
          {fired ? 'FIRED' : 'ARMED'}
        </span>
      </div>
      <div className="flex-1">
        <div className={cn('text-[15px] leading-[1.45]', fired && 'font-bold')}>{statement}</div>
        <div className="mt-[8px] flex flex-wrap items-center gap-[10px]">
          {showAccount && account && (
            <span
              className={cn(
                'border px-[7px] py-[1px] font-mono font-bold text-[11px]',
                account.kind === 'chokepoint' ? 'bg-ink text-white' : 'bg-card text-ink',
              )}
            >
              {account.handle}
            </span>
          )}
          <span className="font-mono text-[11px] text-muted">{when}</span>
          {fired && postHref && (
            <ReceiptLink href={postHref} size="sm">
              the post
            </ReceiptLink>
          )}
        </div>
      </div>
    </div>
  );
}

/** Account group header for the tripwire board - cream bar with avatar + handle + kind. */
export function TripwireGroupHeader({
  account,
  className,
}: {
  account: { handle: string; kind: Kind; avatar?: string };
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-[10px] border-b bg-band px-[16px] py-[9px]', className)}>
      <Avatar kind={account.kind} text={account.avatar} handle={account.handle} size={28} />
      <span className="font-mono font-bold text-[14px]">{account.handle}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
        {KIND_LABEL[account.kind]}
      </span>
    </div>
  );
}
