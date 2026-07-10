import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Lavender @-mention / account-reference chip. Renders a link when `href` is given. */
export function MentionChip({
  children,
  href,
  size = 'md',
  className,
}: {
  children: ReactNode;
  href?: string;
  size?: 'md' | 'sm';
  className?: string;
}) {
  const classes = cn(
    'inline-block border bg-lavender font-mono font-bold text-ink no-underline',
    size === 'sm' ? 'text-[11px] px-[7px] py-[1px]' : 'text-[12px] px-[8px] py-[2px]',
    className,
  );
  return href ? (
    <a
      href={href}
      className={cn(
        classes,
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2',
      )}
    >
      {children}
    </a>
  ) : (
    <span className={classes}>{children}</span>
  );
}
