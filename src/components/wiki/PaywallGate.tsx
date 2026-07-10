import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { LockIcon } from '@/components/ui/Icons';

/**
 * Paywall gate - honest by construction. It states plainly what's inside and shows
 * it as a legible list. No blur-tease, no countdown, no fake scarcity.
 * Ported from the Component Library.
 */
export function PaywallGate({
  title = 'The rest is a Reader page.',
  subtitle = '6 more tier-annotated sections + open questions',
  includes = [
    'Full research page with every receipt',
    '"What would prove this wrong" block',
    'Daily digest of what actually changed',
  ],
  ctaLabel = 'Unlock Reader — $20/mo',
  ctaHref,
  onUnlock,
  reassurance = 'Cancel anytime · no card games',
  className,
}: {
  title?: string;
  subtitle?: string;
  includes?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  onUnlock?: () => void;
  reassurance?: string;
  className?: string;
}) {
  return (
    <div className={cn('border bg-ink px-[20px] py-[24px] text-page shadow', className)}>
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center border border-yellow text-yellow">
          <LockIcon size={17} />
        </span>
        <div>
          <div className="font-bold text-[19px]">{title}</div>
          <div className="font-mono text-[12px] text-muted-alt">{subtitle}</div>
        </div>
      </div>

      <div className="mt-[18px] flex flex-col gap-[8px]">
        {includes.map((item) => (
          <div key={item} className="flex items-center gap-[8px] text-[14px]">
            <span className="font-mono text-tier-solid" aria-hidden="true">
              ✓
            </span>
            {item}
          </div>
        ))}
      </div>

      <div className="mt-[20px] flex flex-wrap items-center gap-[14px]">
        <Button
          variant="subscribe"
          size="lg"
          className="shadow-hard-yellow"
          {...(ctaHref ? { href: ctaHref } : { onClick: onUnlock })}
        >
          {ctaLabel}
        </Button>
        <span className="font-mono text-[11px] text-muted-alt">{reassurance}</span>
      </div>
    </div>
  );
}
