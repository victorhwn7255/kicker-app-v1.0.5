import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getAccounts } from '@/lib/content';
import { getFollowedHandles } from '@/lib/follows';
import { OnboardingFlow } from './OnboardingFlow';

export const metadata: Metadata = { title: 'Follow a few · Ticker' };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/auth');

  const [accounts, followed] = await Promise.all([getAccounts(), getFollowedHandles()]);

  return (
    <OnboardingFlow
      accounts={accounts.map((a) => ({ handle: a.handle, kind: a.kind, avatar: a.avatar, desc: a.desc }))}
      initialFollowed={[...followed]}
    />
  );
}
