'use client';

import { cn } from '@/lib/cn';
import { CheckIcon } from './Icons';

/**
 * 24px square checkbox: black fill + white check when on. A visually-hidden native
 * input keeps it fully keyboard- and screen-reader-operable.
 */
export function Checkbox({
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
    <label className={cn('inline-flex cursor-pointer items-center gap-[8px]', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex h-[24px] w-[24px] flex-none items-center justify-center border bg-card text-white',
          'peer-checked:bg-ink peer-hover:bg-surface-alt peer-checked:peer-hover:bg-ink',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-pink peer-focus-visible:outline-offset-2',
        )}
      >
        {checked && <CheckIcon size={14} />}
      </span>
      <span className="text-[14px]">{label}</span>
    </label>
  );
}
