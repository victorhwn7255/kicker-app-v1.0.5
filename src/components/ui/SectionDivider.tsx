import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Mono label + a 2px black rule ("Posts · newest first", "1 reply", "Companies"). */
export function SectionDivider({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-[12px]', className)}>
      <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em]">{children}</span>
      <div className="h-[2px] flex-1 bg-ink" />
    </div>
  );
}
