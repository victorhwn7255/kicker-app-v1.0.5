import type { Config } from 'tailwindcss';

/**
 * Ticker design tokens - "Neo-brutalist paper terminal".
 * Source of truth: design/README.md "Design Tokens (quick reference)".
 * Where references/slock-theme.json disagrees with the README, the README wins.
 *
 * The palette, radius, and shadow scales are REPLACED (not extended) so the
 * only easy options are the correct ones: 0px radius everywhere and a single
 * hard, un-blurred shadow. There is deliberately no blurred shadow and no
 * non-zero radius (besides the settings-toggle `pill`) to reach for by accident.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Closed palette - each accent has exactly one job.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#FFFFFF',
      ink: '#000000', // text, borders
      page: '#FFF8E7', // app/page background (cream)
      card: '#FFFFFF', // post cards, panels, tiles
      band: '#FDF6E3', // trust band / quoted insets / section fills
      'surface-alt': '#FFF4CC', // explainer strips, onboarding row tint
      yellow: '#FFD700', // chrome only + "needs checking" tier
      pink: '#FF6B9D', // follow / active states
      cyan: {
        DEFAULT: '#5BC0EB', // subscribe / sign-up / primary conversion CTAs
        hover: '#4AAFDA',
      },
      salmon: '#F4845F', // reply / thread connective tissue
      lavender: '#C4B5FD', // @-mention and account-reference chips
      muted: '#6B6B6B', // metadata, secondary text on light
      'muted-alt': '#767676', // placeholder / tertiary
      'on-dark': '#A0A0A0', // secondary text on black surfaces
      'on-dark-alt': '#E0E0E0',
      'check-green': '#2DC653', // pricing feature checks
      tier: {
        solid: '#7FE08A',
        needs: '#FFD700',
        disputed: '#FF7A7A',
        // "open question" uses an ink glyph cell + white label cell (no fill token).
      },
    },
    // 0 radius is the default. `pill` is the single exception (settings toggle track).
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      pill: '9999px',
    },
    // One shadow: hard, offset, never blurred. No size variants exist.
    boxShadow: {
      none: 'none',
      DEFAULT: '2px 2px 0 0 #000000',
      hard: '2px 2px 0 0 #000000',
      'hard-yellow': '2px 2px 0 0 #FFD700',
      'hard-pink': '2px 2px 0 0 #FF6B9D',
    },
    extend: {
      fontFamily: {
        // Wired to next/font CSS variables (see src/lib/fonts.ts).
        sans: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // Default border is 2px solid ink; `border-4` (4px) stays available for
      // reply left borders and blockquote/inset accents.
      borderWidth: {
        DEFAULT: '2px',
      },
      borderColor: {
        DEFAULT: '#000000',
      },
    },
  },
  plugins: [],
};

export default config;
