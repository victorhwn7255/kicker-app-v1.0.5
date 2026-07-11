'use client';

import { useState } from 'react';
import type { Account } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { FilterChips } from '@/components/ui/FilterChips';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { AccountTile } from '@/components/ui/AccountTile';
import { SearchIcon } from '@/components/ui/Icons';
import { profileHref } from '@/lib/links';
import type { Kind } from '@/lib/kinds';

const KIND_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'company', label: 'Companies' },
  { value: 'chokepoint', label: 'Chokepoints' },
  { value: 'theme', label: 'Themes' },
];

const SECTIONS: { kind: Kind; label: string }[] = [
  { kind: 'company', label: 'Companies' },
  { kind: 'chokepoint', label: 'Chokepoints' },
  { kind: 'theme', label: 'Themes' },
];

/** Client island: holds the search query + kind/domain filters and renders grouped tiles. */
export function ExploreDirectory({ accounts }: { accounts: Account[] }) {
  const presentDomains = Array.from(
    new Set(accounts.map((a) => a.domain).filter((d): d is string => Boolean(d))),
  );
  // Present domains first (active), then forward-looking domains shown muted per the wireframe.
  const domainOptions = Array.from(new Set([...presentDomains, 'Defense', 'Robotics'])).map((d) => ({
    value: d,
    label: d,
  }));

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [domain, setDomain] = useState(presentDomains[0] ?? domainOptions[0]?.value ?? '');

  const q = query.trim().toLowerCase();
  const filtered = accounts.filter((a) => {
    if (kind !== 'all' && a.kind !== kind) return false;
    if (domain && a.domain !== domain) return false;
    if (q && !(a.handle.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))) return false;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="relative mb-[16px] md:max-w-[360px]">
        <span className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-ink">
          <SearchIcon size={16} />
        </span>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search accounts…"
          aria-label="Search accounts"
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div className="mb-[10px] flex flex-wrap items-center gap-[10px]">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Kind:
        </span>
        <FilterChips
          options={KIND_FILTERS}
          value={kind}
          onChange={setKind}
          active="pink"
          label="Filter by kind"
        />
      </div>

      <div className="mb-[22px] flex flex-wrap items-center gap-[10px]">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          Domain:
        </span>
        <FilterChips
          options={domainOptions}
          value={domain}
          onChange={setDomain}
          active="yellow"
          label="Filter by domain"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-[13px] text-muted">No accounts match your filters.</p>
      ) : (
        <div className="flex flex-col gap-[24px]">
          {SECTIONS.map((s) => {
            const items = filtered.filter((a) => a.kind === s.kind);
            if (items.length === 0) return null;
            return (
              <div key={s.kind}>
                <SectionDivider className="mb-[14px]">{s.label}</SectionDivider>
                <div className="grid grid-cols-1 gap-[12px] md:grid-cols-2">
                  {items.map((a) => (
                    <AccountTile key={a.handle} account={a} href={profileHref(a.handle)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
