import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPosts } from '@/lib/content';
import { PostCard } from '@/components/feed/PostCard';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { RailCard } from '@/components/ui/RailCard';
import { TierChip } from '@/components/ui/TierChip';
import { Button } from '@/components/ui/Button';
import { ReceiptPanel } from './ReceiptPanel';

async function getPost(postId: string) {
  return (await getPosts()).find((p) => p.id === postId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) return {};
  const title = `${post.handle} on Ticker`;
  const description = post.body.length > 157 ? `${post.body.slice(0, 157)}...` : post.body;
  return { title, description, openGraph: { title, description } };
}

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.filter((p) => p.id).map((p) => ({ postId: p.id! }));
}

export default async function PostPermalinkPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();

  const replies = (await getPosts()).filter((p) => p.replyTo === post.handle);

  return (
    <div className="py-[24px]">
      {/* Mobile explainer strip */}
      <div className="mb-[14px] border bg-surface-alt px-[12px] py-[10px] md:hidden">
        <div className="font-mono font-bold text-[10px] uppercase tracking-[0.08em]">
          You&rsquo;re reading one post on Ticker
        </div>
        <p className="mt-[5px] text-[12.5px] leading-[1.5]">
          Every account is a company, chokepoint, or theme. Every post is built only from verified
          research - with a receipt.
        </p>
      </div>

      <div className="flex items-start justify-center gap-[24px]">
        {/* Reading column */}
        <div className="w-full max-w-[600px] flex-none">
          <div className="mb-[8px] font-mono font-bold text-[10px] uppercase tracking-[0.1em] text-muted">
            ▸ the shared post
          </div>
          <div className="shadow">
            <PostCard post={post} />
          </div>
          <ReceiptPanel post={post} />

          {replies.length > 0 && (
            <>
              <SectionDivider className="mt-[22px] mb-[14px]">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </SectionDivider>
              <div className="flex flex-col gap-[14px]">
                {replies.map((reply) => (
                  <PostCard key={reply.id ?? reply.handle + reply.time} post={reply} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right rail (desktop only) */}
        <aside className="hidden w-[300px] flex-none md:block">
          <RailCard
            headerBg="yellow"
            header={<span className="font-bold text-[15px]">New here? How to read this.</span>}
          >
            <p className="mb-[12px] text-[13px] leading-[1.55]">
              Ticker is the anti-FinTwit: no opinions, no hype, no buy/sell. Every post carries a{' '}
              <b>confidence tier</b> and a <b>receipt</b>.
            </p>
            <div className="flex flex-col items-start gap-[7px]">
              <TierChip tier="solid" size="inline" />
              <TierChip tier="needs" size="inline" />
              <TierChip tier="disputed" size="inline" />
            </div>
            <div className="mt-[14px] border-t pt-[12px]">
              <div className="font-bold text-[14px]">Follow the supply chain.</div>
              <p className="mt-[5px] mb-[12px] font-mono text-[11px] leading-[1.5] text-muted">
                Sign up to follow accounts and get a calm daily digest - free.
              </p>
              <Button variant="subscribe" href="/pricing" className="w-full">
                Create free account
              </Button>
            </div>
          </RailCard>
        </aside>
      </div>
    </div>
  );
}
