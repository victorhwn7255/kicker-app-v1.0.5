import type { Post } from '@/lib/types';
import { getResearchPage, postResearchSection } from '@/lib/content';
import { researchHref } from '@/lib/links';
import { TierChip } from '@/components/ui/TierChip';
import { FreshnessStamp } from '@/components/ui/FreshnessStamp';
import { Button } from '@/components/ui/Button';
import { LockIcon } from '@/components/ui/Icons';

/**
 * The receipt, opened. Attaches directly under the shared PostCard (border-t-0) and
 * shows exactly where the claim came from: the source location, an excerpt from the
 * research section (falling back to the post's source text), the trust stamp, and a
 * link into the full research page.
 */
export async function ReceiptPanel({ post }: { post: Post }) {
  const rs = await postResearchSection(post);
  const rp = rs ? await getResearchPage(rs.slug) : undefined;
  const section = rp?.sections.find((s) => s.slug === rs?.section);
  const excerpt = section?.body ?? post.source;
  const ticker = post.handle.replace(/^@/, '');
  const location = section
    ? `${ticker} · research page · § ${section.title.toLowerCase()}`
    : `${ticker} · research page`;

  return (
    <div className="border border-t-0 bg-card">
      <div className="flex items-center justify-between bg-ink px-[16px] py-[9px] text-white">
        <span className="font-mono font-bold text-[12px] uppercase tracking-[0.1em]">↳ The receipt</span>
        <span className="font-mono text-[11px] text-yellow">1 tap from the claim</span>
      </div>

      <div className="px-[16px] py-[18px]">
        <div className="font-mono text-[12px] text-muted">{location}</div>

        <div className="mt-[10px] whitespace-pre-line border border-l-4 border-l-ink bg-band px-[16px] py-[14px] text-[15px] leading-[1.6]">
          {excerpt}
        </div>

        <div className="mt-[14px] flex flex-wrap items-center gap-[12px]">
          <TierChip tier={post.tier} qualifier={post.qualifier} size="post" />
          <FreshnessStamp>{post.freshness}</FreshnessStamp>
          {rs && (
            <Button
              variant="secondary"
              href={researchHref(rs.slug, rs.section)}
              className="w-full gap-[8px] md:ml-auto md:w-auto"
            >
              <LockIcon size={14} />
              Open full research page →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
