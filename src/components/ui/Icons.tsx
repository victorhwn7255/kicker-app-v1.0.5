/**
 * Inline stroke SVGs - 2px stroke, currentColor, no fill, no icon fonts, no emoji.
 * Geometry copied from design/wireframes/Component Library.dc.html so the chrome,
 * kind badges, avatars, and cards match the wireframe exactly.
 */
import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'strokeWidth'> & { size?: number };

function Svg({ size = 24, strokeWidth = 2, children, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ----- Bottom-nav glyphs ----- */

export function FeedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </Svg>
  );
}

export function ExploreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16 8 10.5 10.5 8 16 13.5 13.5" />
    </Svg>
  );
}

export function KillIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22.5" y2="12" />
    </Svg>
  );
}

export function TripIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 L22 20 H2 Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="12" y1="16.8" x2="12" y2="16.8" />
    </Svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 c0-5 4-7 8-7 s8 2 8 7" />
    </Svg>
  );
}

/* ----- Component icons ----- */

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </Svg>
  );
}

/** Share / copy-link - three connected nodes. */
export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </Svg>
  );
}

/** Company - building. */
export function CompanyIcon(props: IconProps) {
  return (
    <Svg strokeLinecap="butt" {...props}>
      <rect x="5" y="3" width="14" height="18" />
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
      <rect x="10" y="17" width="4" height="4" />
    </Svg>
  );
}

/** Chokepoint - funnel. */
export function ChokepointIcon(props: IconProps) {
  return (
    <Svg strokeLinecap="butt" {...props}>
      <polygon points="21 4 3 4 10 12.5 10 19 14 21 14 12.5" />
    </Svg>
  );
}

/** Theme - connected nodes. */
export function ThemeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="12" cy="18" r="2.4" />
      <line x1="7.6" y1="7.6" x2="10.6" y2="15.8" />
      <line x1="16.4" y1="7.6" x2="13.4" y2="15.8" />
      <line x1="8" y1="6" x2="16" y2="6" />
    </Svg>
  );
}

/** Warning triangle - tripwire fires. Pass stroke color via `stroke` (e.g. tier-disputed red). */
export function WarningIcon({ strokeWidth = 2.4, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg strokeWidth={strokeWidth} {...props}>
      <path d="M12 3 L22 20 H2 Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="12" y1="16.8" x2="12" y2="16.8" />
    </Svg>
  );
}

/** Lock - paywall gate. */
export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11 V7 a4 4 0 0 1 8 0 v4" />
    </Svg>
  );
}

/** Checkmark - checkbox. */
export function CheckIcon({ strokeWidth = 3, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg strokeWidth={strokeWidth} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
