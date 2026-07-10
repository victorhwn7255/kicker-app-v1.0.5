import { cn } from '@/lib/cn';
import type { Kind } from '@/lib/kinds';
import { Avatar } from './Avatar';
import { KindBadge } from './KindBadge';
import { FollowButton } from './FollowButton';

/**
 * Directory / list row: avatar + handle + kind badge + one-line descriptor + Follow.
 * Ported from design/wireframes/AccountTile.dc.html.
 */
export type AccountTileData = {
  handle: string;
  kind: Kind;
  avatar?: string;
  desc: string;
  following?: boolean;
};

export function AccountTile({
  account,
  onFollowToggle,
  className,
}: {
  account: AccountTileData;
  onFollowToggle?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-[11px] border bg-card p-[12px] shadow', className)}>
      <Avatar kind={account.kind} text={account.avatar} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[6px]">
          <span className="font-mono font-bold text-[13px]">{account.handle}</span>
          <KindBadge kind={account.kind} size="xs" showIcon={false} />
        </div>
        <div className="mt-[5px] text-[12.5px] leading-[1.4]">{account.desc}</div>
      </div>
      <FollowButton following={account.following} size="xs" onToggle={onFollowToggle} className="flex-none" />
    </div>
  );
}
