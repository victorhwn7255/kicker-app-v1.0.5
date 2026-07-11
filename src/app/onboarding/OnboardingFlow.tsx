'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FollowButton } from '@/components/ui/FollowButton';
import { seedFollows } from '@/app/actions/follow';
import type { Kind } from '@/lib/types';

type Acct = { handle: string; kind: Kind; avatar?: string; desc: string };

const BUNDLES = [
  {
    title: 'Own NVDA? Follow its supply chain.',
    blurb: 'The chokepoints and themes that decide how the NVDA story actually plays out.',
    handles: ['@TSM', '@HBM-memory', '@transformer-supply'],
  },
  {
    title: 'Watching CoreWeave? Follow the risk.',
    blurb: 'The company, its landlord, and who really holds the risk.',
    handles: ['@CRWV', '@CORZ', '@who-holds-the-risk'],
  },
];

export function OnboardingFlow({
  accounts,
  initialFollowed,
}: {
  accounts: Acct[];
  initialFollowed: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialFollowed));
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const byHandle = new Map(accounts.map((a) => [a.handle, a]));

  const toggle = (h: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(h)) n.delete(h);
      else n.add(h);
      return n;
    });
  const addAll = (hs: string[]) => setSelected((s) => new Set([...s, ...hs.filter((h) => byHandle.has(h))]));

  const cont = () =>
    startTransition(async () => {
      await seedFollows([...selected]);
      router.push('/feed');
      router.refresh();
    });

  return (
    <section className="mx-auto max-w-[720px] py-[24px] md:py-[40px]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Step 2 of 2</div>
      <h1 className="mt-[8px] text-[26px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px]">
        Follow a few. Your feed fills with only what you chose.
      </h1>
      <p className="post-body mt-[10px] max-w-[560px] text-[15px] leading-[1.55] text-muted">
        Start with a supply chain - one company pulls in the chokepoints and themes that decide its fate. Or
        pick by hand. Change it anytime.
      </p>

      {/* Bundles */}
      <div className="mt-[24px] grid gap-[16px] md:grid-cols-2">
        {BUNDLES.map((b) => {
          const present = b.handles.filter((h) => byHandle.has(h));
          const allOn = present.every((h) => selected.has(h));
          return (
            <div key={b.title} className="flex flex-col border bg-card p-[16px] shadow">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                Bundle · supply chain
              </div>
              <div className="mt-[6px] text-[16px] font-bold leading-[1.25]">{b.title}</div>
              <p className="mt-[6px] font-mono text-[11px] leading-[1.5] text-muted">{b.blurb}</p>
              <div className="mt-[12px] flex flex-wrap gap-[6px]">
                {present.map((h) => (
                  <span
                    key={h}
                    className={cn(
                      'border px-[8px] py-[3px] font-mono text-[11px]',
                      selected.has(h) ? 'bg-pink' : 'bg-band',
                    )}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <Button
                variant={allOn ? 'following' : 'subscribe'}
                size="md"
                onClick={() => addAll(present)}
                className="mt-[14px] w-full"
              >
                {allOn ? 'All added ✓' : `Follow all ${present.length}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Pick by hand */}
      <div className="mt-[28px] font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
        Or pick by hand
      </div>
      <div className="mt-[12px] flex flex-col gap-[8px]">
        {accounts.map((a) => (
          <div key={a.handle} className="flex items-center gap-[12px] border bg-card px-[12px] py-[10px]">
            <Avatar kind={a.kind} text={a.avatar} size={40} className="flex-none" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[14px] font-bold">{a.handle}</div>
              <div className="truncate text-[12px] text-muted">{a.desc}</div>
            </div>
            <FollowButton
              following={selected.has(a.handle)}
              size="sm"
              onToggle={() => toggle(a.handle)}
              className="flex-none"
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-[80px] mt-[28px] md:bottom-[16px]">
        <Button variant="subscribe" size="lg" onClick={cont} disabled={pending} className="w-full shadow-hard-yellow">
          {pending
            ? 'Setting up…'
            : selected.size > 0
              ? `Continue to your feed (${selected.size}) →`
              : 'Skip for now →'}
        </Button>
      </div>
    </section>
  );
}
