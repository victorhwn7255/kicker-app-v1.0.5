'use client';

import { cn } from '@/lib/cn';

export type FeedMode = 'following' | 'everything';

/** Following / Everything segmented control. Active segment is pink. */
export function FeedToggle({
  value = 'everything',
  onChange,
  className,
}: {
  value?: FeedMode;
  onChange?: (mode: FeedMode) => void;
  className?: string;
}) {
  const options: { mode: FeedMode; label: string }[] = [
    { mode: 'following', label: 'Following' },
    { mode: 'everything', label: 'Everything' },
  ];
  return (
    <div className={cn('inline-flex border bg-card shadow', className)} role="group" aria-label="Feed mode">
      {options.map(({ mode, label }, i) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange?.(mode)}
          aria-pressed={value === mode}
          className={cn(
            'font-sans font-bold text-[14px] px-[20px] py-[9px] cursor-pointer transition-colors duration-[50ms]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:-outline-offset-2',
            i === 0 && 'border-r',
            value === mode ? 'bg-pink text-ink' : 'bg-card text-ink hover:bg-surface-alt',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
