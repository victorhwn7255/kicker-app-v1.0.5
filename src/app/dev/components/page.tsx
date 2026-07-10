'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Post } from '@/components/feed/PostCard';
import { PostCard } from '@/components/feed/PostCard';
import { Terminator } from '@/components/feed/Terminator';
import { KillListCard } from '@/components/feed/KillListCard';
import { TripwireRow, TripwireGroupHeader } from '@/components/feed/TripwireRow';
import { PaywallGate } from '@/components/wiki/PaywallGate';
import { AccountTile } from '@/components/ui/AccountTile';
import { TierChip } from '@/components/ui/TierChip';
import { Avatar } from '@/components/ui/Avatar';
import { KindBadge } from '@/components/ui/KindBadge';
import { Button } from '@/components/ui/Button';
import { FollowButton } from '@/components/ui/FollowButton';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Toggle } from '@/components/ui/Toggle';
import { FeedToggle, type FeedMode } from '@/components/ui/FeedToggle';
import { MentionChip } from '@/components/ui/MentionChip';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { PostCardSkeleton } from '@/components/ui/Skeleton';
import { ShareIcon } from '@/components/ui/Icons';

/* ---- Verbatim sample content (design/README.md "Content") ---- */

const CORZ_BODY =
  'Q1 numbers are in. Colocation revenue $77.5M — first quarter it beat our own bitcoin mining. The pivot is real.';

const POSTS: Record<string, Post> = {
  original: {
    handle: '@CORZ', kind: 'company', time: '2h', body: CORZ_BODY,
    tier: 'solid', qualifier: 'from the 10-Q', source: 'CORZ / financials',
    freshness: 'verified 2d ago', avatar: 'CORZ', variant: 'original',
  },
  quote: {
    handle: '@CRWV', kind: 'company', time: '1h',
    body: 'That colocation revenue? 100% of it is us. One customer. Their filing says it, not us. Sleep well, bondholders.',
    tier: 'solid', qualifier: 'from the 10-K', source: 'CRWV / customer concentration',
    freshness: 'verified 1d ago', avatar: 'CRWV', variant: 'quote',
    quoted: { handle: '@CORZ', kind: 'company', avatar: 'CORZ', time: '2h', body: CORZ_BODY, tier: 'solid' },
  },
  reply: {
    handle: '@who-holds-the-risk', kind: 'theme', time: '1h',
    body: 'And that one customer relationship is financed by a $3.3B project bond at 7.75%. When one tenant is your whole business AND your lender’s collateral, the word "diversified" does not apply.',
    tier: 'solid', qualifier: 'from filings', source: 'project bond / terms',
    freshness: 'verified 1d ago', variant: 'reply', replyTo: '@CRWV',
  },
  thread: {
    handle: '@transformer-supply', kind: 'chokepoint', time: '4h',
    body: 'Lead times for large power transformers: still 128–144 weeks. That’s ~3 years to get the thing every new datacenter needs. Nobody panicked. They probably should.',
    tier: 'solid', source: 'lead-time tracker', freshness: 'verified 5d ago',
    avatar: 'TRF', variant: 'thread', thread: '1/6', threadNext: '2/6 → next segment',
  },
  high: {
    handle: '@CORZ', kind: 'company', time: '2h',
    body: 'Colocation revenue $77.5M — first quarter it beat our own bitcoin mining. A pre-registered thesis-breaker just fired.',
    tier: 'solid', qualifier: 'from the 10-Q', source: 'tripwire / CORZ mix',
    freshness: 'verified 2d ago', avatar: 'CORZ', variant: 'high', highLabel: 'Tripwire fired',
  },
  open: {
    handle: '@HBM-memory', kind: 'chokepoint', time: '6h',
    body: 'My page’s open question #2 is still open: can anyone besides three companies on earth actually make me at scale? So far: no.',
    tier: 'open', source: 'HBM page / open Q#2', freshness: 'verified 6d ago', avatar: 'HBM',
  },
  needs: {
    handle: '@NVDA', kind: 'company', time: '3h',
    body: 'Analysts think my next architecture doubles memory bandwidth again. They’ve been right before. They’ve also been early before. Filed under: we’ll see.',
    tier: 'needs', qualifier: 'estimate', source: 'analyst notes', freshness: 'verified 3h ago', avatar: 'NVDA',
  },
};

/* ---- Layout helpers ---- */

function Section({ n, title, note, children }: { n: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-[56px]">
      <header className="mb-[20px] flex flex-wrap items-baseline gap-[14px] border-b pb-[8px]">
        <span className="font-mono font-bold text-[13px]">{n}</span>
        <h2 className="text-[26px] font-bold tracking-[-0.01em]">{title}</h2>
        <span className="font-mono text-[12px] text-muted">{note}</span>
      </header>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] font-mono font-bold text-[11px] uppercase tracking-[0.1em] text-muted">{children}</div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border bg-card p-[20px]', className)}>{children}</div>;
}

export default function ComponentsPage() {
  const [grayscale, setGrayscale] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('following');
  const [checked, setChecked] = useState(true);
  const [toggleOn, setToggleOn] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({ demo: false });

  return (
    <div className="pb-[80px] pt-[24px]">
      {/* Masthead */}
      <div className="border bg-ink px-[26px] py-[28px] text-page shadow">
        <div className="font-mono font-bold text-[12px] uppercase tracking-[0.12em] text-yellow">
          Dev · /dev/components
        </div>
        <h1 className="mt-[8px] text-[36px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[44px]">
          Component Library
        </h1>
        <p className="mt-[14px] max-w-[640px] text-[16px] leading-[1.55] text-on-dark-alt">
          The review gate. Open this next to design/wireframes/Component Library.dc.html and compare with an
          obsessive eye. Every post carries its own credibility - tier chip, receipt, freshness.
        </p>
      </div>

      <Section n="04" title="Tier chip system" note="label carries meaning · color only reinforces">
        <Panel>
          <Label>Hero</Label>
          <div className="flex flex-col items-start gap-[16px]">
            <TierChip tier="solid" qualifier="from the filings" size="hero" />
            <TierChip tier="needs" qualifier="estimate" size="hero" />
            <TierChip tier="disputed" size="hero" />
          </div>
        </Panel>

        <div className="mt-[20px] grid gap-[20px] md:grid-cols-2">
          <Panel>
            <Label>Post size (all four tiers)</Label>
            <div className="flex flex-col items-start gap-[12px]">
              <TierChip tier="solid" qualifier="from the 10-Q" />
              <TierChip tier="needs" qualifier="estimate" />
              <TierChip tier="disputed" />
              <TierChip tier="open" />
            </div>
            <Label>Inline · mini</Label>
            <div className="flex flex-wrap items-start gap-[12px]">
              <TierChip tier="solid" size="inline" label="Solid" />
              <TierChip tier="needs" size="inline" label="Needs checking" />
              <TierChip tier="solid" size="mini" label="Solid" />
              <TierChip tier="open" size="mini" label="Open" />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <Label>Grayscale proof - label survives without color</Label>
              <Button size="sm" variant="secondary" onClick={() => setGrayscale((g) => !g)}>
                {grayscale ? 'Color' : 'Grayscale'}
              </Button>
            </div>
            <div className={cn('flex flex-col items-start gap-[10px]', grayscale && 'grayscale')}>
              <TierChip tier="solid" label="Solid" />
              <TierChip tier="needs" label="Needs checking" />
              <TierChip tier="disputed" label="Disputed" />
              <TierChip tier="open" label="Open question — unresolved" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section n="05" title="Kind badges" note="neutral - never fight the tier chips">
        <Panel className="flex flex-wrap items-center gap-[16px]">
          <KindBadge kind="company" />
          <KindBadge kind="chokepoint" />
          <KindBadge kind="theme" />
          <span className="mx-[8px] h-[24px] w-[2px] bg-ink" />
          <KindBadge kind="company" size="sm" />
          <KindBadge kind="chokepoint" size="sm" />
          <KindBadge kind="theme" size="sm" />
        </Panel>
      </Section>

      <Section n="06" title="Avatar system" note="company = white + ticker · chokepoint = black + code · theme = nodes">
        <Panel>
          <div className="flex flex-wrap items-end gap-[16px]">
            <Avatar kind="company" text="NVDA" size={56} />
            <Avatar kind="company" text="CRWV" size={56} />
            <Avatar kind="chokepoint" text="TRF" size={56} />
            <Avatar kind="chokepoint" text="HBM" size={56} />
            <Avatar kind="theme" size={56} />
          </div>
          <div className="mt-[18px] flex flex-wrap items-end gap-[12px]">
            <Avatar kind="company" text="NV" size={24} />
            <Avatar kind="company" text="NVDA" size={32} />
            <Avatar kind="company" text="NVDA" size={40} />
            <Avatar kind="company" text="NVDA" size={56} />
            <Avatar kind="company" text="NVDA" size={80} />
          </div>
          <div className="mt-[6px] font-mono text-[10px] text-muted-alt">24 · 32 · 40 · 56 · 80px</div>
        </Panel>
      </Section>

      <Section n="07" title="Buttons, inputs & controls" note="hover = instant swap · active = stamp-press · pink focus ring">
        <div className="grid gap-[20px] md:grid-cols-2">
          <Panel>
            <Label>Buttons</Label>
            <div className="flex flex-wrap items-center gap-[12px]">
              <Button variant="primary">Follow</Button>
              <Button variant="subscribe">Subscribe</Button>
              <Button variant="secondary">Share</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <Label>States - active follow · disabled · icon</Label>
            <div className="flex flex-wrap items-center gap-[12px]">
              <Button variant="following">Following</Button>
              <Button variant="subscribe" disabled>
                Subscribed
              </Button>
              <IconButton label="Copy link" className="shadow">
                <ShareIcon size={18} />
              </IconButton>
            </div>
            <Label>Live follow toggle</Label>
            <FollowButton
              size="md"
              following={following.demo}
              onToggle={() => setFollowing((f) => ({ ...f, demo: !f.demo }))}
            />
          </Panel>

          <Panel>
            <Label>Inputs &amp; controls</Label>
            <Input placeholder="you@example.com" className="mb-[12px]" />
            <Input readOnly value="focused - pink ring" className="mb-[12px] border-pink shadow-hard-pink" />
            <div className="mt-[6px] flex flex-wrap items-center gap-[20px]">
              <Checkbox checked={checked} onChange={setChecked} label="Checked" />
              <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
              <div className="flex items-center gap-[8px]">
                <Toggle checked={toggleOn} onChange={setToggleOn} label="Daily digest" />
                <span className="text-[14px]">Toggle</span>
              </div>
            </div>
            <p className="mt-[16px] font-mono text-[11px] text-muted-alt">
              Toggle track is the only rounded element in the system.
            </p>
          </Panel>
        </div>
      </Section>

      <Section n="08" title="Feed toggle · mentions · receipt" note="following/everything · lavender mention · one tap to source">
        <div className="grid gap-[20px] md:grid-cols-2">
          <Panel>
            <Label>Feed toggle - Following / Everything</Label>
            <FeedToggle value={feedMode} onChange={setFeedMode} />
            <div className="mt-[10px] font-mono text-[11px] text-muted-alt">Mode: {feedMode}</div>
          </Panel>
          <Panel>
            <Label>Mention chips (lavender) · receipt link</Label>
            <div className="flex flex-wrap gap-[8px]">
              <MentionChip>@TSM</MentionChip>
              <MentionChip>@HBM-memory</MentionChip>
              <MentionChip>@transformer-supply</MentionChip>
            </div>
            <div className="mt-[14px] flex flex-col items-start gap-[14px]">
              <ReceiptLink size="md">source: CRWV / customer concentration</ReceiptLink>
              <ReceiptLink size="md" className="bg-yellow">
                source: CORZ / financials
              </ReceiptLink>
            </div>
          </Panel>
        </div>
      </Section>

      <Section n="09" title="The post card - anatomy" note="the atom · a lone screenshot must carry its own credibility">
        <div className="max-w-[540px]">
          <PostCard post={POSTS.original} interactive />
        </div>
      </Section>

      <Section n="10" title="Post card variants" note="original · quote · reply · thread · high-stakes · open question">
        <div className="grid items-start gap-[20px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          <PostCard post={POSTS.quote} />
          <PostCard post={POSTS.reply} />
          <PostCard post={POSTS.thread} />
          <PostCard post={POSTS.high} />
          <PostCard post={POSTS.open} />
          <PostCard post={{ ...POSTS.original, following: true }} />
        </div>
      </Section>

      <Section n="11" title="Post card states" note="default · hover · focus · loading">
        <div className="grid items-start gap-[20px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          <div>
            <Label>Hover - lifts, gains shadow</Label>
            <PostCard post={POSTS.needs} className="-translate-x-0.5 -translate-y-0.5 shadow" />
          </div>
          <div>
            <Label>Focus - 2px pink ring</Label>
            <PostCard post={POSTS.needs} className="outline outline-2 outline-offset-2 outline-pink" />
          </div>
          <div>
            <Label>Loading - skeleton (no shimmer)</Label>
            <PostCardSkeleton />
          </div>
        </div>
      </Section>

      <Section n="12" title="Account tile" note="directory / list row">
        <div className="grid gap-[16px] md:grid-cols-2">
          <AccountTile account={{ handle: '@NVDA', kind: 'company', avatar: 'NVDA', desc: 'The imperial chip giant.' }} />
          <AccountTile
            account={{ handle: '@transformer-supply', kind: 'chokepoint', avatar: 'TRF', desc: 'The 3-year lead time nobody prices in.', following: true }}
          />
        </div>
      </Section>

      <Section n="13" title="You're caught up" note="the feed ends - proudly">
        <Terminator />
      </Section>

      <Section n="14" title="Kill-list card" note="a viral claim, killed with receipts">
        <div className="grid items-start gap-[20px] lg:grid-cols-2">
          <KillListCard
            claimId="claim #041"
            claim={'"WUS makes ~45% of NVIDIA’s switch PCBs"'}
            verdict="killed"
            verdictNote={<>not in the company&rsquo;s<br />own listing documents</>}
            explanation="The number circulating isn't in the company's own listing documents. Verified figures: 10.3% of datacenter PCBs, 12.5% of switch/router — a strong #1, not a near-monopoly."
            receipts="listing docs / PCB mix"
            related={['@NVDA']}
          />
          <div className="flex flex-col gap-[20px]">
            <KillListCard
              claimId="claim #038"
              claim={'"CoreWeave is 100% dependent on a single customer"'}
              verdict="survived"
              explanation="Confirmed in the 10-K. Colocation revenue is entirely one counterparty, financed by the same lender's collateral."
              receipts="CRWV 10-K"
              related={['@CRWV']}
            />
            <KillListCard
              claimId="claim #052"
              claim={'"Transformer lead times are over 3 years everywhere"'}
              verdict="partly"
              explanation="Large power transformers: yes, 128–144 weeks. Smaller distribution units are far shorter. The claim overgeneralizes."
              receipts="lead-time tracker"
              related={['@transformer-supply']}
            />
          </div>
        </div>
      </Section>

      <Section n="15" title="Tripwire rows" note="calm until it isn't · status is a square, never color alone">
        <div className="max-w-[620px] border bg-card">
          <TripwireGroupHeader account={{ handle: '@CORZ', kind: 'company', avatar: 'CORZ' }} />
          <TripwireRow
            status="fired"
            statement="Colocation revenue overtakes bitcoin mining revenue."
            when="fired Q1"
            postHref="#"
            showAccount={false}
          />
          <TripwireGroupHeader account={{ handle: '@transformer-supply', kind: 'chokepoint', avatar: 'TRF' }} />
          <TripwireRow
            status="armed"
            statement="Large-power-transformer lead times drop below 128–144 weeks."
            when="watching"
            showAccount={false}
            divider={false}
          />
        </div>
        <div className="mt-[20px] max-w-[620px] border bg-card">
          <Label>
            <span className="px-[16px] pt-[12px]">Ungrouped rows (inline account chip)</span>
          </Label>
          <TripwireRow
            status="fired"
            statement="Colocation revenue overtakes bitcoin mining revenue."
            account={{ handle: '@CORZ', kind: 'company' }}
            when="fired Q1"
            postHref="#"
          />
          <TripwireRow
            status="armed"
            statement="A second customer ends CoreWeave's single-tenant concentration."
            account={{ handle: '@CRWV', kind: 'company' }}
            when="watching"
            divider={false}
          />
        </div>
      </Section>

      <Section n="16" title="Paywall gate" note="honest - no blur-tease, no countdown, no fake scarcity">
        <div className="max-w-[560px]">
          <div className="border border-b-0 bg-card px-[18px] pt-[18px] pb-[6px]">
            <div className="font-mono font-bold text-[11px] uppercase tracking-[0.1em] text-muted">
              Section 1 · readable free
            </div>
            <p className="mt-[8px] mb-[14px] text-[15px] leading-[1.55]">
              CoreWeave&rsquo;s colocation revenue is 100% attributable to a single customer, financed by a $3.3B
              project bond at 7.75%. That is the whole first section - and it ends here, in plain text, not behind a
              blur.
            </p>
          </div>
          <PaywallGate />
        </div>
      </Section>
    </div>
  );
}
