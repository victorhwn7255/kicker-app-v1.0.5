import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The receipt link - one tap to the source. Mono 700 uppercase, 2px underline,
 * fills yellow on hover. Caller passes the full label text ("source: CORZ / financials",
 * "receipts: listing docs", "the post"); this adds the arrow and interaction states.
 * `post` size keeps a >=22px hit area; the enclosing row provides the 44px mobile target.
 */
export function ReceiptLink({
  children,
  href = '#',
  onClick,
  size = 'post',
  className,
}: {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** post = 11px with a >=22px hit area (trust bands); md = 12px standalone; sm = 11px inline meta. */
  size?: 'post' | 'md' | 'sm';
  className?: string;
}) {
  const SIZE = {
    post: 'min-h-[22px] text-[11px] tracking-[0.03em]',
    md: 'text-[12px] tracking-[0.03em]',
    sm: 'text-[11px] tracking-[0.03em]',
  };
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-[6px] border-b-2 border-ink pb-[1px] font-mono font-bold uppercase',
        'text-ink no-underline transition-colors duration-[50ms] hover:bg-yellow',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2',
        SIZE[size],
        className,
      )}
    >
      <span>{children}</span>
      <span className="text-[13px]" aria-hidden="true">
        →
      </span>
    </a>
  );
}
