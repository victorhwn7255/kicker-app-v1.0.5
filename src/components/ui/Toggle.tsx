'use client';

import { cn } from '@/lib/cn';

/**
 * The settings pill toggle - the ONLY rounded element in the entire system.
 * On = yellow track, black knob at right. role="switch" + keyboard-operable.
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  className,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-block h-[24px] w-[44px] flex-none border rounded-pill transition-colors duration-[50ms]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2',
        checked ? 'bg-yellow' : 'bg-[#D4D4D4]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-[1px] h-[18px] w-[18px] rounded-pill bg-ink transition-all duration-[50ms]',
          checked ? 'right-[1px]' : 'left-[1px]',
        )}
      />
    </button>
  );
}
