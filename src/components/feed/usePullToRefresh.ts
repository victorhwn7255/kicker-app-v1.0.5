'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Pull-to-refresh for the window-scrolled feed. Dependency-free, matching the
 * hand-rolled infinite scroll. The live drag drives the indicator element DIRECTLY
 * via its ref (inline height/opacity) - never React state - so a pull does not
 * re-render the 30 PostCards on every touchmove. React only flips `disabled` (while
 * refreshing) and owns the discrete refresh spinner.
 *
 * The touchmove listener is NON-PASSIVE so it can preventDefault the browser's own
 * pull-to-refresh / rubber-band, but only while genuinely pulling down at the very
 * top (scrollY <= 0); every other move returns immediately so normal scrolling is
 * untouched.
 */
export const PULL_THRESHOLD = 64; // px of damped pull past which release triggers a refresh
export const MAX_PULL = 110; // visual cap on the indicator height

/** Rubber-band damping: raw finger travel -> shown pull distance, softly capped. */
export function resistance(rawDelta: number): number {
  if (rawDelta <= 0) return 0;
  return Math.min(rawDelta * 0.5, MAX_PULL);
}

/** Release past the threshold fires the refresh. */
export function shouldRefresh(distance: number): boolean {
  return distance >= PULL_THRESHOLD;
}

export function usePullToRefresh({
  indicatorRef,
  onRefresh,
  disabled,
}: {
  indicatorRef: RefObject<HTMLElement | null>;
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const dist = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const paint = (d: number, animate = false) => {
      const el = indicatorRef.current;
      if (!el) return;
      el.style.transition = animate ? 'height 0.2s ease, opacity 0.2s ease' : 'none';
      el.style.height = `${d}px`;
      el.style.opacity = d > 0 ? String(Math.min(1, d / PULL_THRESHOLD)) : '0';
    };
    const reset = (animate = true) => {
      pulling.current = false;
      startY.current = null;
      dist.current = 0;
      paint(0, animate);
    };

    const onStart = (e: TouchEvent) => {
      if (disabledRef.current || e.touches.length !== 1 || window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
      dist.current = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null || disabledRef.current) return;
      if (window.scrollY > 0) {
        reset();
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        // finger moved back up (or a downward scroll): abandon the gesture, no snap needed
        if (pulling.current) paint(0);
        pulling.current = false;
        dist.current = 0;
        return;
      }
      pulling.current = true;
      dist.current = resistance(dy);
      // Suppress the browser's native pull-to-refresh / rubber-band while we own the pull.
      if (e.cancelable) e.preventDefault();
      paint(dist.current);
    };
    const onEnd = () => {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      const fire = shouldRefresh(dist.current);
      reset();
      if (fire) void onRefreshRef.current();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [indicatorRef]);
}
