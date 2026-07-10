'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Square bordered icon button (share / copy-link). Requires an accessible `label`
 * since the icon itself is decorative. No shadow by default - matches its in-card use.
 */
export function IconButton({
  label,
  size = 34,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex flex-none items-center justify-center border bg-card cursor-pointer text-ink',
        'transition-[color,background-color,box-shadow,transform] duration-[50ms] hover:bg-surface-alt active:translate-x-0.5 active:translate-y-0.5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
