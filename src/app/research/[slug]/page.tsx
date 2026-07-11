import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/cn';
import { getResearchPage } from '@/lib/content';
import { getUser, canReadFullResearch } from '@/lib/auth';
import type { ResearchSection, Tier } from '@/lib/types';
import { TierChip } from '@/components/ui/TierChip';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { PaywallGate } from '@/components/wiki/PaywallGate';
import { LockIcon } from '@/components/ui/Icons';

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getResearchPage(slug);
  if (!page) return {};
  const free = page.sections.find((s) => !s.locked);
  const body = free?.body?.replace(/\s+/g, ' ').trim() ?? '';
  const description = body.length > 155 ? `${body.slice(0, 152).trimEnd()}...` : body;
  return { title: page.title, description };
}

export default async function ResearchPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getResearchPage(slug);
  if (!page) notFound();

  const user = await getUser();
  const unlocked = canReadFullResearch(user);

  const sections = page.sections;
  const freeIndex = sections.findIndex((s) => !s.locked);
  const free = sections[freeIndex];
  const lockedSections = sections
    .map((s, i) => ({ section: s, number: i + 1 }))
    .filter((x) => x.section.locked);
  const tierLegend = [...new Set(sections.map((s) => s.tier).filter(Boolean))] as Tier[];

  const eyebrow = ['Research page', page.account, page.kind, page.domain].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto flex max-w-[848px] flex-col py-4 md:flex-row md:items-start md:gap-[28px] md:py-7">
      {/* TOC (desktop) */}
      <aside className="hidden self-start md:sticky md:top-4 md:block md:w-[220px] md:flex-none">
        <div className="mb-[12px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
          On this page
        </div>
        <nav className="flex flex-col gap-[2px]">
          {sections.map((s) =>
            s.locked && !unlocked ? (
              <div
                key={s.slug}
                className="flex items-center gap-[8px] border-l-[3px] border-transparent px-[10px] py-[7px] text-muted"
              >
                <LockIcon size={12} className="flex-none" />
                <span className="text-[13px]">{s.title}</span>
              </div>
            ) : (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="flex items-center gap-[8px] border-l-[3px] border-ink bg-card px-[10px] py-[7px]"
              >
                <span className="h-[9px] w-[9px] flex-none border bg-tier-solid" />
                <span className="text-[13px] font-bold">{s.title}</span>
              </a>
            ),
          )}
        </nav>

        <div className="mt-[18px] border bg-card p-[11px]">
          <div className="mb-[8px] font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
            Tiers on this page
          </div>
          <div className="flex flex-col items-start gap-[6px]">
            {tierLegend.map((tier) => (
              <TierChip key={tier} tier={tier} size="mini" />
            ))}
          </div>
        </div>
      </aside>

      {/* reading column */}
      <article className="w-full md:w-[600px] md:flex-none">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{eyebrow}</div>
        <h1 className="mt-[9px] text-[26px] font-bold leading-[1.05] tracking-[-0.01em] md:text-[34px] md:tracking-[-0.02em]">
          {page.title}
        </h1>
        <div className="mt-[12px] flex items-center gap-[8px] font-mono text-[12px] text-muted">
          <span className="inline-block h-[10px] w-[10px] flex-none border bg-tier-solid" />
          {page.freshness} · {page.section_count} sections · every claim sourced
        </div>

        {unlocked ? (
          /* Signed in: the full page - every section, no gate. */
          <div className="mt-[20px] flex flex-col">
            {sections.map((s, i) => (
              <FullSection key={s.slug} section={s} number={i + 1} first={i === freeIndex} />
            ))}
          </div>
        ) : (
          <>
            {/* free section - ends on a hard edge, no blur */}
            {free && <FullSection section={free} number={freeIndex + 1} first />}

            {/* the honest gate - free-first: create a free account */}
            <PaywallGate
              className="mt-[24px]"
              title="The rest is a free read."
              subtitle={`${lockedSections.length} more tier-annotated sections + open questions`}
              includes={[
                'Full research page with every receipt',
                '"What would prove this wrong" block',
                'A calm daily digest of what actually changed',
              ]}
              ctaLabel="Create a free account to read the rest"
              ctaHref="/auth"
              reassurance="Free · no card · you only read"
            />

            {/* honest locked list - no blur, just locked */}
            <div className="mt-[24px]">
              <div className="mb-[12px] font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                Behind the gate - no blur, just locked
              </div>
              <div className="flex flex-col gap-[10px]">
                {lockedSections.map(({ section, number }) => (
                  <LockedRow key={section.slug} section={section} number={number} />
                ))}
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

/** A fully-readable section (free section, or any section once unlocked). */
function FullSection({
  section,
  number,
  first,
}: {
  section: ResearchSection;
  number: number;
  first?: boolean;
}) {
  return (
    <section
      id={section.slug}
      className={cn('border-t-2 border-ink pt-[20px]', !first && 'mt-[24px]')}
    >
      <div className="flex flex-wrap items-center gap-[12px]">
        <span className="font-mono text-[13px] text-muted">§{number}</span>
        <h2 className="text-[22px] font-bold">{section.title}</h2>
        {section.tier && <TierChip tier={section.tier} qualifier={section.qualifier} size="post" />}
      </div>
      {section.body ? (
        <p className="post-body mt-[14px] whitespace-pre-line text-[15px] leading-[1.65] md:text-[17px] md:leading-[1.7]">
          {section.body}
        </p>
      ) : section.descriptor ? (
        <p className="mt-[14px] text-[15px] leading-[1.6] text-muted">{section.descriptor}</p>
      ) : null}
      {section.receipt && (
        <div className="mt-[16px]">
          <ReceiptLink size="md">receipt: {section.receipt}</ReceiptLink>
        </div>
      )}
    </section>
  );
}

function LockedRow({ section, number }: { section: ResearchSection; number: number }) {
  return (
    <div className="flex items-center gap-[12px] border bg-band px-[16px] py-[14px]">
      <LockIcon size={16} className="flex-none text-muted" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold md:text-[16px]">
          §{number} · {section.title}
        </div>
        {section.descriptor && (
          <div className="mt-[2px] font-mono text-[11px] text-muted">{section.descriptor}</div>
        )}
      </div>
      {section.tier && <TierChip tier={section.tier} size="mini" className="flex-none" />}
    </div>
  );
}
