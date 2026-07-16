'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { AVATAR_STYLE, type Kind } from '@/lib/kinds';
import { ThemeIcon } from './Icons';

/**
 * Company accounts render their brand logo from `public/avatars/<TICKER>.png`,
 * resolved off the handle. Chokepoint/theme accounts (no logo) fall back to the
 * kind-keyed monogram tile or the theme nodes glyph - as does any company whose
 * image fails to load. The frame carries a soft 3px corner curve; `rounded` swaps
 * the hard 2px border for a hairline ring. Decorative (`aria-hidden`) - the
 * adjacent handle carries the identity.
 */
function monoFont(size: number): number {
  if (size <= 24) return 8;
  if (size <= 32) return 9;
  if (size <= 40) return 11;
  if (size <= 44) return 12;
  if (size <= 56) return 14;
  if (size <= 64) return 15;
  if (size <= 72) return 17;
  if (size <= 80) return 20;
  return Math.round(size * 0.25);
}

// The theme nodes glyph tracks the wireframe at the reference sizes (40 -> 19,
// 42 -> 20, 56 -> 26); other sizes scale proportionally.
function glyphSize(size: number): number {
  if (size === 40) return 19;
  if (size === 42) return 20;
  if (size === 56) return 26;
  return Math.round(size * 0.46);
}

export function Avatar({
  kind,
  text,
  handle,
  size = 42,
  rounded = false,
  className,
}: {
  kind: Kind;
  text?: string;
  /** `@TICKER`; when kind is `company`, resolves the logo at /avatars/TICKER.png. */
  handle?: string;
  size?: number;
  /** X-style: hairline ring instead of the hard 2px border (still a soft 3px square). */
  rounded?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const ticker = kind === 'company' ? handle?.replace(/^@/, '') : undefined;
  const logoSrc = ticker ? `/avatars/${ticker}.png` : undefined;
  const showImage = !!logoSrc && !imgError;

  const style = AVATAR_STYLE[kind];
  const showGlyph = kind === 'theme' && !text;

  return (
    <span
      className={cn(
        'inline-flex flex-none items-center justify-center overflow-hidden rounded-[3px] font-mono font-bold',
        rounded ? 'ring-1 ring-line' : 'border',
        style.bg,
        style.color,
        className,
      )}
      style={{ width: size, height: size, fontSize: showGlyph ? undefined : monoFont(size) }}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : showGlyph ? (
        <ThemeIcon size={glyphSize(size)} />
      ) : (
        text
      )}
    </span>
  );
}
