import type { Metadata } from 'next';
import { getPosts, getKillList, attachReceipts, receiptHref } from '@/lib/content';
import { tierLabel } from '@/lib/tiers';
import { PostCard } from '@/components/feed/PostCard';
import { TierChip } from '@/components/ui/TierChip';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { FreshnessStamp } from '@/components/ui/FreshnessStamp';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Ticker - the anti-fintwit',
  description:
    'Sourced. Confidence-labeled. Allowed to say "we don\'t know." Every post is built only from verified research, with a receipt. No hype, no advice, and the feed actually ends.',
};

export const revalidate = 300;

export default async function Home() {
  const [posts, killList] = await Promise.all([getPosts(), getKillList()]);
  const preview = ['corz-q1-colocation', 'nvda-bandwidth-estimate']
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const crwv = posts.find((p) => p.id === 'crwv-quote-corz');
  const killed = killList.find((k) => k.verdict === 'killed');

  const previewItems = await attachReceipts(preview);
  const crwvHref = crwv ? await receiptHref(crwv) : undefined;

  return (
    <section className="py-6 md:py-10">
      <div className="border bg-page shadow">
        {/* ============ HERO ============ */}
        <div className="border-b md:flex md:items-stretch">
          {/* left column */}
          <div className="border-b px-[16px] py-[24px] md:flex-1 md:border-b-0 md:border-r md:px-[40px] md:py-[44px]">
            <span className="inline-block border bg-yellow px-[10px] py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] md:text-[11px] md:shadow">
              The anti-FinTwit
            </span>

            <h1 className="mt-[14px] text-[30px] font-bold leading-[1.05] tracking-[-0.02em] md:mt-[22px] md:text-[48px] md:leading-[1.02] md:tracking-[-0.03em]">
              {`Sourced. Confidence-labeled. Allowed to say "we don't know."`}
            </h1>

            <p className="post-body mt-[12px] text-[15px] leading-[1.55] md:hidden">
              {`Every account is a company, a chokepoint, or a theme. Every post is built only from verified research - with a receipt. No hype, no advice, and the feed actually ends.`}
            </p>
            <p className="post-body mt-[20px] hidden max-w-[520px] text-[18px] leading-[1.6] md:block">
              {`Every account is a company, a chokepoint, or a theme. Every post is built only from verified, primary-source research - and carries a receipt. No hype. No buy/sell. And the feed actually ends.`}
            </p>

            <div className="mt-[18px] flex flex-col gap-[14px] md:mt-[28px] md:flex-row md:items-center">
              <Button
                variant="subscribe"
                size="lg"
                href="/feed"
                className="w-full md:w-auto"
              >
                Read the feed - free
              </Button>
              <Button
                variant="secondary"
                size="lg"
                href="#how-it-works"
                className="hidden md:inline-flex"
              >
                See how it works
              </Button>
            </div>

            <div className="mt-[24px] hidden font-mono text-[12px] leading-[1.6] text-muted md:block">
              {`No account needed to read · you never post · the feed says "you're caught up" and stops.`}
            </div>
          </div>

          {/* feed preview panel */}
          <div className="bg-[#EDE4CF] px-[16px] py-[18px] md:w-[460px] md:flex-none md:px-[26px] md:py-[28px]">
            <div className="mb-[12px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
              This is the actual feed - not a mockup
            </div>
            <div className="flex flex-col gap-[12px]">
              {previewItems.map(({ post, receiptHref }) => (
                <PostCard key={post.id} post={post} receiptHref={receiptHref} />
              ))}
            </div>
          </div>
        </div>

        {/* ============ TRUST TRIO ============ */}
        <div id="how-it-works" className="border-b px-[16px] py-[24px] md:p-[40px]">
          <h2 className="mb-[20px] text-[22px] font-bold tracking-[-0.02em] md:mb-[24px] md:text-[28px]">
            {`Trust is the product. So it's the UI.`}
          </h2>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
            {/* card 1 - confidence */}
            <div className="border bg-card p-[22px] shadow">
              <div className="text-[18px] font-bold">Every claim wears its confidence.</div>
              <p className="mt-[8px] mb-[16px] text-[14px] leading-[1.55]">
                Green when it&apos;s in the filings. Yellow when it&apos;s an estimate. Red when
                it&apos;s disputed. Never color alone - always a label.
              </p>
              <div className="flex flex-col items-start gap-[8px]">
                <TierChip tier="solid" qualifier="from the filings" size="inline" />
                <TierChip tier="needs" qualifier="estimate" size="inline" />
              </div>
            </div>

            {/* card 2 - receipts */}
            <div className="border bg-card p-[22px] shadow">
              <div className="text-[18px] font-bold">Receipts, one tap away.</div>
              <p className="mt-[8px] mb-[16px] text-[14px] leading-[1.55]">
                From any claim to the exact research section it came from - a single tap. No
                &quot;trust me.&quot; Just the source.
              </p>
              {crwv && crwvHref && (
                <div className="border bg-band p-[12px]">
                  <ReceiptLink href={crwvHref} size="sm">
                    source: {crwv.source}
                  </ReceiptLink>
                  <div className="mt-[6px]">
                    <FreshnessStamp>{crwv.freshness}</FreshnessStamp>
                  </div>
                </div>
              )}
            </div>

            {/* card 3 - kill list */}
            <div className="border bg-card p-[22px] shadow">
              <div className="text-[18px] font-bold">A Kill List for viral nonsense.</div>
              <p className="mt-[8px] mb-[16px] text-[14px] leading-[1.55]">
                When a claim goes viral on real X, we check it against primary sources and publish
                the verdict - with receipts.
              </p>
              {killed && (
                <>
                  <div className="border-l-4 border-l-ink pl-[10px] text-[13px] font-bold leading-[1.35]">
                    {killed.claim}
                  </div>
                  <div className="mt-[10px]">
                    <span className="inline-block border bg-tier-disputed px-[13px] py-[3px] text-[18px] font-bold tracking-[0.02em] text-ink shadow">
                      {killed.verdict.toUpperCase()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ============ PRICING TEASER ============ */}
        <div className="flex flex-col gap-[16px] bg-ink px-[16px] py-[20px] text-page md:flex-row md:items-center md:justify-between md:gap-[30px] md:p-[40px]">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] md:text-[30px]">
              The feed is free. Depth is the upgrade.
            </h2>
            <p className="mt-[6px] font-mono text-[11px] leading-[1.5] text-on-dark md:mt-[8px] md:text-[13px]">
              Reader $20/mo - every research page + digest · Pro $40/mo - chat + tripwire push.
            </p>
          </div>
          <div className="flex flex-col gap-[12px] md:flex-row">
            <Button
              variant="subscribe"
              size="lg"
              href="/pricing"
              className="w-full shadow-hard-yellow md:w-auto"
            >
              See plans
            </Button>
            <Button
              variant="ghost"
              size="lg"
              href="/feed"
              className="hidden border-page text-page hover:bg-page hover:text-ink md:inline-flex"
            >
              Read the feed
            </Button>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="flex flex-wrap items-center justify-between gap-[12px] border-t bg-yellow px-[16px] py-[18px] md:px-[40px]">
          <span className="text-[16px] font-bold">TICKER</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.04em]">
            Research, not advice · you&apos;re caught up · go outside
          </span>
        </div>
      </div>
    </section>
  );
}
