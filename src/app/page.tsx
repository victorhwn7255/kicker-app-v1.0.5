import Link from 'next/link';

export default function Home() {
  return (
    <section className="py-16 md:py-24">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
        Phase 0 · Scaffold
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Ticker is on rails.</h1>
      <p className="post-body mt-4 max-w-[640px] text-lg">
        The frame, the design tokens, the fonts, and the chrome are installed. Product screens land in
        the phases ahead - this is just the skeleton they build on.
      </p>

      <div className="mt-8 inline-block border bg-card p-5 shadow">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
          Design system check
        </p>
        <p className="mt-1">2px black borders · 0px radius · one hard shadow.</p>
        <Link
          href="/dev/tokens"
          className="mt-3 inline-block border-b border-ink pb-0.5 font-mono text-sm font-bold uppercase hover:bg-yellow"
        >
          View token swatches →
        </Link>
      </div>
    </section>
  );
}
