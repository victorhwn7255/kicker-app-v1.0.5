import { cn } from '@/lib/cn';
import { TIER, tierLabel, type Tier } from '@/lib/tiers';

/**
 * The two-cell trust stamp: a glyph cell divided by a 2px rule from the label cell.
 * The label carries the meaning; color only reinforces it. `aria-hidden` on the glyph
 * so assistive tech reads the label text, never the decorative symbol.
 */
type Size = 'hero' | 'post' | 'inline' | 'mini';

const SIZE: Record<Size, { glyph: string; label: string; tracking: string }> = {
  hero: { glyph: 'px-[11px] py-[7px] text-[15px]', label: 'px-[13px] py-[7px] text-[13px]', tracking: 'tracking-[0.05em]' },
  post: { glyph: 'px-[7px] py-[4px] text-[12px]', label: 'px-[9px] py-[4px] text-[11px]', tracking: 'tracking-[0.04em]' },
  inline: { glyph: 'px-[5px] py-[2px] text-[10px]', label: 'px-[7px] py-[2px] text-[10px]', tracking: 'tracking-[0.03em]' },
  mini: { glyph: 'px-[5px] py-[2px] text-[9px]', label: 'px-[6px] py-[2px] text-[9px]', tracking: 'tracking-[0.03em]' },
};

export function TierChip({
  tier,
  qualifier,
  size = 'post',
  label,
  className,
}: {
  tier: Tier;
  qualifier?: string;
  size?: Size;
  /** Overrides the composed label (e.g. the compact "Open" used inside quote insets). */
  label?: string;
  className?: string;
}) {
  const t = TIER[tier];
  const s = SIZE[size];
  const text = label ?? tierLabel(tier, qualifier);

  return (
    <span
      className={cn(
        'inline-flex items-stretch border font-mono font-bold uppercase leading-none',
        s.tracking,
        className,
      )}
    >
      <span
        className={cn('flex items-center justify-center border-r', t.glyphBg, t.glyphColor, s.glyph)}
        aria-hidden="true"
      >
        {t.glyph}
      </span>
      <span className={cn('flex items-center', t.labelBg, t.labelColor, s.label)}>{text}</span>
    </span>
  );
}
