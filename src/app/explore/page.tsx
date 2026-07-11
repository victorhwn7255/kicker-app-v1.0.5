import type { Metadata } from 'next';
import { getAccounts } from '@/lib/content';
import { ExploreDirectory } from './ExploreDirectory';

export const metadata: Metadata = {
  title: 'Explore · Ticker',
  description:
    'Browse accounts by kind and domain - companies, supply-chain chokepoints, and themes across the AI-datacenter domain.',
};

export const revalidate = 300;

export default async function ExplorePage() {
  return (
    <section className="pt-[20px] md:pt-[28px]">
      <ExploreDirectory accounts={await getAccounts()} />
    </section>
  );
}
