import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Freshness stamp - mono 11px muted ("posted 2d ago"). Part of the trust band. */
export function FreshnessStamp({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[11px] text-muted', className)}>{children}</span>;
}
