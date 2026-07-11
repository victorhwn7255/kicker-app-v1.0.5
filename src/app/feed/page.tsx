import type { Metadata } from 'next';
import { getPosts, attachReceipts } from '@/lib/content';
import { PostCard } from '@/components/feed/PostCard';
import { Terminator } from '@/components/feed/Terminator';
import { FeedControls } from './FeedControls';
import { RightRail } from './RightRail';

export const metadata: Metadata = {
  title: 'Feed - Ticker',
  description:
    'The calm, reverse-chron feed of Ticker: every post sourced, confidence-labeled, and it ends on purpose.',
};

export const revalidate = 300;

export default async function FeedPage() {
  const items = await attachReceipts(await getPosts());

  return (
    <div className="flex items-start justify-center gap-[24px] py-[24px]">
      {/* Feed column */}
      <div className="w-full max-w-[640px] flex-none md:w-[640px]">
        <FeedControls />
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
      </div>

      {/* Right rail (desktop only) */}
      <RightRail />
    </div>
  );
}
