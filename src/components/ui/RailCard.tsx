import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The ubiquitous bordered rail/panel card with an optional header bar. The header
 * is a slot so callers control its text style; `headerBg` picks yellow (chrome) or
 * cream (content). Standardizes the border/shadow/padding so rails don't drift.
 */
export function RailCard({
  header,
  headerBg = 'cream',
  shadow = true,
  bodyClassName,
  children,
  className,
}: {
  header?: ReactNode;
  headerBg?: 'yellow' | 'cream';
  shadow?: boolean;
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border bg-card', shadow && 'shadow', className)}>
      {header && (
        <div
          className={cn(
            'flex items-center justify-between border-b px-[14px] py-[9px]',
            headerBg === 'yellow' ? 'bg-yellow' : 'bg-band',
          )}
        >
          {header}
        </div>
      )}
      <div className={cn('p-[14px]', bodyClassName)}>{children}</div>
    </div>
  );
}
