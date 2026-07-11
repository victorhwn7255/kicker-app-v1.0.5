import type { Metadata } from 'next';
import { getKillList } from '@/lib/content';
import { KillListBoard } from './KillListBoard';

export const metadata: Metadata = {
  title: 'The Kill List · Ticker',
  description:
    'Viral claims checked against primary sources. We publish the verdict and the receipt - whether it helps the narrative or not.',
};

export const revalidate = 300;

export default async function KillListPage() {
  return (
    <section className="pt-[20px] md:pt-[28px]">
      <KillListBoard entries={await getKillList()} />
    </section>
  );
}
