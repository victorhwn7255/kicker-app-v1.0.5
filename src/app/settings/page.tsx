import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { SettingsPanel } from './SettingsPanel';

export const metadata: Metadata = { title: 'Settings · Ticker' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/auth');

  return (
    <section className="mx-auto max-w-[620px] py-[24px]">
      <h1 className="mb-[18px] font-sans text-[26px] font-bold tracking-[-0.02em] md:text-[30px]">Settings</h1>
      <SettingsPanel email={user.email ?? ''} />
    </section>
  );
}
