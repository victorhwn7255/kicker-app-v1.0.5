import { cn } from '@/lib/cn';
import { KIND_LABEL, type Kind } from '@/lib/kinds';
import { CompanyIcon, ChokepointIcon, ThemeIcon } from './Icons';

/**
 * Neutral (no accent) kind badge so it never competes with the tier chip.
 * `sm` is the in-card size used on PostCard; `default` is the standalone size.
 */
const ICON = { company: CompanyIcon, chokepoint: ChokepointIcon, theme: ThemeIcon };

const SIZE = {
  default: 'gap-[6px] px-[9px] py-[4px] text-[11px] tracking-[0.06em]',
  sm: 'gap-[4px] px-[6px] py-[2px] text-[9px] tracking-[0.05em]',
  xs: 'gap-[3px] px-[5px] py-0 text-[8px] tracking-[0.05em]',
};

const ICON_SIZE = { default: 13, sm: 10, xs: 9 };

export function KindBadge({
  kind,
  size = 'default',
  showIcon = true,
  className,
}: {
  kind: Kind;
  size?: 'default' | 'sm' | 'xs';
  showIcon?: boolean;
  className?: string;
}) {
  const Icon = ICON[kind];

  return (
    <span
      className={cn(
        'inline-flex items-center border bg-card font-mono font-bold uppercase leading-none',
        SIZE[size],
        className,
      )}
    >
      {showIcon && <Icon size={ICON_SIZE[size]} />}
      {KIND_LABEL[kind]}
    </span>
  );
}
