'use client';

import { useState } from 'react';
import type { KillListEntry } from '@/lib/types';
import { FilterChips } from '@/components/ui/FilterChips';
import { KillListCard } from '@/components/feed/KillListCard';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'killed', label: 'Killed' },
  { value: 'survived', label: 'Survived' },
  { value: 'partly', label: 'Partly true' },
];

/** Client island: holds the active verdict filter and renders the card grid. */
export function KillListBoard({ entries }: { entries: KillListEntry[] }) {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? entries : entries.filter((e) => e.verdict === filter);

  return (
    <div className="mx-auto w-full max-w-[1138px]">
      <div className="mb-[18px] flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-sans text-[26px] font-bold tracking-[-0.02em] md:text-[30px]">
            The Kill List
          </h1>
          <p className="mt-[6px] max-w-[520px] text-[15px] leading-[1.5]">
            Claims that went viral on real X, checked against primary sources. We publish the verdict
            and the receipt - whether it helps the narrative or not.
          </p>
        </div>
        <FilterChips
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          active="pink"
          label="Filter by verdict"
        />
      </div>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        {visible.map((e) => (
          <KillListCard
            key={e.id}
            claimId={e.id}
            claim={e.claim}
            verdict={e.verdict}
            verdictNote={e.verdict_note}
            explanation={e.explanation}
            receipts={e.receipts}
            related={e.related_accounts}
          />
        ))}
      </div>
    </div>
  );
}
