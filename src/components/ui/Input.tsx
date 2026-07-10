import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Text input with the honest pink focus ring (border + hard pink shadow). */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border bg-card font-sans text-[14px] px-[14px] py-[10px] outline-none',
        'placeholder:text-muted-alt focus:border-pink focus:shadow-hard-pink',
        className,
      )}
      {...props}
    />
  );
}
