'use client';

import { useState } from 'react';
import { FeedToggle, type FeedMode } from '@/components/ui/FeedToggle';

/**
 * Feed-mode toggle + its mono context label. A small client island: both modes
 * show every post for now (Phase 6 wires real filtering), so the toggle only
 * swaps the descriptor line beneath it.
 */
const LABEL: Record<FeedMode, string> = {
  following: 'FOLLOWING · your 6 accounts · newest first',
  everything: 'EVERYTHING · all 140 accounts · newest first',
};

export function FeedControls() {
  const [mode, setMode] = useState<FeedMode>('following');
  return (
    <div className="mb-[14px]">
      <FeedToggle value={mode} onChange={setMode} />
      <div className="mt-[14px] font-mono text-[11px] text-muted">{LABEL[mode]}</div>
    </div>
  );
}
