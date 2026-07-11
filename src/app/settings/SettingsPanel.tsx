'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Settings body. Free-first: account + email prefs only, no subscription section.
 * The pref toggles are the app's only rounded element. Persistence of prefs lands
 * with email (Phase 8); here they are the UI the digest will read.
 */
function PrefRow({
  title,
  note,
  checked,
  onChange,
}: {
  title: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-[16px] border-b py-[14px] last:border-b-0">
      <div className="min-w-0">
        <div className="text-[15px] font-bold">{title}</div>
        <div className="mt-[2px] font-mono text-[11px] leading-[1.5] text-muted">{note}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} className="mt-[2px]" />
    </div>
  );
}

export function SettingsPanel({ email }: { email: string }) {
  const [digest, setDigest] = useState(true);
  const [tripwire, setTripwire] = useState(false);
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="border bg-card p-[18px] shadow">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Account</div>
        <div className="mt-[8px] text-[15px]">
          Signed in as <b>{email}</b>
        </div>
        <p className="mt-[6px] font-mono text-[11px] leading-[1.55] text-muted">
          Magic-link only - no password to manage. You only ever read; Ticker never posts as you.
        </p>
      </div>

      <div className="border bg-card p-[18px] shadow">
        <div className="mb-[4px] font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          Email &amp; alerts
        </div>
        <PrefRow
          title="Daily digest"
          note="A calm summary of what actually changed - new posts, kill-list, tripwires."
          checked={digest}
          onChange={setDigest}
        />
        <PrefRow
          title="Tripwire alerts"
          note="A single email the moment a light turns red - nothing else."
          checked={tripwire}
          onChange={setTripwire}
        />
        <p className="mt-[10px] font-mono text-[10px] text-muted">Email delivery arrives in a later update.</p>
      </div>

      <div>
        <Button variant="secondary" size="md" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
