import { cn } from '@/lib/cn';
import { TIER } from '@/lib/tiers';
import type { Post } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { KindBadge } from '@/components/ui/KindBadge';
import { TierChip } from '@/components/ui/TierChip';
import { FollowButton } from '@/components/ui/FollowButton';
import { IconButton } from '@/components/ui/IconButton';
import { ReceiptLink } from '@/components/ui/ReceiptLink';
import { FreshnessStamp } from '@/components/ui/FreshnessStamp';
import { WarningIcon, ShareIcon } from '@/components/ui/Icons';

/**
 * PostCard - the atom of the product. One data-driven card renders every variant,
 * and the trust band (tier chip + receipt + freshness) is structure, never optional:
 * a lone screenshot of one card must carry its own credibility.
 * Ported from design/wireframes/PostCard.dc.html.
 */
export type { Post };

export function PostCard({
  post,
  onReceipt,
  receiptHref = '#',
  onFollowToggle,
  interactive = false,
  className,
}: {
  post: Post;
  onReceipt?: (post: Post) => void;
  receiptHref?: string;
  onFollowToggle?: () => void;
  /** Feed cards lift on hover; static cards (permalinks) do not. */
  interactive?: boolean;
  className?: string;
}) {
  const isReply = post.variant === 'reply';
  const isThread = post.variant === 'thread';
  const isHigh = post.variant === 'high';
  const q = post.quoted;

  return (
    <article
      className={cn(
        'border bg-card text-ink',
        isReply ? 'border-l-4 border-l-salmon' : '',
        isHigh ? 'shadow' : '',
        interactive &&
          'transition-transform duration-[50ms] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow',
        className,
      )}
    >
      {isHigh && (
        <div className="flex items-center gap-[8px] bg-ink px-[16px] py-[7px] text-white">
          <WarningIcon size={15} className="text-tier-disputed" />
          <span className="font-mono font-bold text-[11px] uppercase tracking-[0.1em]">
            {post.highLabel ?? 'Tripwire fired'}
          </span>
        </div>
      )}

      <div className="px-[16px] pt-[14px] pb-[12px]">
        <div className="flex items-start gap-[11px]">
          <Avatar kind={post.kind} text={post.avatar} size={42} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-[7px]">
              <span className="font-mono font-bold text-[14px]">{post.handle}</span>
              <KindBadge kind={post.kind} size="sm" />
              <span className="font-mono text-[11px] text-muted">· {post.time}</span>
              {isThread && post.thread && (
                <span className="border bg-ink px-[7px] py-[1px] font-mono font-bold text-[10px] text-white">
                  {post.thread}
                </span>
              )}
            </div>
            {isReply && post.replyTo && (
              <div className="mt-[3px] font-mono text-[11px] text-salmon">↳ replying to {post.replyTo}</div>
            )}
          </div>

          <div className="flex flex-none items-center gap-[8px]">
            <IconButton label="Copy link to post">
              <ShareIcon size={15} />
            </IconButton>
            <FollowButton following={post.following} onToggle={onFollowToggle} />
          </div>
        </div>

        <p className="post-body mt-[11px] text-[16px] leading-[1.55]">{post.body}</p>

        {q && (
          <div className="mt-[11px] border bg-band px-[12px] py-[10px]">
            <div className="flex flex-wrap items-center gap-[6px]">
              <Avatar kind={q.kind} text={q.avatar} size={22} />
              <span className="font-mono font-bold text-[12px]">{q.handle}</span>
              {q.time && <span className="font-mono text-[10px] text-muted">· {q.time}</span>}
              <TierChip
                tier={q.tier}
                size="mini"
                label={q.tier === 'open' ? 'Open' : TIER[q.tier].base}
                className="ml-auto"
              />
            </div>
            <p className="mt-[7px] text-[13px] leading-[1.5]">{q.body}</p>
          </div>
        )}

        {isThread && post.threadNext && (
          <div className="mt-[12px] flex items-center gap-[8px]">
            <div className="h-[16px] w-[2px] bg-salmon" />
            <span className="font-mono text-[11px] text-muted">{post.threadNext}</span>
          </div>
        )}
      </div>

      <div className="border-t bg-band px-[16px] py-[11px]">
        <TierChip tier={post.tier} qualifier={post.qualifier} size="post" />
        <div className="mt-[9px] flex flex-wrap items-center justify-between gap-[12px]">
          <ReceiptLink href={receiptHref} onClick={onReceipt ? (e) => { e.preventDefault(); onReceipt(post); } : undefined}>
            source: {post.source}
          </ReceiptLink>
          <FreshnessStamp>{post.freshness}</FreshnessStamp>
        </div>
      </div>
    </article>
  );
}
