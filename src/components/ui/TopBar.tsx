import Link from 'next/link';
import { SearchIcon } from './Icons';
import { Button } from './Button';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2';

/**
 * Desktop chrome: 58px yellow top bar - TICKER wordmark + tagline, search, sign-up.
 * Hidden on mobile, where the bottom nav is the chrome. Static links in Phase 3;
 * auth lands in Phase 6.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 hidden h-[58px] items-center justify-between gap-4 border-b bg-yellow px-6 md:flex">
      <div className="flex items-baseline gap-3">
        <Link href="/" className={`text-2xl font-bold tracking-tight text-ink ${focusRing}`}>
          TICKER
        </Link>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink">the anti-fintwit</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/explore"
          className={`flex min-w-[200px] items-center gap-2 border bg-card px-[10px] py-[6px] text-ink ${focusRing}`}
        >
          <SearchIcon size={16} />
          <span className="font-mono text-[12px] text-muted-alt">Search a claim, ticker…</span>
        </Link>
        <Button variant="subscribe" size="sm" href="/pricing">
          Sign up
        </Button>
      </div>
    </header>
  );
}
