import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pricing - Ticker',
  description:
    'The feed is free. Depth is the upgrade. Reader $20/mo unlocks every research page and the digest; Pro $40/mo adds chat and tripwire push. Cancel anytime, no dark patterns.',
};

function Feature({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={cn(
        'flex gap-[9px] text-[14px] leading-[1.45]',
        muted && 'text-[#9E9E9E]',
      )}
    >
      <span
        className={cn(
          'font-mono font-bold',
          muted ? 'text-[#9E9E9E]' : 'text-check-green',
        )}
        aria-hidden="true"
      >
        {muted ? '-' : '✓'}
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function PricingPage() {
  return (
    <section className="py-8 md:py-12">
      {/* intro */}
      <div className="mb-[24px] text-left md:mb-[26px] md:text-center">
        <h1 className="text-[24px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px]">
          The feed is free. Depth is the upgrade.
        </h1>
        <p className="mx-auto mt-[8px] hidden max-w-[560px] text-[15px] leading-[1.55] md:block">
          {`No engagement bait, no ads, no selling your data. You pay us so the research stays independent - or you don't, and the feed is still yours.`}
        </p>
      </div>

      {/* plans */}
      <div className="mx-auto grid max-w-[960px] grid-cols-1 items-start gap-[18px] md:grid-cols-3">
        {/* free */}
        <div className="border bg-card">
          <div className="border-b bg-card px-[18px] py-[18px]">
            <div className="text-[20px] font-bold">Free</div>
            <div className="mt-[6px] text-[36px] font-bold leading-none">$0</div>
            <div className="mt-[6px] font-mono text-[12px] text-muted">The feed, forever.</div>
          </div>
          <div className="flex flex-col gap-[11px] px-[18px] py-[16px]">
            <Feature>The full feed - every account, every tier chip</Feature>
            <Feature>One-tap receipts to the source</Feature>
            <Feature>Kill List + Tripwire boards</Feature>
            <Feature>Follow accounts · share posts</Feature>
            <Button variant="secondary" size="lg" href="/pricing" className="mt-[8px] w-full">
              Start free - no card
            </Button>
          </div>
        </div>

        {/* reader - elevated */}
        <div className="border bg-card shadow md:-translate-y-[6px]">
          <div className="border-b bg-cyan px-[18px] py-[18px]">
            <div className="flex items-center justify-between gap-[8px]">
              <span className="text-[20px] font-bold">Reader</span>
              <span className="border bg-card px-[7px] py-[2px] font-mono text-[9px] font-bold uppercase tracking-[0.06em]">
                most readers pick this
              </span>
            </div>
            <div className="mt-[6px] flex items-baseline gap-[6px]">
              <span className="text-[36px] font-bold leading-none">$20</span>
              <span className="font-mono text-[12px]">/mo</span>
            </div>
            <div className="mt-[6px] font-mono text-[12px]">Everything free, plus depth.</div>
          </div>
          <div className="flex flex-col gap-[11px] px-[18px] py-[16px]">
            <Feature>Every research page - all sections + receipts</Feature>
            <Feature>&quot;What would prove this wrong&quot; blocks</Feature>
            <Feature>A calm daily digest of what changed</Feature>
            <Feature muted>Chat + push alerts (Pro)</Feature>
            <Button variant="subscribe" size="lg" href="/pricing" className="mt-[8px] w-full">
              Unlock Reader - $20/mo
            </Button>
          </div>
        </div>

        {/* pro */}
        <div className="border bg-card">
          <div className="border-b bg-ink px-[18px] py-[18px] text-page">
            <div className="text-[20px] font-bold text-yellow">Pro</div>
            <div className="mt-[6px] flex items-baseline gap-[6px]">
              <span className="text-[36px] font-bold leading-none">$40</span>
              <span className="font-mono text-[12px] text-on-dark">/mo</span>
            </div>
            <div className="mt-[6px] font-mono text-[12px] text-on-dark">
              Everything in Reader, plus alerts.
            </div>
          </div>
          <div className="flex flex-col gap-[11px] px-[18px] py-[16px]">
            <Feature>Everything in Reader</Feature>
            <Feature>Chat with the research library</Feature>
            <Feature>Push the moment a tripwire fires</Feature>
            <Button variant="primary" size="lg" href="/pricing" className="mt-[8px] w-full">
              Go Pro - $40/mo
            </Button>
          </div>
        </div>
      </div>

      {/* honest footer */}
      <div className="mx-auto mt-[22px] max-w-[960px] text-center font-mono text-[11px] leading-[1.6] text-muted">
        Cancel anytime · no countdowns · no fake scarcity · the feed stays free forever · billing
        handled by Stripe.
      </div>
    </section>
  );
}
