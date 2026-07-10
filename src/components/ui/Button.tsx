'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * The button primitive. Every variant shares the stamp mechanics: instant color
 * swap on hover (<=50ms), stamp-press on active (translate 2px, shadow removed),
 * and a visible pink focus ring for keyboard users.
 */
type Variant = 'primary' | 'subscribe' | 'secondary' | 'follow' | 'following' | 'ghost';
type Size = 'lg' | 'md' | 'sm' | 'xs';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-yellow shadow hover:bg-pink hover:text-ink',
  subscribe: 'bg-cyan text-ink shadow hover:bg-cyan-hover',
  secondary: 'bg-card text-ink shadow hover:bg-surface-alt',
  follow: 'bg-card text-ink shadow hover:bg-pink',
  following: 'bg-pink text-ink shadow',
  ghost: 'border-transparent bg-transparent text-ink hover:border-ink hover:bg-black/5',
};

const SIZE: Record<Size, string> = {
  lg: 'text-[16px] px-[22px] py-[11px]',
  md: 'text-[15px] px-[16px] py-[8px]',
  sm: 'text-[13px] px-[12px] py-[6px]',
  xs: 'text-[12px] px-[11px] py-[5px]',
};

const BASE =
  'inline-flex items-center justify-center border font-sans font-bold cursor-pointer ' +
  // Transition the swap/press properties, not outline - the focus ring must be instant.
  'transition-[color,background-color,box-shadow,transform] duration-[50ms] ' +
  'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:border-[#D4D4D4] disabled:bg-[#F5F5F5] disabled:text-[#9E9E9E] ' +
  'disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0';

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  href,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; href?: string }) {
  const classes = cn(BASE, VARIANT[variant], SIZE[size], className);
  // Render as a link when href is given (pricing / paywall CTAs navigate).
  if (href !== undefined) {
    return <a href={href} className={classes} {...(props as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }
  return <button type={type} className={classes} {...props} />;
}
