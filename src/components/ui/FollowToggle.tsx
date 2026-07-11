'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FollowButton } from './FollowButton';
import { setFollow } from '@/app/actions/follow';

/**
 * The stateful follow control: reuses the Phase 1 FollowButton (never forks it),
 * persists via the server action, and optimistically flips. A signed-out tap
 * routes to /auth instead of writing.
 */
export function FollowToggle({
  handle,
  following: initial,
  signedIn,
  size = 'sm',
  className,
}: {
  handle: string;
  following: boolean;
  signedIn: boolean;
  size?: 'md' | 'sm' | 'xs';
  className?: string;
}) {
  const [following, setFollowing] = useState(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onToggle = () => {
    if (!signedIn) {
      router.push('/auth');
      return;
    }
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const result = await setFollow(handle, next);
      setFollowing(result);
    });
  };

  return <FollowButton following={following} size={size} onToggle={onToggle} className={className} />;
}
