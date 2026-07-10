import { cn } from '@/lib/cn';

/**
 * "You're caught up" - the feed ends, proudly. A designed moment, not an empty
 * state. No infinite scroll, no pull-to-refresh. Ported from the Component Library.
 */
export function Terminator({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-[540px] border bg-ink px-[26px] py-[32px] text-page shadow', className)}>
      <div className="font-mono font-bold text-[11px] uppercase tracking-[0.14em] text-yellow">End of feed</div>
      <div className="mt-[12px] font-bold text-[30px] leading-[1.1]">You&rsquo;re caught up.</div>
      <p className="mt-[12px] text-[16px] leading-[1.55] text-on-dark-alt">
        That&rsquo;s everything real. Nothing else happened. Go outside.
      </p>
      <div className="mt-[18px] border-t border-[#333] pt-[14px] font-mono text-[12px] text-muted-alt">
        No infinite scroll. No filler. We&rsquo;ll wake you when something breaks.
      </div>
    </div>
  );
}
