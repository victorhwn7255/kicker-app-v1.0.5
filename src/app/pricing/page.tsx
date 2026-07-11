import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { TierChip } from '@/components/ui/TierChip';

export const metadata: Metadata = {
  title: 'Free while in beta · Ticker',
  description:
    'Ticker is free while in beta. Create a free account to follow accounts and read every research page - no card.',
};

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-[720px] py-[40px] md:py-[64px]">
      <div className="border bg-card p-[28px] shadow md:p-[44px]">
        <span className="inline-block border bg-yellow px-[10px] py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] shadow">
          Free while in beta
        </span>
        <h1 className="mt-[16px] text-[30px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[42px]">
          Ticker is free.
        </h1>
        <p className="post-body mt-[14px] max-w-[520px] text-[16px] leading-[1.6] md:text-[18px]">
          No payments, no paywall while we&rsquo;re in beta. Create a free account to follow accounts, get a calm
          daily digest, and read every research page in full. The only thing we ask: an email for the magic link.
        </p>

        <div className="mt-[22px] flex flex-col gap-[10px]">
          {[
            'The whole feed, sourced and confidence-labeled',
            'Follow companies, chokepoints, and themes',
            'Every research page, every receipt',
            'A calm digest of what actually changed',
          ].map((item) => (
            <div key={item} className="flex items-center gap-[10px] text-[15px]">
              <span className="font-mono text-tier-solid" aria-hidden>
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>

        <div className="mt-[26px] flex flex-wrap items-center gap-[14px]">
          <Button variant="subscribe" size="lg" href="/auth" className="shadow-hard-yellow">
            Create a free account →
          </Button>
          <Button variant="secondary" size="lg" href="/feed">
            Read the feed first
          </Button>
        </div>

        <div className="mt-[24px] flex items-center gap-[10px] border-t pt-[16px]">
          <TierChip tier="solid" size="inline" />
          <span className="font-mono text-[11px] leading-[1.5] text-muted">
            Research, not advice. You only ever read - Ticker never posts as you.
          </span>
        </div>
      </div>
    </section>
  );
}
