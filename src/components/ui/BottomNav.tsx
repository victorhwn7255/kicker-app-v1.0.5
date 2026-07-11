'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { FeedIcon, ExploreIcon, KillIcon, TripIcon, ProfileIcon } from './Icons';

/**
 * Mobile chrome: 56px yellow bottom nav, five tabs, active tab = pink filled
 * square behind the icon (0 radius). Hidden on desktop. Links are static now;
 * routes light up as later phases build the screens.
 */
const TABS = [
  { label: 'FEED', href: '/feed', Icon: FeedIcon, match: (p: string) => p.startsWith('/feed') },
  { label: 'EXPLORE', href: '/explore', Icon: ExploreIcon, match: (p: string) => p.startsWith('/explore') },
  { label: 'KILL', href: '/kill-list', Icon: KillIcon, match: (p: string) => p.startsWith('/kill-list') },
  { label: 'TRIP', href: '/tripwires', Icon: TripIcon, match: (p: string) => p.startsWith('/tripwires') },
  { label: 'PROFILE', href: '/profile', Icon: ProfileIcon, match: (p: string) => p.startsWith('/profile') || p.startsWith('/u/') },
];

export function BottomNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t bg-yellow md:hidden"
    >
      {TABS.map(({ label, href, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            // prefetch off until later phases build these routes - avoids 404
            // prefetch noise in the console for the not-yet-existing screens.
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:-outline-offset-2"
          >
            <span className={cn('flex h-8 w-8 items-center justify-center', active && 'bg-pink')}>
              <Icon size={20} />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
