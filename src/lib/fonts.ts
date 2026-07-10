import { Space_Grotesk, Space_Mono } from 'next/font/google';

/**
 * Self-hosted at build time by next/font (no runtime request to Google Fonts).
 * The mono/grotesk split is a core brand signal: Grotesk for reading text,
 * Mono for handles, labels, timestamps, and all metadata.
 */
export const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});
