import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Token-swatch test page. Every swatch renders from a Tailwind token class
 * (not a hardcoded hex), so this page verifies the config is wired correctly.
 * Compare side-by-side with design/wireframes/Component Library.dc.html.
 */

const COLORS = [
  { name: 'page', hex: '#FFF8E7', cls: 'bg-page' },
  { name: 'card', hex: '#FFFFFF', cls: 'bg-card' },
  { name: 'band', hex: '#FDF6E3', cls: 'bg-band' },
  { name: 'surface-alt', hex: '#FFF4CC', cls: 'bg-surface-alt' },
  { name: 'ink', hex: '#000000', cls: 'bg-ink' },
  { name: 'yellow', hex: '#FFD700', cls: 'bg-yellow' },
  { name: 'pink', hex: '#FF6B9D', cls: 'bg-pink' },
  { name: 'cyan', hex: '#5BC0EB', cls: 'bg-cyan' },
  { name: 'salmon', hex: '#F4845F', cls: 'bg-salmon' },
  { name: 'lavender', hex: '#C4B5FD', cls: 'bg-lavender' },
  { name: 'muted', hex: '#6B6B6B', cls: 'bg-muted' },
  { name: 'muted-alt', hex: '#767676', cls: 'bg-muted-alt' },
  { name: 'check-green', hex: '#2DC653', cls: 'bg-check-green' },
];

const TIERS = [
  { name: 'solid', glyph: '✓', label: 'Solid', cls: 'bg-tier-solid', open: false },
  { name: 'needs', glyph: '~', label: 'Needs checking', cls: 'bg-tier-needs', open: false },
  { name: 'disputed', glyph: '✕', label: 'Disputed', cls: 'bg-tier-disputed', open: false },
  { name: 'open', glyph: '?', label: 'Open question', cls: 'bg-ink', open: true },
];

const SPACING = [
  { name: '1 · 4px', cls: 'w-1' },
  { name: '2 · 8px', cls: 'w-2' },
  { name: '3 · 12px', cls: 'w-3' },
  { name: '4 · 16px', cls: 'w-4' },
  { name: '6 · 24px', cls: 'w-6' },
  { name: '8 · 32px', cls: 'w-8' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function TokensPage() {
  return (
    <div className="py-10">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-muted">
        Dev · Token swatches
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Design tokens</h1>
      <p className="post-body mt-2 max-w-[640px] text-muted">
        Compare against Component Library.dc.html. Every value here is rendered from a Tailwind token,
        not a hardcoded hex.
      </p>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {COLORS.map((c) => (
            <div key={c.name} className="border bg-card">
              <div className={cn('h-16 border-b', c.cls)} />
              <div className="p-2">
                <p className="font-mono text-xs font-bold">{c.name}</p>
                <p className="font-mono text-xs text-muted">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tier chips (color reinforces, label carries meaning)">
        <div className="flex flex-wrap gap-3">
          {TIERS.map((t) => (
            <div key={t.name} className="inline-flex border">
              <span className={cn('flex items-center px-2 py-1 font-mono text-sm', t.cls, t.open && 'text-white')}>
                {t.glyph}
              </span>
              <span
                className={cn(
                  'border-l px-2 py-1 font-mono text-xs font-bold uppercase',
                  t.open ? 'bg-white' : t.cls,
                )}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <p className="text-2xl">Space Grotesk 400 - reading text</p>
          <p className="text-2xl font-bold">Space Grotesk 700 - display &amp; headings</p>
          <p className="font-mono">Space Mono 400 - @handle · verified 2d ago</p>
          <p className="font-mono font-bold uppercase tracking-wider">Space Mono 700 - LABEL</p>
          <p className="post-body max-w-[640px]">
            Body 16px / line-height 1.55 with text-wrap: pretty. The 90% of the product users actually
            read is set in Grotesk at this measure.
          </p>
        </div>
      </Section>

      <Section title="Borders &amp; radius">
        <div className="flex flex-wrap items-center gap-6">
          <div className="border bg-card p-4 font-mono text-xs">border · 2px solid ink · radius 0</div>
          <div className="border-4 bg-card p-4 font-mono text-xs">border-4 · 4px accent</div>
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-11 items-center rounded-pill border bg-yellow px-0.5">
              <span className="ml-auto h-4 w-4 bg-ink" />
            </div>
            <span className="font-mono text-xs text-muted">rounded-pill - settings toggle only</span>
          </div>
        </div>
      </Section>

      <Section title="Shadow (one hard offset, never blurred)">
        <div className="flex flex-wrap gap-8">
          <div className="border bg-card p-4 font-mono text-xs shadow">shadow · 2px 2px 0 0 #000</div>
          <div className="border bg-card p-4 font-mono text-xs shadow-hard-yellow">shadow-hard-yellow</div>
          <div className="border bg-card p-4 font-mono text-xs shadow-hard-pink">shadow-hard-pink</div>
        </div>
        <p className="mt-3 font-mono text-xs text-muted">No blurred shadow exists in the theme.</p>
      </Section>

      <Section title="Spacing (4 · 8 · 12 · 16 · 24 · 32)">
        <div className="space-y-2">
          {SPACING.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className={cn('h-4 bg-pink', s.cls)} />
              <span className="font-mono text-xs text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
