import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { grotesk, mono } from '@/lib/fonts';
import { TopBar } from '@/components/ui/TopBar';
import { BottomNav } from '@/components/ui/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ticker - the anti-fintwit',
  description: "Sourced. Confidence-labeled. Allowed to say “we don’t know.”",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body className="font-sans">
        <TopBar />
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-24 md:px-6 md:pb-10">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
