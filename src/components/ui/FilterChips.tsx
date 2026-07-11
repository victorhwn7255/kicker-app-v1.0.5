'use client';

import { cn } from '@/lib/cn';

/**
 * A row of mutually-exclusive filter chips (Kill List: All/Killed/Survived/Partly;
 * Explore: Kind + Domain). Active chip is pink (or yellow for domain), with the hard shadow.
 */
export type FilterOption = { value: string; label: string };

export function FilterChips({
  options,
  value,
  onChange,
  active = 'pink',
  label,
  className,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  active?: 'pink' | 'yellow';
  label?: string;
  className?: string;
}) {
  const activeBg = active === 'pink' ? 'bg-pink' : 'bg-yellow';
  return (
    <div className={cn('flex flex-wrap items-center gap-[8px]', className)} role="group" aria-label={label}>
      {options.map((o) => {
        const isActive = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={isActive}
            className={cn(
              'border font-mono font-bold uppercase text-[11px] tracking-[0.04em] px-[11px] py-[4px] cursor-pointer',
              'transition-colors duration-[50ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:-outline-offset-2',
              isActive ? cn(activeBg, 'text-ink shadow') : 'bg-card text-ink hover:bg-surface-alt',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
