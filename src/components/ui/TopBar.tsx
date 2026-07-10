import Link from 'next/link';

/**
 * Desktop chrome: 58px yellow top bar with the TICKER wordmark + mono tagline.
 * Static in Phase 0 (search + auth land in later phases). Hidden on mobile,
 * where the bottom nav is the chrome instead.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 hidden h-[58px] items-center border-b bg-yellow px-6 md:flex">
      <div className="flex items-baseline gap-3">
        <Link href="/" className="text-2xl font-bold tracking-tight text-ink">
          TICKER
        </Link>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink">
          the anti-fintwit
        </span>
      </div>
    </header>
  );
}
