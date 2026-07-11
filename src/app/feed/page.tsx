import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts, attachReceipts } from '@/lib/content';
import { getUser } from '@/lib/auth';
import { getFollowedHandles } from '@/lib/follows';
import type { FeedMode } from '@/components/ui/FeedToggle';
import { PostCard } from '@/components/feed/PostCard';
import { Terminator } from '@/components/feed/Terminator';
import { Button } from '@/components/ui/Button';
import { FeedControls } from './FeedControls';
import { RightRail } from './RightRail';

export const metadata: Metadata = {
  title: 'Feed - Ticker',
  description:
    'The calm, reverse-chron feed of Ticker: every post sourced, confidence-labeled, and it ends on purpose.',
};

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode: modeParam } = await searchParams;
  const user = await getUser();
  const mode: FeedMode = modeParam === 'following' && user ? 'following' : 'everything';

  let posts = await getPosts();
  let followingCount = 0;
  if (user) {
    const followed = await getFollowedHandles();
    followingCount = followed.size;
    if (mode === 'following') posts = posts.filter((p) => followed.has(p.handle));
  }
  const items = await attachReceipts(posts);
  const emptyFollowing = mode === 'following' && items.length === 0;

  return (
    <div className="flex items-start justify-center gap-[24px] py-[24px]">
      {/* Feed column */}
      <div className="w-full max-w-[640px] flex-none md:w-[640px]">
        <FeedControls mode={mode} signedIn={!!user} followingCount={followingCount} />

        {emptyFollowing ? (
          <div className="border bg-band p-[24px] text-center shadow">
            <div className="text-[17px] font-bold">Your Following feed is empty.</div>
            <p className="post-body mx-auto mt-[8px] max-w-[380px] text-[14px] leading-[1.55] text-muted">
              Follow a few companies, chokepoints, and themes and this feed fills with only what you chose.
            </p>
            <div className="mt-[14px] flex justify-center gap-[10px]">
              <Button variant="subscribe" size="md" href="/explore">
                Explore accounts →
              </Button>
              <Button variant="secondary" size="md" href="/onboarding">
                Pick a bundle
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-[14px]">
              {items.map(({ post, receiptHref }) => (
                <PostCard
                  key={post.id ?? post.handle + post.time}
                  post={post}
                  receiptHref={receiptHref}
                  interactive
                />
              ))}
            </div>
            <Terminator className="mt-[14px] max-w-none" />
          </>
        )}
      </div>

      {/* Right rail (desktop only) */}
      <RightRail signedIn={!!user} />
    </div>
  );
}
