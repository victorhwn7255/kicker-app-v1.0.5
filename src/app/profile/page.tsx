import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { getFollowedHandles } from '@/lib/follows';
import { getAccounts } from '@/lib/content';
import { profileHref } from '@/lib/links';
import { AccountTile } from '@/components/ui/AccountTile';
import { Button } from '@/components/ui/Button';
import { SectionDivider } from '@/components/ui/SectionDivider';

export const metadata: Metadata = { title: 'Your profile · Ticker' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect('/auth');

  const [followed, accounts] = await Promise.all([getFollowedHandles(), getAccounts()]);
  const myAccounts = accounts.filter((a) => followed.has(a.handle));

  return (
    <section className="mx-auto max-w-[720px] py-[24px]">
      <header className="border bg-card p-[20px] shadow md:p-[26px]">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Signed in as</div>
        <div className="mt-[6px] text-[20px] font-bold md:text-[24px]">{user.email}</div>
        <p className="mt-[8px] font-mono text-[12px] leading-[1.55] text-muted">
          Magic-link only - no password. You only ever read; Ticker never posts as you.
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="secondary" size="md" href="/settings">
            Settings
          </Button>
          <Button variant="ghost" size="md" href="/explore">
            Find more to follow
          </Button>
        </div>
      </header>

      <SectionDivider className="mt-[24px]">
        Following · {myAccounts.length} {myAccounts.length === 1 ? 'account' : 'accounts'}
      </SectionDivider>

      {myAccounts.length === 0 ? (
        <div className="border bg-band p-[20px] text-center">
          <p className="text-[15px] leading-[1.55]">You don&rsquo;t follow anyone yet.</p>
          <div className="mt-[12px]">
            <Button variant="subscribe" size="md" href="/onboarding">
              Pick a few to follow →
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-[12px] md:grid-cols-2">
          {myAccounts.map((a) => (
            <AccountTile
              key={a.handle}
              account={{ handle: a.handle, kind: a.kind, avatar: a.avatar, desc: a.desc }}
              href={profileHref(a.handle)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
