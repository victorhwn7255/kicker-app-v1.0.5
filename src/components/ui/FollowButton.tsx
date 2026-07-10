'use client';

import { Button } from './Button';

/**
 * Follow <-> Following toggle. "Following" renders on pink; "Follow" is white and
 * fills pink on hover. `aria-pressed` exposes the toggle state to assistive tech.
 */
export function FollowButton({
  following = false,
  size = 'sm',
  onToggle,
  className,
}: {
  following?: boolean;
  size?: 'md' | 'sm' | 'xs';
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <Button
      variant={following ? 'following' : 'follow'}
      size={size}
      aria-pressed={following}
      onClick={onToggle}
      className={className}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
