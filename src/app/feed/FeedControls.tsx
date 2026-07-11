'use client';

import { useRouter } from 'next/navigation';
import { FeedToggle, type FeedMode } from '@/components/ui/FeedToggle';

/**
 * Feed-mode toggle + its mono context label. Drives a real server query: switching
 * navigates to /feed (everything) or /feed?mode=following. Choosing Following while
 * signed out routes to /auth.
 */
export function FeedControls({
  mode,
  signedIn,
  followingCount,
}: {
  mode: FeedMode;
  signedIn: boolean;
  followingCount: number;
}) {
  const router = useRouter();

  const onChange = (m: FeedMode) => {
    if (m === mode) return;
    if (m === 'following' && !signedIn) {
      router.push('/auth');
      return;
    }
    router.push(m === 'following' ? '/feed?mode=following' : '/feed');
  };

  const label =
    mode === 'following'
      ? `FOLLOWING · your ${followingCount} ${followingCount === 1 ? 'account' : 'accounts'} · newest first`
      : 'EVERYTHING · every account · newest first';

  return (
    <div className="mb-[14px]">
      <FeedToggle value={mode} onChange={onChange} />
      <div className="mt-[14px] font-mono text-[11px] text-muted">{label}</div>
    </div>
  );
}
